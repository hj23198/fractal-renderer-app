const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const exec = require('child_process').exec;

function createWindow () {
    const mainWindow = new BrowserWindow({
        webPreferences: {
                preload: path.join(__dirname, 'interface/preload.js')
        },
        width: 800,
        height: 600
    })
  
    ipcMain.on('render-set', (event, x, y, width, height, zoom, numthreads, repnum) => {
        
        var request = "./assets/fractal-renderer " + x + " " + y + " " + width + " " + height + " " + zoom + " " + numthreads + " " + repnum
        exec(request)

    })
  
    mainWindow.loadFile('interface/index.html')
}

app.whenReady().then(() => {
    createWindow()
  
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})