
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const execSync = require('child_process').execSync;

//globals
bookmarks = ""



class Render {

    static renderFrame(json) {
        /*
        renders recived requests and saves to assets/fractal_image.png
        */
        fs.writeFileSync("assets/request.json", JSON.stringify(json))
        execSync("./assets/fractal-renderer")
        return "done"
    }

    static saveImage() {
        let path = dialog.showSaveDialogSync({
            title: "Save Image",
        })

        fs.copyFileSync("assets/fractal_image.png", path + ".png")
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
        bookmarks["current_id"] = id
        Bookmark.save()
    
    }

    static remove(e, id) {
        delete bookmarks["saved"][id]
        Bookmark.save()
    }

    static render(e, id) {
        console.log("RENDER REQUESTED")
        let settings = bookmarks["saved"][id]
        Render.renderFrame(settings)
    }

}

function connectIpc() {
    ipcMain.handle('render:display', renderDisplay)
    ipcMain.handle("render:save", Render.saveImage)

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

async function renderDisplay(event, json) {
    /*
    renders recived requests and saves to assets/fractal_image.png
    */
   await Render.renderFrame(json)
   return "done"

}





app.whenReady().then(() => {
    
    Bookmark.load()
    createWindow()
    connectIpc()

  

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })


})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

