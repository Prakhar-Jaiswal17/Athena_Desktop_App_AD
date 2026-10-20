const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    setFullScreen: ()=> ipcRenderer.invoke('setFullScreen'),
    
})