const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderDisplay: (x, y, width, height, zoom, numthreads, rep) => ipcRenderer.invoke('render:display', x, y, width, height, zoom, numthreads, rep),
  ipcGetBookmarks: () => ipcRenderer.invoke('bookmark:get'),
  ipcAddBookmark: (id, json) => ipcRenderer.invoke('bookmark:add', id, json),
  ipcRemoveBookmark: (id) => ipcRenderer.invoke('bookmark:remove', id),
  ipcRenderBookmark: (id) => ipcRenderer.invoke('bookmark:render', id),
})