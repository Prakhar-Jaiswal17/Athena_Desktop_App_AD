const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')

let win;

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

    win.loadURL('http://localhost:5173')
}

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