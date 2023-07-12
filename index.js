const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const execSync = require('child_process').execSync;

//globals
bookmarks = ""




class Render {

    static renderFrame(json) {
        /*
        renders recived requests and saves to resources/fractal_image.png
        */
        console.log("RENDERFRAAME JSON")
        console.log(json)
        fs.writeFileSync(path.join(__dirname, "resources", "request.json"), JSON.stringify(json))
        execSync(path.join(__dirname, "resources", "fractal-renderer"))
        return "done"
    }

    static saveImage() {
        let fpath = dialog.showSaveDialogSync({
            title: "Save Image",
        })

        fs.copyFileSync(path.join(__dirname, "resources", "fractal_image.png"), fpath + ".png")
    }

    /**
     * Json: x1, x2, y1, y2, depth, zoom1, zoom2, zoom_mod, color_method, color_params, xsize, ysize, numtheads, frames
     * 
     * 
     */
    static renderVideo(e, id1, id2, frames, mod_amount) {

        let point1 = bookmarks["saved"][id1]
        let point2 = bookmarks["saved"][id2]

        console.log(point1)
        console.log(point2)

    

        let delta_x = point2["x"] - point1["x"]
        let delta_y = point2["y"] - point1["y"]

        let zoom_values_frame = []
        for (let i = 0; i < frames; i++) {
            zoom_values_frame.push(point1["zoom"] * mod_amount ** i)
        }

        let delta_zoom_frame = []
        for (let i = 0; i < frames-1; i++) {
            delta_zoom_frame.push(Math.abs(zoom_values_frame[i+1] - zoom_values_frame[i]))
        }
        delta_zoom_frame.push[0]

        let total_zoom = Math.abs(point1["zoom"] - point2["zoom"])
        let delta_x_frame = [0]
        let delta_y_frame = [0]

        for (let i = 0; i < frames-1; i++) {
            delta_x_frame.push(delta_x * delta_zoom_frame[i] / total_zoom)
            delta_y_frame.push(delta_y * delta_zoom_frame[i] / total_zoom)
        }

        let request_json = point1

        for (let i = 0; i < frames; i++) {
            request_json["x"] += delta_x_frame[i]
            request_json["y"] += delta_y_frame[i]
            request_json["zoom"] = zoom_values_frame[i]
            Render.renderFrame(request_json)
            fs.renameSync(path.join(__dirname, "resources", "fractal_image.png"), path.join(__dirname, "video_out", "fractal_image_" + i + ".png"))
        }





    }

    
}

class Bookmark {

    static load() {
        bookmarks = fs.readFileSync(path.join(__dirname, "/resources/bookmarks.json"))
        bookmarks = JSON.parse(bookmarks)
        return bookmarks
    }

    
    static save() {
        fs.writeFileSync(path.join(__dirname, "resources/bookmarks.json"), JSON.stringify(bookmarks))
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
        let settings = bookmarks["saved"][id]
        Render.renderFrame(settings)
    }

}

function connectIpc() {
    ipcMain.handle('render:display', renderDisplay)
    ipcMain.handle("render:save", Render.saveImage)
    ipcMain.handle("render:video", Render.renderVideo)

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

    mainWindow.loadFile(path.join(__dirname, 'interface/index.html'))
}

async function renderDisplay(event, json) {
    /*
    renders recived requests and saves to resources/fractal_image.png
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

