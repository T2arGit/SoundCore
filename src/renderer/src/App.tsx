import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Play, Plus, Search, Settings, Volume2, Mic, Music, Grid, Activity, VolumeX, RefreshCw, Scissors, Type, MoreVertical, Download, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudioEngine } from './hooks/useAudioEngine'
import { useHotkeys } from './hooks/useHotkeys'
import { AudioEditor } from './components/AudioEditor'
import appIcon from '../../../resources/icon.png'

interface Sound {
  id: string
  name: string
  path: string
  shortcut: string
  color: string
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const TRANSLATIONS = {
  en: {
    settings: "SETTINGS",
    config: "Configure Audio & System",
    playback: "Playback Device",
    mic_input: "Main Microphone",
    mic: "Mic Injection Output",
    inj_volume: "Injection Gain",
    master: "Master Gain",
    guide: "Injection Guide",
    step1: "1. Enable Soundpad Mode (Mixed Mode).",
    step2: "2. In Windows Sound, set V-Cable as Default Mic.",
    engine: "Soundcore Engine",
    version: "Stable Version 1.0.4",
    standby: "STANDBY",
    no_signal: "NO SIGNAL",
    active: "OUTPUT ACTIVE",
    ready: "ENGINE READY",
    library: "Library",
    manage: "Manage your audio arsenal",
    find: "FIND SOUND...",
    import: "Import Sound",
    none: "No matches found",
    lang: "Language / Язык",
    rename: "Rename",
    delete: "Delete",
    change_hk: "Change Hotkey",
    clear_hk: "Clear Hotkey",
    edit: "Edit Sound",
    save: "Save",
    cancel: "Cancel",
    no_hk: "NO HOTKEY",
    craft: "Audio Redaction",
    craft_desc: "Adjust & Trim Audio"
  },
  ru: {
    settings: "НАСТРОЙКИ",
    config: "Настройка аудио и системы",
    playback: "Устройство воспроизведения",
    mic_input: "Основной микрофон",
    mic: "Выход инъекции (V-Cable)",
    inj_volume: "Громкость инъекции",
    master: "Общая громкость",
    guide: "Инструкция по настройке",
    step1: "1. Включите Режим Soundpad.",
    step2: "2. В Windows выберите V-Cable микрофоном по умолчанию.",
    engine: "Движок Soundcore",
    version: "Стабильная версия 1.0.4",
    standby: "ОЖИДАНИЕ",
    no_signal: "НЕТ СИГНАЛА",
    active: "ВЫХОД АКТИВЕН",
    ready: "ДВИЖОК ГОТОВ",
    library: "Библиотека",
    manage: "Управляйте своим аудио-арсеналом",
    find: "ПОИСК ЗВУКА...",
    import: "Импорт звука",
    none: "Ничего не найдено",
    lang: "Язык / Language",
    rename: "Переименовать",
    delete: "Удалить",
    change_hk: "Изменить хоткей",
    clear_hk: "Очистить хоткей",
    edit: "Изменить звук",
    save: "Сохранить",
    cancel: "Отмена",
    no_hk: "НЕТ ХОТКЕЯ",
    craft: "Редактор звука",
    craft_desc: "Настройка и обрезка"
  }
}

const SoundCard = ({ sound, play, isPlaying, isFlashing, index, onContextMenu }: { sound: Sound, play: (s: Sound) => void, isPlaying: boolean, isFlashing: boolean, index: number, onContextMenu: (e: React.MouseEvent, id: string) => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    animate={{ 
      opacity: 1, 
      scale: isFlashing ? [1, 1.05, 1] : 1,
      y: 0,
      backgroundColor: isPlaying ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)'
    }}
    transition={{ delay: index * 0.02, scale: { duration: 0.3 } }}
    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
    onContextMenu={(e) => onContextMenu(e, sound.id)}
    className={`relative group p-5 rounded-3xl border transition-all duration-300 backdrop-blur-md overflow-hidden flex flex-col gap-4 cursor-default ${isPlaying ? 'border-primary shadow-[0_0_30px_rgba(59,130,246,0.3)]' : 'border-white/5 hover:border-white/20'}`}
  >
    {/* Animated Background Glow */}
    <div 
      className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-[40px] -z-10 bg-gradient-radial from-[${sound.color}] to-transparent pointer-events-none`} 
      style={{ background: `radial-gradient(circle at center, ${sound.color}, transparent 70%)` }} 
    />
    
    {/* Visual Flash Effect */}
    <AnimatePresence>
      {isFlashing && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0] }}
          className="absolute inset-0 bg-white z-10 pointer-events-none"
        />
      )}
    </AnimatePresence>

    <div className="flex items-center justify-between">
      <div 
        onClick={(e) => { e.stopPropagation(); play(sound); }}
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-inner cursor-pointer hover:scale-105"
        style={{ backgroundColor: `${sound.color}20`, color: sound.color }}
      >
        <Play size={20} fill={isPlaying ? sound.color : "none"} className={isPlaying ? 'animate-pulse' : ''} />
      </div>
      <div 
        onClick={(e) => { e.stopPropagation(); onContextMenu(e, sound.id); }}
        className="w-8 h-8 -mr-2 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/40 hover:text-white cursor-pointer"
      >
        <MoreVertical size={18} />
      </div>
    </div>

    <div className="space-y-1 flex-1 flex flex-col justify-end">
      <h3 className="font-bold text-sm tracking-tight text-white/90 group-hover:text-white transition-colors truncate">{sound.name}</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sound.color }} />
        </div>
        <div>
          {sound.shortcut ? (
            <div className="bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 flex items-center gap-1.5 shadow-sm">
              <kbd className="text-[10px] font-bold text-white/60 tracking-tight">{sound.shortcut}</kbd>
            </div>
          ) : (
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.1em]">NO HOTKEY</span>
          )}
        </div>
      </div>
    </div>
  </motion.div>
)

export default function App() {
  const { 
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
  } = useAudioEngine()

  const [sounds, setSounds] = useState<Sound[]>([])

  const visualizerRef = useRef<HTMLDivElement>(null)

  const [activeSoundId, setActiveSoundId] = useState<string | null>(null)
  const [flashingSoundId, setFlashingSoundId] = useState<string | null>(null)

  const activeSoundIdRef = useRef(activeSoundId)
  const isPlayingRef = useRef(isPlaying)

  useEffect(() => {
    activeSoundIdRef.current = activeSoundId
  }, [activeSoundId])

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState<'library' | 'editor'>('library')
  const [audioEditorState, setAudioEditorState] = useState<{isOpen: boolean, filePath?: string, editingSoundId?: string, initialName?: string}>({ isOpen: false })
  const [lang, setLang] = useState<'en' | 'ru'>(() => {
    return (localStorage.getItem('soundpad_lang') as 'en' | 'ru') || 'en'
  })

  useEffect(() => {
    localStorage.setItem('soundpad_lang', lang)
  }, [lang])

  const t = TRANSLATIONS[lang]

  // Sync activeSoundId with actual playback state
  useEffect(() => {
    if (!isPlaying) {
      setActiveSoundId(null)
    }
  }, [isPlaying])

  // Realtime Audio Visualizer
  useEffect(() => {
    let animationFrameId: number
    const renderLoop = () => {
      if (visualizerRef.current) {
        if (activeSoundId) {
          const level = getAudioLevel()
          const widthPerc = Math.max(0, level * 100) 
          visualizerRef.current.style.width = `${widthPerc}%`
          visualizerRef.current.style.opacity = `${0.5 + level * 0.5}`
        } else {
          visualizerRef.current.style.width = `0%`
          visualizerRef.current.style.opacity = '0'
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop)
    }
    renderLoop()
    return () => cancelAnimationFrame(animationFrameId)
  }, [activeSoundId, getAudioLevel])

  // Load sounds on mount
  useEffect(() => {
    const load = async () => {
      // @ts-ignore
      const savedSounds = await window.api.loadSounds()
      if (savedSounds && savedSounds.length > 0) {
        setSounds(savedSounds)
      }
    }
    load()
  }, [])

  // Save sounds whenever they change
  useEffect(() => {
    const save = async () => {
      // @ts-ignore
      await window.api.saveSounds(sounds)
    }
    if (sounds.length > 0) save()
  }, [sounds])

  const filteredSounds = useMemo(() => 
    sounds.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [sounds, searchQuery]
  )

  const handlePlay = useCallback((sound: Sound) => {
    if (activeSoundId === sound.id && isPlaying) {
      stopSound()
      setActiveSoundId(null)
    } else {
      setActiveSoundId(sound.id)
      playSound(sound.path)
    }
  }, [playSound, stopSound, activeSoundId, isPlaying])

  const handleImport = useCallback(async () => {
    // @ts-ignore
    const filePath = await window.api.selectFile()
    if (filePath) {
      // @ts-ignore
      const persistentPath = await window.api.copySound(filePath)
      if (persistentPath) {
        const newSound: Sound = {
          id: Date.now().toString(),
          name: persistentPath.split(/[\\/]/).pop()?.split('_').slice(1).join('_').replace(/\.[^/.]+$/, "") || (lang === 'en' ? 'New Sound' : 'Новый звук'),
          path: persistentPath,
          shortcut: '',
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        }
        setSounds(prev => [...prev, newSound])
      }
    }
  }, [])

  const handleCraftClick = async () => {
    // @ts-ignore
    const filePath = await window.api.selectFile()
    if (filePath) {
      setAudioEditorState({ isOpen: true, filePath })
    }
  }

  const soundsRef = useEffect(() => {
    const ref = { current: sounds }
    return () => {}
  }, [sounds])
  // Actually, a simpler way in React is to just use a ref for the sounds list
  const soundsListRef = useRef(sounds)
  useEffect(() => {
    soundsListRef.current = sounds
  }, [sounds])

  // Register Hotkeys
  useHotkeys(useCallback((combo) => {
    console.log(`[RENDERER] Global Hotkey Received: ${combo}`)
    const sound = soundsListRef.current.find(s => s.shortcut === combo)
    if (sound) {
      console.log(`[RENDERER] Triggering Sound Toggle: ${sound.name}`)
      // Toggle logic for hotkeys
      if (activeSoundIdRef.current === sound.id && isPlayingRef.current) {
        stopSound()
        setActiveSoundId(null)
      } else {
        handlePlay(sound)
        setFlashingSoundId(sound.id)
        setTimeout(() => setFlashingSoundId(null), 300)
      }
    }
  }, [handlePlay, stopSound]))

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, soundId: string } | null>(null)
  const [editingSoundId, setEditingSoundId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editType, setEditType] = useState<'name' | 'shortcut'>('name')
  const [isRecording, setIsRecording] = useState(false)

  const handleContextMenu = (e: React.MouseEvent, soundId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, soundId })
  }

  const handleEditSound = (id: string) => {
    const sound = sounds.find(s => s.id === id)
    if (sound) {
      setAudioEditorState({ 
        isOpen: true, 
        filePath: sound.path, 
        editingSoundId: id,
        initialName: sound.name
      })
    }
    setContextMenu(null)
  }

  const handleDelete = (id: string) => {
    setSounds(prev => prev.filter(s => s.id !== id))
    setContextMenu(null)
  }

  const startEdit = (id: string, type: 'name' | 'shortcut') => {
    const sound = sounds.find(s => s.id === id)
    if (sound) {
      setEditingSoundId(id)
      setEditType(type)
      setEditValue(type === 'name' ? sound.name : sound.shortcut)
      setIsRecording(type === 'shortcut') // Start recording immediately for hotkeys
    }
    setContextMenu(null)
  }

  const saveEdit = () => {
    if (editingSoundId) {
      setSounds(prev => prev.map(s => 
        s.id === editingSoundId 
          ? { ...s, [editType]: editValue } 
          : s
      ))
      setEditingSoundId(null)
    }
  }

  const clearHotkey = (id: string) => {
    setSounds(prev => prev.map(s => 
      s.id === id ? { ...s, shortcut: '' } : s
    ))
    setContextMenu(null)
  }

  const ContextMenu = ({ x, y, soundId }: { x: number, y: number, soundId: string }) => (
    <>
      <div 
        className="fixed inset-0 z-[100]" 
        onClick={() => setContextMenu(null)}
        onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ top: y, left: x }}
        className="fixed z-[101] bg-surface/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl py-2 min-w-[160px] overflow-hidden"
      >
        <button 
          onClick={() => startEdit(soundId, 'name')}
          className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-white/10 flex items-center gap-2 transition-colors"
        >
          <span className="opacity-40">📝</span> {t.rename}
        </button>
        <button 
          onClick={() => startEdit(soundId, 'shortcut')}
          className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-white/10 flex items-center gap-2 transition-colors"
        >
          <span className="opacity-40 text-primary">⌨️</span> {t.change_hk}
        </button>
        <button 
          onClick={() => clearHotkey(soundId)}
          className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-white/10 flex items-center gap-2 transition-colors"
        >
          <span className="opacity-40 text-red-400/60">🚫</span> {t.clear_hk}
        </button>
        <button 
          onClick={() => handleEditSound(soundId)}
          className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-purple-500/10 flex items-center gap-2 transition-colors"
        >
          <span className="opacity-40 text-purple-400">✂️</span> {t.edit}
        </button>
        <div className="h-px bg-white/5 my-1" />
        <button 
          onClick={() => handleDelete(soundId)}
          className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-red-500/10 text-red-400 flex items-center gap-2 transition-colors"
        >
          <span className="opacity-40">🗑️</span> {t.delete}
        </button>
      </motion.div>
    </>
  )

  const EditModal = () => {
    useEffect(() => {
      if (editType === 'shortcut' && isRecording) {
        const handleKeyDown = (e: KeyboardEvent) => {
          e.preventDefault()
          e.stopPropagation()
          
          if (e.key === 'Escape') {
            setIsRecording(false)
            return
          }

          if (e.key === 'Backspace') {
            setEditValue('')
            return
          }

          const modifiers = []
          if (e.ctrlKey) modifiers.push('CTRL')
          if (e.altKey) modifiers.push('ALT')
          if (e.shiftKey) modifiers.push('SHIFT')
          if (e.metaKey) modifiers.push('META')

          const key = e.key.toUpperCase()
          // Filter out standalone modifiers and common layout-changing keys
          const isModifier = ['CONTROL', 'ALT', 'SHIFT', 'META', 'ALTGRAPH', 'CAPSLOCK'].includes(key)
          
          if (!isModifier) {
            // Handle some naming discrepancies between KeyboardEvent and node-global-key-listener
            let mappedKey = key
            if (key === 'ESCAPE') mappedKey = 'ESC'
            if (key === ' ') mappedKey = 'SPACE'
            if (key === 'ENTER') mappedKey = 'ENTER'
            if (key === 'ARROWUP') mappedKey = 'UP'
            if (key === 'ARROWDOWN') mappedKey = 'DOWN'
            if (key === 'ARROWLEFT') mappedKey = 'LEFT'
            if (key === 'ARROWRIGHT') mappedKey = 'RIGHT'
            if (key === 'DELETE') mappedKey = 'DEL'
            if (key === 'INSERT') mappedKey = 'INS'

            const combo = [...modifiers, mappedKey].join('+')
            setEditValue(combo)
            setIsRecording(false)
          } else {
            setEditValue(modifiers.join('+'))
          }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
      }
      return undefined
    }, [editType, isRecording])

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setEditingSoundId(null)}
          className="absolute inset-0 bg-black/60 backdrop-blur-xl" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          className="relative bg-[#1a1a1a] border border-white/10 p-10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-lg"
        >
          <h2 className="text-3xl font-black italic tracking-tighter mb-8 uppercase underline decoration-primary decoration-4 underline-offset-8">
            {editType === 'name' ? t.rename : (lang === 'en' ? 'HOTKEY' : 'ХОТКЕЙ')}
          </h2>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">
                {editType === 'name' ? (lang === 'en' ? 'Sound Label' : 'Имя звука') : (lang === 'en' ? 'Trigger Combination' : 'Комбинация клавиш')}
              </label>
              
              {editType === 'name' ? (
                <input 
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit() }}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-lg font-bold focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all shadow-inner"
                  placeholder={lang === 'en' ? 'ENTER NAME...' : 'ВВЕДИТЕ ИМЯ...'}
                />
              ) : (
                <div 
                  onClick={() => setIsRecording(true)}
                  className={`w-full bg-white/5 border ${isRecording ? 'border-primary shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-white/10 text-white/40'} rounded-2xl p-6 text-2xl font-black text-center cursor-pointer transition-all hover:bg-white/[0.08] flex flex-col gap-2`}
                >
                  <div className={isRecording ? 'text-primary' : ''}>
                    {editValue || (isRecording ? 'PRESS KEYS...' : 'NONE')}
                  </div>
                  <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                    {isRecording 
                      ? (lang === 'en' ? 'RECORDING... (ESC TO CANCEL)' : 'ЗАПИСЬ... (ESC ДЛЯ ОТМЕНЫ)') 
                      : (lang === 'en' ? 'CLICK TO RECORD NEW BIND' : 'НАЖМИТЕ ДЛЯ ЗАПИСИ')}
                  </div>
                </div>
              )}

              {editType === 'shortcut' && (
                <p className="text-[10px] text-white/20 font-bold italic mt-3">
                  {lang === 'en' 
                    ? 'PRO TIP: Use modifiers like CTRL or ALT for better organization.' 
                    : 'СОВЕТ: Используйте CTRL или ALT для удобства.'}
                </p>
              )}
            </div>
            <div className="flex gap-4 pt-6">
                <button 
                  onClick={() => setEditingSoundId(null)}
                  className="flex-1 px-8 py-5 rounded-2xl text-xs font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={saveEdit}
                  className="flex-1 px-8 py-5 rounded-2xl text-xs font-black uppercase tracking-widest bg-primary hover:bg-accent transition-all shadow-[0_10px_30px_rgba(59,130,246,0.3)]"
                >
                  {t.save}
                </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background text-white select-none relative">
      {/* Context Menu and Modals */}
      {contextMenu && <ContextMenu {...contextMenu} />}
      <AnimatePresence>
        {editingSoundId && <EditModal />}
        {audioEditorState.isOpen && audioEditorState.filePath && (
          <AudioEditor
            filePath={audioEditorState.filePath}
            initialName={audioEditorState.initialName}
            lang={lang}
            onClose={() => setAudioEditorState({ isOpen: false })}
            onSave={async (buffer, name) => {
              // @ts-ignore
              const savedPath = await window.api.saveAudioBuffer(buffer, name)
              if (savedPath) {
                if (audioEditorState.editingSoundId) {
                  // Update existing
                  setSounds(prev => prev.map(s => 
                    s.id === audioEditorState.editingSoundId 
                      ? { ...s, name, path: savedPath } 
                      : s
                  ))
                } else {
                  // Create new
                  const newSound: Sound = {
                    id: Date.now().toString(),
                    name,
                    path: savedPath,
                    shortcut: '',
                    color: COLORS[Math.floor(Math.random() * COLORS.length)]
                  }
                  setSounds(prev => [...prev, newSound])
                }
                setAudioEditorState({ isOpen: false })
              }
            }}
          />
        )}
      </AnimatePresence>


      {/* Custom Titlebar */}
      <div className="h-10 flex items-center justify-between px-6 border-b border-white/5 draggable z-[60] bg-background">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 flex items-center justify-center p-0.5 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.4)] bg-white/5 border border-white/10">
            <img src={appIcon} alt="Icon" className="w-full h-full object-contain" />
          </div>
          <span className="text-[11px] font-black tracking-[0.4em] text-white/60 uppercase italic ml-1">SOUNDCORE</span>
        </div>
        <div className="flex items-center gap-6 no-drag">
          <div className="flex items-center gap-2">
            <button 
              // @ts-ignore
              onClick={() => window.api.minimizeApp()}
              className="group flex items-center justify-center w-6 h-6 rounded-lg hover:bg-white/10 transition-all duration-300"
            >
              <div className="w-3 h-0.5 bg-white/20 group-hover:bg-white transition-colors" />
            </button>
            <button 
              // @ts-ignore
              onClick={() => window.api.closeApp()}
              className="group flex items-center justify-center w-6 h-6 rounded-lg hover:bg-red-500 transition-all duration-300"
            >
              <Plus size={16} className="rotate-45 text-white/20 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <AnimatePresence>
          {showSettings && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettings(false)}
                className="absolute inset-0 bg-background/40 backdrop-blur-sm z-[140]"
              />
              <motion.div 
                initial={{ opacity: 0, x: 340 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 340 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 bottom-0 w-[340px] bg-[#1a1a1a]/95 backdrop-blur-3xl border-l border-white/10 z-[150] px-8 pt-5 pb-0 flex flex-col gap-4 shadow-[-50px_0_100px_rgba(0,0,0,0.5)]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black italic tracking-tight underline decoration-primary decoration-4 underline-offset-8 uppercase">{t.settings}</h2>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-2">{t.config}</p>
                  </div>
                  <button onClick={() => setShowSettings(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <Plus size={18} className="rotate-45" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]"><Activity size={12} className="text-primary"/> {t.lang}</div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => setLang('en')}
                        className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${lang === 'en' ? 'bg-primary text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                       >
                         ENGLISH
                       </button>
                       <button 
                        onClick={() => setLang('ru')}
                        className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${lang === 'ru' ? 'bg-primary text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                       >
                         РУССКИЙ
                       </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]"><Volume2 size={12} className="text-primary"/> {t.playback}</div>
                    <select value={playbackDevice} onChange={(e) => setPlaybackDevice(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold appearance-none cursor-pointer">
                      <option value="default" className="bg-[#1a1a1a]">System Default</option>
                      {devices.map(d => <option key={d.deviceId} value={d.deviceId} className="bg-[#1a1a1a]">{d.label}</option>)}
                    </select>
                  </div>

                  {!hasDriver ? (
                    <div className="pt-4 animate-in fade-in zoom-in duration-500">
                      <div className="p-5 rounded-3xl border border-red-500/30 bg-red-500/5 relative overflow-hidden flex flex-col gap-4">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center">
                            <Download size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-black text-white">{lang === 'en' ? 'Driver Required' : 'Требуется Драйвер'}</div>
                            <div className="text-[10px] text-white/50">{lang === 'en' ? 'Install the Soundcore Audio Bridge to enable injection.' : 'Установите Аудио-Мост Soundcore для инъекции.'}</div>
                          </div>
                        </div>
                        <button 
                          onClick={installDriver}
                          disabled={isInstallingDriver}
                          className="w-full relative z-10 p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                        >
                          {isInstallingDriver ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                          {isInstallingDriver ? (lang === 'en' ? 'INSTALLING...' : 'УСТАНОВКА...') : (lang === 'en' ? 'INSTALL DRIVER' : 'УСТАНОВИТЬ ДРАЙВЕР')}
                        </button>
                        <div className="text-[9px] text-white/30 text-center uppercase font-bold tracking-widest">
                          {lang === 'en' ? 'Requires Administrator Privileges' : 'Требуются права Администратора'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="pt-2">
                        <button 
                          onClick={() => setIsSmartMode(!isSmartMode)}
                          className={`w-full p-4 rounded-2xl border transition-all duration-500 overflow-hidden relative group ${isSmartMode ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                        >
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isSmartMode ? 'bg-primary text-white' : 'bg-white/10 text-white/40'}`}>
                                <Activity size={16} className={isSmartMode ? 'animate-pulse' : ''} />
                              </div>
                              <div className="text-left">
                                <div className="text-[10px] font-black tracking-widest uppercase mb-0.5">{lang === 'en' ? 'Soundpad Mode' : 'Режим Soundpad'}</div>
                                <div className="text-[9px] text-white/40 font-bold">{isSmartMode ? (lang === 'en' ? 'VOICE MIXING ACTIVE' : 'СМЕШИВАНИЕ ГОЛОСА ВКЛ') : (lang === 'en' ? 'SOUNDS ONLY' : 'ТОЛЬКО ЗВУКИ')}</div>
                              </div>
                            </div>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${isSmartMode ? 'bg-primary' : 'bg-white/10'}`}>
                              <motion.div 
                                animate={{ x: isSmartMode ? 22 : 2 }}
                                className="w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-md"
                              />
                            </div>
                          </div>
                          {isSmartMode && virtualDevice && (
                            <div className="mt-3 pt-3 border-t border-primary/20 text-[8px] text-primary font-bold uppercase tracking-widest">
                             {lang === 'en' ? `Injected into: ${devices.find(d => d.deviceId === virtualDevice)?.label || 'V-Cable'}` : `Инъекция в: ${devices.find(d => d.deviceId === virtualDevice)?.label || 'V-Cable'}`}
                            </div>
                          )}
                        </button>
                      </div>

                      {isSmartMode && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                            <div className="flex items-center gap-2"><Mic size={12} className="text-primary"/> {t.mic_input}</div>
                            <button onClick={refreshDevices} className="text-primary hover:scale-110 transition-transform"><RefreshCw size={12} /></button>
                          </div>
                          <select value={selectedMic} onChange={(e) => setSelectedMic(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold appearance-none cursor-pointer">
                            <option value="default" className="bg-[#1a1a1a]">{lang === 'en' ? 'System Default Mic' : 'Системный по умолчанию'}</option>
                            {inputDevices.map(d => <option key={d.deviceId} value={d.deviceId} className="bg-[#1a1a1a]">{d.label}</option>)}
                          </select>
                        </div>
                      )}

                      {!isSmartMode && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                            <div className="flex items-center gap-2"><Mic size={12} className="text-primary"/> {t.mic}</div>
                            <button onClick={refreshDevices} className="text-primary hover:scale-110 transition-transform"><RefreshCw size={12} /></button>
                          </div>
                          <select value={virtualDevice} onChange={(e) => {}} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold appearance-none cursor-pointer">
                            <option value="" className="bg-[#1a1a1a]">{lang === 'en' ? 'Off (Monitoring Only)' : 'Выкл (Только мониторинг)'}</option>
                            {devices.map(d => <option key={d.deviceId} value={d.deviceId} className="bg-[#1a1a1a]">{d.label}</option>)}
                          </select>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                          <span>{t.inj_volume}</span>
                          <span className="text-primary">{Math.round(injectionVolume * 100)}%</span>
                        </div>
                        <input type="range" min="0" max="2" step="0.01" value={injectionVolume} onChange={(e) => setInjectionVolume(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-full appearance-none accent-primary cursor-pointer" />
                        <div className="text-[8px] text-white/20 font-bold uppercase text-right">Boost: up to 200%</div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                          <span>{t.master}</span>
                          <span className="text-primary">{Math.round(volume * 100)}%</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-full appearance-none accent-primary cursor-pointer" />
                      </div>

                      <div className="pt-2 space-y-3">
                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t.guide}</div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                           <p className="text-[9px] text-white/50 leading-relaxed font-semibold">{t.step1}</p>
                           <p className="text-[9px] text-white/50 leading-relaxed font-semibold">{t.step2}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-auto pb-6 pt-2 border-t border-white/5">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10">
                    <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">{t.engine}</div>
                    <div className="text-[9px] text-white/40 font-bold italic">{t.version}</div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {/* Sidebar */}
        <div className="w-20 flex flex-col items-center py-10 border-r border-white/5 gap-10 bg-[#0f0f0f]/50 backdrop-blur-3xl relative">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('library')}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-[0_10px_30px_rgba(59,130,246,0.15)] cursor-pointer transition-all ${activeTab === 'library' ? 'text-primary bg-primary/10 border-primary/20' : 'text-white/40 border-transparent hover:bg-white/5 hover:text-white'}`}
          >
            <Grid size={24} strokeWidth={2.5} />
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('editor')}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-[0_10px_30px_rgba(168,85,247,0.15)] cursor-pointer transition-all -mt-4 ${activeTab === 'editor' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-white/40 border-transparent hover:bg-white/5 hover:text-white'}`}
          >
            <Scissors size={24} strokeWidth={2.5} />
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.1, color: 'white' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSettings(true)}
            className={`${showSettings ? 'text-primary' : 'text-white/20'} mt-auto transition-all cursor-pointer p-4 rounded-full hover:bg-white/5`}
          >
            <Settings size={24} className={showSettings ? 'animate-spin-slow' : ''} />
          </motion.div>
        </div>

        {/* Main Content */}
        {activeTab === 'library' && (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-12 mt-4 mb-4 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-12 bg-primary rounded-full" />
                <div>
                  <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">{t.library}</h1>
                  <p className="text-[9px] text-white/20 font-bold uppercase tracking-[0.3em] mt-1 ml-0.5">{t.manage}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-primary transition-all duration-300" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.find} 
                    className="bg-white/[0.03] border border-white/5 rounded-3xl pl-14 pr-8 py-5 text-sm font-black tracking-widest focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all duration-500 w-[350px] shadow-inner placeholder:text-white/5"
                  />
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-10 pt-4 pb-10 custom-scrollbar">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredSounds.map((sound, i) => (
                  <SoundCard 
                    key={sound.id} 
                    sound={sound} 
                    play={handlePlay} 
                    isPlaying={activeSoundId === sound.id} 
                    isFlashing={flashingSoundId === sound.id}
                    index={i} 
                    onContextMenu={handleContextMenu}
                  />
                ))}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={handleImport}
                  className="bg-white/[0.03] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center min-h-[140px] gap-3 group hover:border-primary/50 hover:bg-primary/5 transition-all duration-500 cursor-pointer shadow-inner"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/30">
                    <Plus size={20} className="text-white/20 group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-[10px] font-black text-white/20 group-hover:text-primary uppercase tracking-[0.2em] transition-colors">{t.import}</span>
                </motion.div>
              </div>

              {filteredSounds.length === 0 && searchQuery && (
                <div className="h-64 flex flex-col items-center justify-center gap-4 opacity-20">
                  <Search size={48} />
                  <p className="font-bold uppercase tracking-widest text-sm">{t.none}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-12 mt-4 mb-4 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-12 bg-purple-500 rounded-full" />
                <div>
                  <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">{t.craft}</h1>
                  <p className="text-[9px] text-white/20 font-bold uppercase tracking-[0.3em] mt-1 ml-0.5">{t.craft_desc}</p>
                </div>
              </div>
            </div>

            {/* Editor Content Area */}
            <div className="flex-1 flex items-center justify-center px-10 pb-20">
              <motion.div 
                onClick={handleCraftClick}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="w-full max-w-2xl bg-white/[0.02] border border-dashed border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 rounded-[3rem] aspect-[21/9] flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-500 shadow-inner group"
              >
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:scale-110 transition-all border border-white/5 group-hover:border-purple-500/30">
                  <Scissors size={32} className="text-white/20 group-hover:text-purple-400 transition-colors" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black tracking-widest uppercase text-white/60 group-hover:text-white transition-colors">
                    {lang === 'en' ? 'Select Audio File' : 'Выберите аудиофайл'}
                  </h3>
                  <p className="text-xs text-white/20 font-bold uppercase tracking-[0.3em] group-hover:text-purple-400/60 transition-colors">
                    {lang === 'en' ? 'Drag & Drop or Click to browse' : 'Нажмите, чтобы открыть проводник'}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Playback Controls */}
      <div className="h-32 border-t border-white/5 px-12 flex items-center justify-between bg-[#111111]/80 backdrop-blur-[50px] relative z-[60]">
        <div className="flex items-center gap-6 w-[350px]">
          <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-2xl ${activeSoundId ? 'bg-primary border border-primary/50' : 'bg-white/5 border border-white/5'}`}>
            <Play size={28} fill={activeSoundId ? "white" : "none"} className={activeSoundId ? 'text-white' : 'text-white/10'} />
          </div>
          <div className="space-y-1">
              <div className="text-lg font-black italic tracking-tight truncate max-w-[250px] uppercase ml-4">
                {activeSoundId ? sounds.find(s => s.id === activeSoundId)?.name : t.standby}
              </div>
              <div className="flex items-center gap-3 mt-1 ml-4">
                <div className={`w-1.5 h-1.5 rounded-full ${activeSoundId ? 'bg-primary' : 'bg-white/10'}`} />
                <div className="text-[9px] text-white/20 font-bold uppercase tracking-[0.2em]">
                  {activeSoundId ? t.active : t.no_signal}
                </div>
              </div>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
           <div className="bg-white/[0.03] px-10 py-5 rounded-[2.5rem] border border-white/5 flex items-center gap-12 shadow-inner">
              <div className="flex items-center gap-5">
                <Mic size={18} className={activeSoundId ? 'text-primary' : 'text-white/10'} />
                <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden relative">
                  <div 
                    ref={visualizerRef}
                    className="h-full bg-gradient-to-r from-primary/40 via-primary to-primary shadow-[0_0_20px_rgba(59,130,246,0.8)] transition-all ease-out duration-75" 
                   />
                </div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex items-center gap-5">
                <Volume2 size={18} className="text-white/10" />
                <div className="w-32 h-1.5 bg-white/5 rounded-full relative overflow-hidden">
                  <div className="h-full bg-primary/40" style={{ width: `${volume * 100}%` }} />
                </div>
              </div>
           </div>
        </div>

        <div className="w-1/3 flex justify-end">
           <div className="flex items-center gap-5">
              <div className="text-right">
                <div className="text-[11px] font-black text-white/40 italic uppercase tracking-widest">{t.ready}</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
