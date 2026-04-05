import { contextBridge, ipcRenderer } from 'electron'
import { exposeElectronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getAudioDevices: () => ipcRenderer.invoke('get-audio-devices'),
  saveSounds: (sounds: any) => ipcRenderer.send('save-sounds', sounds),
  loadSounds: () => ipcRenderer.invoke('load-sounds'),
  closeApp: () => ipcRenderer.send('close-app'),
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  copySound: (path: string) => ipcRenderer.invoke('copy-sound', path),
  selectFile: () => ipcRenderer.invoke('select-file'),
  readFileBuffer: (path: string) => ipcRenderer.invoke('read-file-buffer', path),
  saveAudioBuffer: (buffer: ArrayBuffer, name: string) => ipcRenderer.invoke('save-audio-buffer', buffer, name),
  installDriver: () => ipcRenderer.invoke('install-driver'),
  saveMicLabel: (label: string) => ipcRenderer.send('save-mic-label', label),
  onGlobalHotkey: (callback: (combo: string) => void) => {
    const fn = (_e: any, combo: string) => callback(combo)
    ipcRenderer.on('global-hotkey', fn)
    return () => {
      ipcRenderer.removeListener('global-hotkey', fn)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    exposeElectronAPI()
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in d.ts)
  window.electron = exposeElectronAPI()
  // @ts-ignore (define in d.ts)
  window.api = api
}
