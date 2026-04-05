import { uIOhook } from 'uiohook-napi'
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, dirname } from 'path'
import { existsSync, readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'fs'
import { execFile } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1050,
    height: 700,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    backgroundColor: '#121212',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      backgroundThrottling: false
    },
    title: 'Soundcore',
    icon: icon
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.commandLine.appendSwitch('disable-renderer-backgrounding')
app.commandLine.appendSwitch('disable-background-timer-throttling')

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.antigravity.soundcore')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  // Global Key Listener Setup (uiohook-napi)
  try {
    const UIOHOOK_MAP: Record<number, string> = {
      1: 'ESC',
      59: 'F1', 60: 'F2', 61: 'F3', 62: 'F4', 63: 'F5', 64: 'F6', 65: 'F7', 66: 'F8', 67: 'F9', 68: 'F10', 87: 'F11', 88: 'F12',
      2: '1', 3: '2', 4: '3', 5: '4', 6: '5', 7: '6', 8: '7', 9: '8', 10: '9', 11: '0',
      30: 'A', 48: 'B', 46: 'C', 32: 'D', 18: 'E', 33: 'F', 34: 'G', 35: 'H', 23: 'I', 36: 'J', 37: 'K', 38: 'L', 50: 'M', 49: 'N', 24: 'O', 25: 'P', 16: 'Q', 19: 'R', 31: 'S', 20: 'T', 22: 'U', 47: 'V', 17: 'W', 45: 'X', 21: 'Y', 44: 'Z',
      28: 'ENTER', 57: 'SPACE', 14: 'BACKSPACE', 15: 'TAB',
      57416: 'UP', 57424: 'DOWN', 57419: 'LEFT', 57421: 'RIGHT', 57427: 'DEL', 57426: 'INS',
      3613: 'CTRL', 29: 'CTRL', 56: 'ALT', 3640: 'ALT', 42: 'SHIFT', 54: 'SHIFT', 3675: 'META', 3676: 'META',
      71: 'NUM7', 72: 'NUM8', 73: 'NUM9', 75: 'NUM4', 76: 'NUM5', 77: 'NUM6', 79: 'NUM1', 80: 'NUM2', 81: 'NUM3', 82: 'NUM0',
      83: 'NUM_DECIMAL', 3639: 'NUM_DIVIDE', 55: 'NUM_MULTIPLY', 74: 'NUM_SUBTRACT', 78: 'NUM_ADD', 3612: 'NUM_ENTER'
    }

    console.log(`[MAIN] Initializing uiohook-napi Listener`)
    
    uIOhook.on('keydown', (e) => {
      const keyName = UIOHOOK_MAP[e.keycode]
      if (!keyName) return

      // If it's just a modifier, don't trigger as a standalone hotkey
      const modifiersOnly = ['CTRL', 'ALT', 'SHIFT', 'META']
      if (modifiersOnly.includes(keyName)) return

      const modifiers = []
      if (e.ctrlKey) modifiers.push('CTRL')
      if (e.altKey) modifiers.push('ALT')
      if (e.shiftKey) modifiers.push('SHIFT')
      if (e.metaKey) modifiers.push('META')

      const combo = [...modifiers, keyName].join('+')
      console.log(`[MAIN] uIOhook Triggered: ${combo}`)
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('global-hotkey', combo)
      }
    })

    uIOhook.start()
  } catch (error) {
    console.error('Failed to initialize uiohook-napi:', error)
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

let lastUsedMic = ''
ipcMain.on('save-mic-label', (_event, label) => {
  lastUsedMic = label
})

app.on('will-quit', () => {
  if (lastUsedMic) {
    try {
      const nircmd = is.dev 
        ? join(__dirname, '../../resources/driver/nircmdc.exe') 
        : join(process.resourcesPath, 'driver/nircmdc.exe')
      if (existsSync(nircmd)) {
        require('child_process').execFileSync(nircmd, ['setdefaultsounddevice', lastUsedMic, '1'])
        require('child_process').execFileSync(nircmd, ['setdefaultsounddevice', lastUsedMic, '2'])
      }
    } catch (e) {
      console.error('Failed to restore microphone:', e)
    }
  }
})

const SOUNDS_FILE = join(app.getPath('userData'), 'sounds.json')

ipcMain.handle('load-sounds', async () => {
  if (existsSync(SOUNDS_FILE)) {
    try {
      return JSON.parse(readFileSync(SOUNDS_FILE, 'utf-8'))
    } catch (e) {
      console.error('Failed to load sounds:', e)
      return []
    }
  }
  return []
})

ipcMain.on('save-sounds', (_event, sounds) => {
  writeFileSync(SOUNDS_FILE, JSON.stringify(sounds, null, 2))
})

ipcMain.on('close-app', () => {
  app.quit()
})

ipcMain.on('minimize-app', () => {
  mainWindow?.minimize()
})

  ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg'] }]
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  ipcMain.handle('copy-sound', async (_event, filePath) => {
  try {
    const soundsDir = join(app.getPath('userData'), 'sounds')
    if (!existsSync(soundsDir)) mkdirSync(soundsDir)
    
    const fileName = join(Date.now() + '_' + join(filePath).split(/[\\/]/).pop())
    const destPath = join(soundsDir, fileName)
    copyFileSync(filePath, destPath)
    return destPath
  } catch (e) {
    console.error('Failed to copy sound:', e)
    return null
  }
})

ipcMain.handle('read-file-buffer', async (_event, filePath) => {
  try {
    // Return ArrayBuffer suitable for Web Audio Decode
    const nodeBuffer = readFileSync(filePath);
    return nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);
  } catch (e) {
    console.error('Failed to read file buffer:', e)
    return null
  }
})

ipcMain.handle('save-audio-buffer', async (_event, buffer, fileName) => {
  try {
    const soundsDir = join(app.getPath('userData'), 'sounds')
    if (!existsSync(soundsDir)) mkdirSync(soundsDir)
    
    const sanitizedFileName = Date.now() + '_' + fileName + '.wav'
    const destPath = join(soundsDir, sanitizedFileName)
    writeFileSync(destPath, Buffer.from(buffer))
    return destPath
  } catch (e) {
    console.error('Failed to save audio buffer:', e)
    return null
  }
})

ipcMain.handle('get-audio-devices', async () => {
  return true
})

ipcMain.handle('install-driver', async () => {
  return new Promise((resolve, reject) => {
    const driverPath = is.dev 
      ? join(__dirname, '../../resources/driver/VBCABLE_Setup_x64.exe') 
      : join(process.resourcesPath, 'driver/VBCABLE_Setup_x64.exe')

    if (!existsSync(driverPath)) {
      reject(new Error('Driver setup file not found at: ' + driverPath))
      return
    }

    // UAC inherently ignores WorkingDirectory. We create a proxy script to enforce it.
    const dir = dirname(driverPath)
    const batPath = join(dir, 'soundcore_setup.bat')
    const vbsPath = join(dir, 'elevate.vbs')
    
    if (!existsSync(batPath)) {
      writeFileSync(batPath, `@echo off\r\ncd /d "%~dp0"\r\nVBCABLE_Setup_x64.exe -i -h\r\n`)
    }

    // By building the app with 'requireAdministrator' or running the terminal as Admin,
    // we bypass UAC blocking completely. We simply execute the batch script natively.
    execFile(batPath, [], (error: any, stdout, stderr) => {
      if (error) {
        reject(new Error(`Exit Code: ${error?.code}\\nSTDERR: ${stderr}\\nSTDOUT: ${stdout}`))
      } else {
        resolve(true)
      }
    })
  })
})
