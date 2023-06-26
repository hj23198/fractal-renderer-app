var bookmarks = ""
var processing = false

class Bookmark {
    static get() {
        bookmarks = window.electronAPI.ipcGetBookmarks()
        return bookmarks
    }

    static add(id, json) {
        window.electronAPI.ipcAddBookmark(id, json)
        bookmarks["saved"][id] = json
    }

    static remove(id) {
        window.electronAPI.ipcRemoveBookmark(id)
        delete bookmarks["saved"][id]
        
        var select = document.getElementById("bookmarks")
        select.removeChild(document.getElementById(id))
        select.removeChild(document.getElementById(id + "_label"))
    }

    static render(id) {
        window.electronAPI.ipcRenderBookmark(id)
    }

    static async buildBookmarkSelect() {
        Bookmark.get().then((bookmark, err) => {
            bookmarks = bookmark
            var select = document.getElementById("bookmarks")
            let keys = Object.keys(bookmark["saved"])
            
            for (let i = 0; i < keys.length; i++) {
                let option = document.createElement("input")
                option.type = "radio"
                option.id = keys[i]
                select.appendChild(option)

                let label = document.createElement("label")
                label.innerHTML = keys[i]
                label.for = keys[i]
                label.id = keys[i] + "_label"
                select.append(label)
            }
        })
    }

    static getRadioValue() {
        let selection = document.getElementById("bookmarks")
        let children = selection.children
        
        let value = "no button found"

        for (let i=0; i < children.length; i++) {
            console.log(children[i].tagName)
            
            if (children[i].tagName === "INPUT") {
                if (children[i].checked) {
                    value = children[i].id
                }
            }
        }
        return value
    }
}

class EventHandle {
    static keyDown(e) {
        if (processing) {
            return
        } else {
            processing = true
        }
    
        var x = document.getElementById("x")
        var y = document.getElementById("y")
        var zoom = document.getElementById("zoom")
    
        if (e.key === "ArrowRight" || e.key === "d") {
            x.value = Number(x.value) + Number(zoom.value)/4
        } else if (e.key === "ArrowLeft" || e.key === "a") {
           x.value = Number(x.value) - Number(zoom.value)/4
        } else if (e.key === "ArrowUp" || e.key === "w") {
            y.value = Number(y.value) - Number(zoom.value)/4
        } else if (e.key === "ArrowDown" || e.key === "s") {
            y.value = Number(y.value) + Number(zoom.value)/4
        } else if (e.key === "z") {
            zoom.value = Number(zoom.value) / 2
        } else if (e.key === "x") {
            zoom.value = Number(zoom.value) * 2
        } else {
            processing = false
            return
        }
        renderImage()
        updateImageDisplay()
        processing = false

    }

    static async renderPressed(){
        await renderImage()
        updateImageDisplay()
    }

    static async removeBookmarkPressed() {
        let id = Bookmark.getRadioValue()
        console.log("Found radio button id:")
        console.log(id)
        Bookmark.remove(id)
    }
}




function updateImageDisplay() {
    var time = new Date().getTime()
    var image_element = document.getElementById("display")
    image_element.src = "../assets/fractal_image.png?t=" + time
}

function packSettings() {
    const x = document.getElementById("x").value
    const y = document.getElementById("y").value
    const width = document.getElementById("width").value
    const height = document.getElementById("height").value
    const zoom = document.getElementById("zoom").value
    const threads = document.getElementById("threads").value
    const rep = document.getElementById("rep").value
    return [x, y, width, height, zoom, threads, rep]
}

async function renderImage() {
    var settings = packSettings()
    const result = await window.electronAPI.ipcRenderDisplay(...settings)
}

Bookmark.buildBookmarkSelect()
const setButton = document.getElementById("btn")
setButton.addEventListener('click', EventHandle.renderPressed)
window.addEventListener("keydown", EventHandle.keyDown)

const bookmarkbutton = document.getElementById("remove-bookmark")
bookmarkbutton.addEventListener('click', EventHandle.removeBookmarkPressed)
const reset = document.getElementById("reset")
reset.addEventListener('click', () => {
    Bookmark.add("0", {"x":0, "y":0, "width":100, "height":100, "zoom":1, "threads":1, "rep":1})
    Bookmark.buildBookmarkSelect()

})