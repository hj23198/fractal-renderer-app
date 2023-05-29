const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  renderSet: (x, y, width, height, zoom, numthreads, rep) => {
    ipcRenderer.send('render-set', x, y, width, height, zoom, numthreads, rep)}
})