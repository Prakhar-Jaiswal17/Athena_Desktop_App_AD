const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    setFullScreen: () => ipcRenderer.invoke('setFullScreen'),
    endTest: () => ipcRenderer.invoke('endTest'),
    saveCameraFrame: (dataURL) => ipcRenderer.invoke('saveCameraFrame', dataURL),
    saveScreenFrame: (dataURL) => ipcRenderer.invoke('saveScreenFrame', dataURL),
    getScreenSources: () => ipcRenderer.invoke('getScreenSources'),
})