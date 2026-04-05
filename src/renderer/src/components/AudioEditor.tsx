import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, Square, Save, Scissors, Plus } from 'lucide-react'

// WAV Encoder helper
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  let numOfChan = buffer.numberOfChannels,
      length = buffer.length * numOfChan * 2 + 44,
      bufferArray = new ArrayBuffer(length),
      view = new DataView(bufferArray),
      channels: Float32Array[] = [], i, sample,
      offset = 0,
      pos = 0;

  function setUint16(data: number) {
    view.setUint16(offset, data, true);
    offset += 2;
  }

  function setUint32(data: number) {
    view.setUint32(offset, data, true);
    offset += 4;
  }

  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"
  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit (hardcoded)
  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  for(i = 0; i < buffer.numberOfChannels; i++)
    channels.push(buffer.getChannelData(i));

  while(pos < buffer.length) {
    for(i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][pos]));
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
    pos++;
  }
  return bufferArray;
}

function sliceAudioBuffer(buffer: AudioBuffer, beginTime: number, endTime: number, audioContext: AudioContext): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const startOffset = Math.floor(Math.max(0, sampleRate * beginTime));
  const endOffset = Math.floor(Math.min(buffer.length, sampleRate * endTime));
  const frameCount = endOffset - startOffset;
  const newAudioBuffer = audioContext.createBuffer(buffer.numberOfChannels, frameCount, sampleRate);

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    const newChannelData = newAudioBuffer.getChannelData(channel);
    newChannelData.set(channelData.subarray(startOffset, endOffset));
  }

  return newAudioBuffer;
}

interface AudioEditorProps {
  filePath: string;
  lang: 'en' | 'ru';
  initialName?: string;
  onClose: () => void;
  onSave: (buffer: ArrayBuffer, name: string) => Promise<void>;
}

export function AudioEditor({ filePath, lang, initialName, onClose, onSave }: AudioEditorProps) {
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [pitch, setPitch] = useState(0); // in cents, -1200 to 1200
  const [bass, setBass] = useState(0); // in dB
  const [soundName, setSoundName] = useState(initialName || (lang === 'en' ? 'Crafted Sound' : 'Новый звук'));

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const playbackTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const t = {
    title: lang === 'en' ? 'AUDIO EDITOR' : 'РЕДАКТОР ЗВУКА',
    loading: lang === 'en' ? 'Processing Audio...' : 'Обработка...',
    save: lang === 'en' ? 'Save Sound' : 'Сохранить',
    cancel: lang === 'en' ? 'Cancel' : 'Отмена',
    name: lang === 'en' ? 'Sound Name' : 'Имя звука',
    preview: lang === 'en' ? 'Preview' : 'Прослушать',
    stop: lang === 'en' ? 'Stop' : 'Стоп',
    pitch: lang === 'en' ? 'Pitch Adjustment' : 'Тон звука',
    bass: lang === 'en' ? 'Bass Boost' : 'Бас'
  };

  useEffect(() => {
    let active = true;
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    async function load() {
      // @ts-ignore
      const arrayBuffer = await window.api.readFileBuffer(filePath);
      if (!arrayBuffer) return onClose();
      
      const decoded = await audioContextRef.current!.decodeAudioData(arrayBuffer);
      if (!active) return;
      
      setBuffer(decoded);
      setEndTime(decoded.duration);
      setIsLoading(false);
    }
    load();

    return () => {
      active = false;
      stopPlayback();
      audioContextRef.current?.close();
    };
  }, [filePath]);

  // Dedicated Waveform Rendering Effect
  useEffect(() => {
    if (isLoading || !buffer || !canvasRef.current) return;
    
    // Initial draw
    drawWaveform(buffer);

    // Re-draw on resize
    const resizeObserver = new ResizeObserver(() => {
        if (buffer) drawWaveform(buffer);
    });
    
    resizeObserver.observe(canvasRef.current.parentElement!);
    return () => resizeObserver.disconnect();
  }, [isLoading, buffer]);

  const drawWaveform = (buf: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const data = buf.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const midY = height / 2;
    
    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for(let x=0; x<width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Baseline for silence
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    // Waveform Path
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#a855f7'); // purple-500
    gradient.addColorStop(0.5, '#3b82f6'); // blue-500
    gradient.addColorStop(1, '#a855f7');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    
    // Top Path (Max values)
    ctx.beginPath();
    ctx.moveTo(0, midY);
    for(let i=0; i < width; i++) {
      let max = 0;
      for (let j=0; j<step; j++) {
        const datum = Math.abs(data[(i*step)+j]);
        if (datum > max) max = datum;
      }
      const y = midY - (max * midY * 0.9);
      ctx.lineTo(i, y);
    }
    ctx.stroke();

    // Bottom Path (Min values - Symmetrical)
    ctx.beginPath();
    ctx.moveTo(0, midY);
    for(let i=0; i < width; i++) {
        let max = 0;
        for (let j=0; j<step; j++) {
          const datum = Math.abs(data[(i*step)+j]);
          if (datum > max) max = datum;
        }
        const y = midY + (max * midY * 0.9);
        ctx.lineTo(i, y);
      }
    ctx.stroke();
  };

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e){}
      sourceNodeRef.current = null;
    }
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    setIsPlaying(false);
    setCurrentTime(startTime);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    if (!buffer || !audioContextRef.current) return;
    
    stopPlayback();
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.detune.value = pitch;
    
    // Bass Boost Filter
    const filter = audioContextRef.current.createBiquadFilter();
    filter.type = 'lowshelf';
    filter.frequency.value = 200;
    filter.gain.value = bass;

    source.connect(filter);
    filter.connect(audioContextRef.current.destination);
    
    // We need to account for playback speed change when setting the stop timeout/UI update
    const speed = Math.pow(2, pitch / 1200);
    const playDuration = (endTime - startTime) / speed;
    
    source.start(0, startTime, endTime - startTime);
    sourceNodeRef.current = source;
    setIsPlaying(true);
    setCurrentTime(startTime);
    startTimeRef.current = audioContextRef.current.currentTime;

    playbackTimerRef.current = window.setInterval(() => {
      const elapsed = audioContextRef.current!.currentTime - startTimeRef.current;
      const current = startTime + elapsed * speed;
      
      if (current >= endTime || elapsed >= playDuration) {
        stopPlayback();
      } else {
        setCurrentTime(current);
      }
    }, 1000/60);
  };

  const handleSave = async () => {
    if (!buffer || !audioContextRef.current) return;
    setIsLoading(true);
    
    // Calculate speed factor for proper length
    const speed = Math.pow(2, pitch / 1200);
    const originalSelectedDuration = endTime - startTime;
    const targetDuration = originalSelectedDuration / speed;
    
    // Create Offline Context to bake effects
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      Math.ceil(targetDuration * buffer.sampleRate),
      buffer.sampleRate
    );
    
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.detune.value = pitch;
    
    // Bass Boost Filter (Offline)
    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'lowshelf';
    filter.frequency.value = 200;
    filter.gain.value = bass;

    source.connect(filter);
    filter.connect(offlineCtx.destination);
    
    // Start source at 'startTime' relative to the original buffer
    source.start(0, startTime, originalSelectedDuration);
    
    const renderedBuffer = await offlineCtx.startRendering();
    const arrayBuffer = audioBufferToWav(renderedBuffer);
    await onSave(arrayBuffer, soundName);
    setIsLoading(false);
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = (time % 60).toFixed(2);
    return `${min}:${sec.padStart(5, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xl" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        className="relative bg-[#0f0f0f] border border-white/10 p-5 rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] w-full max-w-4xl max-h-[98vh] overflow-y-auto custom-scrollbar flex flex-col gap-3"
      >
        <div className="flex items-center gap-4 border-b border-white/5 pb-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <Scissors className="text-purple-400" />
          </div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">
            {t.title}
          </h2>
        </div>

        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 font-bold text-white/50 tracking-widest uppercase">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-purple-500 animate-spin" />
            {t.loading}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative h-32 bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
              <canvas ref={canvasRef} className="w-full h-full block" />
              
              {/* Playhead */}
              {isPlaying && (
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_15px_white] z-50 pointer-events-none"
                  style={{ left: `${(currentTime / buffer!.duration) * 100}%` }}
                />
              )}

              {/* Selection Overlay Left */}
              <div 
                className="absolute top-0 bottom-0 left-0 bg-black/70 backdrop-blur-[2px] z-10 transition-opacity"
                style={{ width: `${(startTime / buffer!.duration) * 100}%` }}
              />
              
              {/* Selection Overlay Right */}
              <div 
                className="absolute top-0 bottom-0 right-0 bg-black/70 backdrop-blur-[2px] z-10 transition-opacity"
                style={{ width: `${(1 - endTime / buffer!.duration) * 100}%` }}
              />

              {/* Start Handle */}
              <div 
                onPointerDown={(e) => {
                  const target = e.currentTarget;
                  target.setPointerCapture(e.pointerId);
                  const handleMove = (ev: PointerEvent) => {
                    const rect = target.parentElement!.getBoundingClientRect();
                    let perc = (ev.clientX - rect.left) / rect.width;
                    perc = Math.max(0, perc);
                    const newTime = perc * buffer!.duration;
                    if (newTime < endTime - 0.1) setStartTime(newTime);
                  };
                  const handleUp = (ev: PointerEvent) => {
                    target.releasePointerCapture(ev.pointerId);
                    target.removeEventListener('pointermove', handleMove);
                    target.removeEventListener('pointerup', handleUp);
                  };
                  target.addEventListener('pointermove', handleMove);
                  target.addEventListener('pointerup', handleUp);
                }}
                className="absolute top-0 bottom-0 w-10 -ml-5 z-40 cursor-col-resize flex items-center justify-center group/handle"
                style={{ left: `${(startTime / buffer!.duration) * 100}%` }}
              >
                <div className="w-1.5 h-full bg-blue-500/50 group-hover/handle:bg-blue-400 transition-all relative flex items-center justify-center">
                    <div className="w-4 h-12 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)] border border-white/20 flex flex-col items-center justify-center gap-1">
                        <div className="w-0.5 h-3 bg-white/40 rounded-full" />
                        <div className="w-0.5 h-3 bg-white/40 rounded-full" />
                    </div>
                </div>
              </div>

              {/* End Handle */}
              <div 
                onPointerDown={(e) => {
                  const target = e.currentTarget;
                  target.setPointerCapture(e.pointerId);
                  const handleMove = (ev: PointerEvent) => {
                    const rect = target.parentElement!.getBoundingClientRect();
                    let perc = (ev.clientX - rect.left) / rect.width;
                    perc = Math.min(1, perc);
                    const newTime = perc * buffer!.duration;
                    if (newTime > startTime + 0.1) setEndTime(newTime);
                  };
                  const handleUp = (ev: PointerEvent) => {
                    target.releasePointerCapture(ev.pointerId);
                    target.removeEventListener('pointermove', handleMove);
                    target.removeEventListener('pointerup', handleUp);
                  };
                  target.addEventListener('pointermove', handleMove);
                  target.addEventListener('pointerup', handleUp);
                }}
                className="absolute top-0 bottom-0 w-10 -ml-5 z-40 cursor-col-resize flex items-center justify-center group/handle"
                style={{ left: `${(endTime / buffer!.duration) * 100}%` }}
              >
                <div className="w-1.5 h-full bg-purple-500/50 group-hover/handle:bg-purple-400 transition-all relative flex items-center justify-center">
                    <div className="w-4 h-12 rounded-full bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)] border border-white/20 flex flex-col items-center justify-center gap-1">
                        <div className="w-0.5 h-3 bg-white/40 rounded-full" />
                        <div className="w-0.5 h-3 bg-white/40 rounded-full" />
                    </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-black text-white/40 tracking-widest uppercase px-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] opacity-30">START</span>
                <span className="text-blue-400 font-mono text-sm">{formatTime(startTime)}</span>
              </div>
              <div className="px-6 py-2 rounded-2xl bg-white/5 border border-white/5 text-center">
                <span className="text-[10px] opacity-30 block mb-0.5">SELECTION</span>
                <span className="text-white text-lg font-mono">{formatTime(endTime - startTime)}</span>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <span className="text-[10px] opacity-30">END</span>
                <span className="text-purple-400 font-mono text-sm">{formatTime(endTime)}</span>
              </div>
            </div>

            <div className="space-y-4 py-2">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1 block">
                   {t.name}
                 </label>
                 <input 
                    value={soundName}
                    onChange={(e) => setSoundName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
                 />
               </div>

               <div className="grid grid-cols-2 gap-8 items-start">
                 <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
                        {t.pitch}
                      </label>
                      <span className="text-xs font-mono text-purple-400 font-bold">
                        {pitch > 0 ? '+' : ''}{(pitch / 100).toFixed(1)} ST
                      </span>
                   </div>
                   <div className="flex items-center gap-4 pt-2">
                      <input 
                        type="range" 
                        min="-800" 
                        max="800" 
                        step="100"
                        value={pitch}
                        onChange={(e) => setPitch(parseInt(e.target.value))}
                        className="flex-1 h-1 bg-white/10 rounded-full appearance-none accent-purple-500 cursor-pointer"
                      />
                      <button 
                        onClick={() => setPitch(0)}
                        className="text-[9px] font-black text-white/20 hover:text-white transition-colors"
                      >
                        RESET
                      </button>
                   </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between items-center">
                       <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
                         {t.bass}
                       </label>
                       <span className="text-xs font-mono text-blue-400 font-bold">
                         {bass > 0 ? '+' : ''}{bass.toFixed(0)} dB
                       </span>
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                       <input 
                         type="range" 
                         min="-15" 
                         max="20" 
                         step="1"
                         value={bass}
                         onChange={(e) => setBass(parseFloat(e.target.value))}
                         className="flex-1 h-1 bg-white/10 rounded-full appearance-none accent-blue-500 cursor-pointer"
                       />
                       <button 
                         onClick={() => setBass(0)}
                         className="text-[9px] font-black text-white/20 hover:text-white transition-colors"
                       >
                         RESET
                       </button>
                    </div>
                  </div>
               </div>
            </div>

            <div className="flex gap-4 pt-1">
               <div className="flex-1 flex gap-3">
                 <button 
                   onClick={togglePlayback}
                   className={`flex-1 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 py-3.5 transition-all ${isPlaying ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                 >
                   {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                   {isPlaying ? t.stop : t.preview}
                 </button>
               </div>
            </div>

            <div className="flex gap-4 pt-1 border-t border-white/5">
                <button 
                  onClick={onClose}
                  className="px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-purple-600 hover:bg-purple-500 transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(168,85,247,0.3)]"
                >
                  <Save size={18} />
                  {t.save}
                </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
