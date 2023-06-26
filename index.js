
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const execSync = require('child_process').execSync;

bookmarks = ""



class Render {

    static renderFrame(x, y, width, height, zoom, numthreads, repnum) {
        /*
        renders recived requests and saves to assets/fractal_image.png
        */
        let request = "./assets/fractal-renderer " + x + " " + y + " " + width + " " + height + " " + zoom + " " + numthreads + " " + repnum
        execSync(request)
        return "done"
    }
}

class Bookmark {

    static load() {
        bookmarks = fs.readFileSync("config/bookmarks.json")
        bookmarks = JSON.parse(bookmarks)
        return bookmarks
    }

    
    static save() {
        fs.writeFileSync("config/bookmarks.json", JSON.stringify(bookmarks))
    }
    
    static get(e) {
        return bookmarks
    }

    static add(e, id, new_bookmark) {
        bookmarks["saved"][id] = new_bookmark
        Bookmark.save()
    
    }

    static remove(e, id) {
        delete bookmarks["saved"][id]
        Bookmark.save()
    }

    static render(e, id) {
        let settings = bookmarks["saved"][id]
        Render.renderFrame(settings["x"], settings["y"], settings["width"], settings["height"], settings["zoom"], settings["numthreads"], settings["depth"])
    }

}

function connectIpc() {
    ipcMain.handle('render:display', renderDisplay)
    ipcMain.handle('bookmark:get', Bookmark.get)
    ipcMain.handle('bookmark:add', Bookmark.add)
    ipcMain.handle('bookmark:remove', Bookmark.remove),
    ipcMain.handle('bookmark:render', Bookmark.render)
}

function createWindow () {
    const mainWindow = new BrowserWindow({
        webPreferences: {
                preload: path.join(__dirname, 'interface/preload.js')
        },
        width: 800,
        height: 600
    })

    mainWindow.loadFile('interface/index.html')
}

async function renderDisplay(event, x, y, width, height, zoom, numthreads, repnum) {
    /*
    renders recived requests and saves to assets/fractal_image.png
    */
   await Render.renderFrame(x, y, width, height, zoom, numthreads, repnum)
   return "done"

}





app.whenReady().then(() => {
    
    createWindow()
    connectIpc()
    Bookmark.load()

  

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })


})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})