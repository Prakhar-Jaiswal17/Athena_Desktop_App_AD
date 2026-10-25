const { app, BrowserWindow, ipcMain, dialog, desktopCapturer } = require('electron')
const path = require('path')
const fs = require('fs')

let win;
const isDev = !app.isPackaged

// In production, write feeds to userData (app bundle is read-only).
// In dev, write next to the project root.
const basePath = isDev ? __dirname : app.getPath('userData')
const cameraFeedDir = path.join(basePath, 'cameraFeed')
const screenFeedDir = path.join(basePath, 'screenFeed')
if (!fs.existsSync(cameraFeedDir)) fs.mkdirSync(cameraFeedDir, { recursive: true })
if (!fs.existsSync(screenFeedDir)) fs.mkdirSync(screenFeedDir, { recursive: true })

const createWindow = () => {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        kiosk: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs')
        }
    })

    win.webContents.on('before-input-event', (event, input) => {
        if (
            (input.control || input.meta) &&
            (input.key.toLowerCase() === 'c' || input.key.toLowerCase() === 'v')
        ) {
            event.preventDefault();

            dialog.showMessageBox(mainWindow, {
                type: 'warning',
                title: 'Warning',
                message: 'Copy and Paste is not allowed during exam',
                buttons: ['Dismiss']
            })
        }
    });

    win.webContents.session.setPermissionRequestHandler(
    (webContents, permission, callback) => {
        callback(permission === 'media')
    }
)

    if (isDev) {
        win.loadURL('http://localhost:5173')
    } else {
        win.loadFile(path.join(__dirname, 'dist', 'index.html'))
    }
}

// ── Save a camera frame (base64 data URL → JPEG file) ──
ipcMain.handle('saveCameraFrame', async (event, dataURL) => {
    try {
        const base64Data = dataURL.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        const filename = `camera_${Date.now()}.jpg`
        const filepath = path.join(cameraFeedDir, filename)
        fs.writeFileSync(filepath, buffer)
        return { success: true, filepath }
    } catch (err) {
        console.error('Error saving camera frame:', err)
        return { success: false, error: err.message }
    }
})

// ── Save a screen frame (base64 data URL → JPEG file) ──
ipcMain.handle('saveScreenFrame', async (event, dataURL) => {
    try {
        const base64Data = dataURL.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        const filename = `screen_${Date.now()}.jpg`
        const filepath = path.join(screenFeedDir, filename)
        fs.writeFileSync(filepath, buffer)
        return { success: true, filepath }
    } catch (err) {
        console.error('Error saving screen frame:', err)
        return { success: false, error: err.message }
    }
})

// ── Get desktop capturer sources for screen capture ──
ipcMain.handle('getScreenSources', async () => {
    try {
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: 1920, height: 1080 }
        })
        // Return serializable source data (id + name)
        return sources.map(s => ({ id: s.id, name: s.name }))
    } catch (err) {
        console.error('Error getting screen sources:', err)
        return []
    }
})

ipcMain.handle('setFullScreen', async()=>{
    if(win){
        win.setKiosk(true)
    }
})

ipcMain.handle('endTest', async()=>{
    win.setKiosk(false)
})

app.whenReady().then(() => {
    createWindow()
})