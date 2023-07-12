const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderDisplay: (json) => ipcRenderer.invoke('render:display', json),
  ipcRenderSave: () => ipcRenderer.invoke('render:save'),
  ipcRenderVideo: (id1, id2, frames, zoom_mod) => ipcRenderer.invoke('render:video', id1, id2, frames, zoom_mod),
  ipcGetBookmarks: () => ipcRenderer.invoke('bookmark:get'),
  ipcAddBookmark: (id, json) => ipcRenderer.invoke('bookmark:add', id, json),
  ipcRemoveBookmark: (id) => ipcRenderer.invoke('bookmark:remove', id),
  ipcRenderBookmark: (id) => ipcRenderer.invoke('bookmark:render', id)
})