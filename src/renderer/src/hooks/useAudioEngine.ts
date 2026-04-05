import { useState, useCallback, useEffect, useRef } from 'react'

export interface AudioDevice {
  deviceId: string
  label: string
}

export const useAudioEngine = () => {
  const [devices, setDevices] = useState<AudioDevice[]>([])
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([])
  const [playbackDevice, setPlaybackDevice] = useState(() => localStorage.getItem('soundpad_playback') || 'default')
  const [selectedMic, setSelectedMic] = useState(() => localStorage.getItem('soundpad_mic') || 'default')
  const [virtualDevice, setVirtualDevice] = useState(() => localStorage.getItem('soundpad_virtual') || '')
  
  const [isSmartMode, setIsSmartMode] = useState(() => localStorage.getItem('soundpad_smart') === 'true')
  const [hasDriver, setHasDriver] = useState(true)
  const [isInstallingDriver, setIsInstallingDriver] = useState(false)
  
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem('soundpad_volume') || '0.8'))
  const [injectionVolume, setInjectionVolume] = useState(() => parseFloat(localStorage.getItem('soundpad_inj_volume') || '0.8'))

  const [isPlaying, setIsPlaying] = useState(false)
  const activeAudiosRef = useRef<HTMLAudioElement[]>([])

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  
  // Professional Injection Hub Nodes
  const monitorGainRef = useRef<GainNode | null>(null)
  const injectionDestRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const injectionAudioRef = useRef<HTMLAudioElement | null>(null)
  const micNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.5
    
    const monitorGain = ctx.createGain()
    monitorGain.connect(ctx.destination) // Monitor Gain -> Speakers (Sound only)

    const injectionDest = ctx.createMediaStreamDestination()
    const injAudio = new Audio()
    injAudio.srcObject = injectionDest.stream
    injAudio.play().catch(() => {}) 

    audioContextRef.current = ctx
    analyserRef.current = analyser
    monitorGainRef.current = monitorGain
    injectionDestRef.current = injectionDest
    injectionAudioRef.current = injAudio

    return () => {
      ctx.close()
      micStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  // Auto-detect & Setup Smart Mode (Zero Echo)
  useEffect(() => {
    async function setupSmartMode() {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop())
      }
      if (micNodeRef.current) micNodeRef.current.disconnect()

      if (!isSmartMode || !audioContextRef.current || !injectionDestRef.current) return

      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices()
        const vCable = allDevices.find(d => 
          d.kind === 'audiooutput' && 
          (d.label.toLowerCase().includes('cable') || d.label.toLowerCase().includes('virtual') || d.label.toLowerCase().includes('vb-audio'))
        )
        
        if (vCable) {
          setVirtualDevice(vCable.deviceId)
          if (injectionAudioRef.current && 'setSinkId' in injectionAudioRef.current) {
            await (injectionAudioRef.current as any).setSinkId(vCable.deviceId)
          }
        }

        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        };
        
        if (selectedMic !== 'default' && selectedMic !== '') {
          audioConstraints.deviceId = { exact: selectedMic };
        }

        // Capture Mic and connect ONLY to Injection, NOT context.destination (No Echo)
        const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
        micStreamRef.current = stream
        const source = audioContextRef.current.createMediaStreamSource(stream)
        source.connect(injectionDestRef.current)
        micNodeRef.current = source
      } catch (err) {
        console.error('Smart Mode Failed:', err)
      }
    }
    setupSmartMode()
  }, [isSmartMode, selectedMic])

  useEffect(() => {
    localStorage.setItem('soundpad_playback', playbackDevice)
    localStorage.setItem('soundpad_virtual', virtualDevice)
    localStorage.setItem('soundpad_smart', isSmartMode ? 'true' : 'false')
    localStorage.setItem('soundpad_volume', volume.toString())
    localStorage.setItem('soundpad_inj_volume', injectionVolume.toString())
    localStorage.setItem('soundpad_mic', selectedMic)

    if (selectedMic && selectedMic !== 'default') {
      const micLabel = inputDevices.find(d => d.deviceId === selectedMic)?.label
      if (micLabel) {
        // @ts-ignore
        window.api.saveMicLabel(micLabel)
      }
    }
  }, [playbackDevice, virtualDevice, isSmartMode, volume, injectionVolume, selectedMic, inputDevices])

  const refreshDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const inDevices = allDevices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Mic ${device.deviceId.slice(0, 5)}...`
        }))
      setInputDevices(inDevices)

      const outputDevices = allDevices
        .filter(device => device.kind === 'audiooutput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Speaker ${device.deviceId.slice(0, 5)}...`
        }))
      setDevices(outputDevices)

      const vCable = outputDevices.find(d => 
        (d.label.toLowerCase().includes('cable') || d.label.toLowerCase().includes('virtual') || d.label.toLowerCase().includes('vb-audio'))
      )
      setHasDriver(!!vCable)
      if (vCable) {
        setVirtualDevice(vCable.deviceId)
      }
    } catch (err) {
      console.error('Failed to enumerate devices:', err)
    }
  }, [])

  const installDriver = useCallback(async () => {
    setIsInstallingDriver(true)
    try {
      await (window as any).api.installDriver()
      // Wait a bit for Windows to register the new audio device
      await new Promise(r => setTimeout(r, 4000))
      await refreshDevices()
    } catch (err: any) {
      console.error('Driver installation failed:', err)
      alert("ОШИБКА УСТАНОВКИ:\\n" + (err.message || err))
    } finally {
      setIsInstallingDriver(false)
    }
  }, [refreshDevices])

  useEffect(() => {
    refreshDevices()
  }, [refreshDevices])

  const stopSound = useCallback(() => {
    activeAudiosRef.current.forEach(audio => {
      audio.pause()
      audio.src = ''
    })
    activeAudiosRef.current = []
    setIsPlaying(false)
  }, [])

  const playSound = useCallback(async (audioUrl: string) => {
    stopSound()
    setIsPlaying(true)
    
    if (!audioContextRef.current || !monitorGainRef.current || !injectionDestRef.current) return

    // Convert local path to our custom protocol
    // encodeURI handles spaces while keeping : and / intact
    const encodedPath = encodeURI(audioUrl.replace(/\\/g, '/'))
    const protocolUrl = encodedPath.startsWith('local-file://') ? encodedPath : `local-file://${encodedPath}`

    // Resume context if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }

    // Path 1: Monitor Output (Your Headset) - respect device selection
    const monitorAudio = new Audio(protocolUrl)
    monitorAudio.volume = volume
    activeAudiosRef.current.push(monitorAudio)
    if ('setSinkId' in monitorAudio && playbackDevice && playbackDevice !== 'default') {
      await (monitorAudio as any).setSinkId(playbackDevice)
    }

    // Source for AudioContext-based paths (Injection + Visualizer)
    const soundAudio = new Audio(protocolUrl)
    soundAudio.crossOrigin = "anonymous"
    activeAudiosRef.current.push(soundAudio)
    const soundSource = audioContextRef.current.createMediaElementSource(soundAudio)

    // Path 2: Injection (Discord / V-Cable)
    if (isSmartMode && virtualDevice) {
      // Smart Mode: Mic + Sound mixed into V-Cable via AudioContext
      const injectionLocalGain = audioContextRef.current.createGain()
      injectionLocalGain.gain.value = injectionVolume
      soundSource.connect(injectionLocalGain)
      injectionLocalGain.connect(injectionDestRef.current)
    } else if (!isSmartMode && virtualDevice) {
      // Legacy Injection: Direct device output, no mic mixing
      const vAudio = new Audio(audioUrl)
      vAudio.volume = injectionVolume
      activeAudiosRef.current.push(vAudio)
      if ('setSinkId' in vAudio) await (vAudio as any).setSinkId(virtualDevice)
      vAudio.play().catch(() => {})
    }

    // Path 3: Visualizer Analyser (silent sink)
    if (analyserRef.current) {
      const visualsGain = audioContextRef.current.createGain()
      visualsGain.gain.value = 0
      soundSource.connect(analyserRef.current)
      analyserRef.current.connect(visualsGain)
      visualsGain.connect(audioContextRef.current.destination)
    }

    soundAudio.onended = () => {
      setIsPlaying(false)
      stopSound()
    }
    
    monitorAudio.play()
    soundAudio.play()
  }, [playbackDevice, virtualDevice, isSmartMode, volume, injectionVolume, stopSound])

  const getAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isPlaying) return 0
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
    const avg = sum / dataArray.length
    return Math.min(1, avg / 100)
  }, [isPlaying])

  return {
    devices,
    inputDevices,
    playbackDevice,
    setPlaybackDevice,
    selectedMic,
    setSelectedMic,
    virtualDevice,
    hasDriver,
    isInstallingDriver,
    installDriver,
    isSmartMode,
    setIsSmartMode,
    volume,
    setVolume,
    injectionVolume,
    setInjectionVolume,
    playSound,
    stopSound,
    refreshDevices,
    isPlaying,
    getAudioLevel
  }
}
