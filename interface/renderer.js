//globals
var bookmarks = ""
var processing = false
var focused_on_form = false

class Bookmark {
    static get() {
        bookmarks = window.electronAPI.ipcGetBookmarks()
        return bookmarks
    }

    static add(id, json) {
        //add bookmark to local and sync to config
        window.electronAPI.ipcAddBookmark(id, json)
        console.log("current state of bookmarks")
        console.log(bookmarks)
        bookmarks["saved"][id] = json

        Bookmark.addToDoc(id, json["name"])

    }

    static addToDoc(bookmark_id, bookmark_name) {
        //add selection option and label to bookmark selection area 
        let select = document.getElementById("bookmarks")
            
        let option = document.createElement("input")
        option.type = "radio"
        option.id = bookmark_id
        select.appendChild(option)

        let label = document.createElement("label")
        label.innerHTML = bookmark_name
        label.for = bookmark_id
        label.id = bookmark_id + "_label"
        select.append(label)
    }

    static remove(id) {
        //remove bookmark from local and sync to config
        window.electronAPI.ipcRemoveBookmark(id)
        delete bookmarks["saved"][id]
        
        let select = document.getElementById("bookmarks")
        select.removeChild(document.getElementById(id))
        select.removeChild(document.getElementById(id + "_label"))
    }

    static render(id) {
        //render bookmark id 
        window.electronAPI.ipcRenderBookmark(id)
    }

    static async buildBookmarkSelect() {
        //iterate over bookmarks and add each to selection box
        Bookmark.get().then((bookmark, err) => {
            bookmarks = bookmark
            let keys = Object.keys(bookmark["saved"])
            
            for (let i = 0; i < keys.length; i++) {
                Bookmark.addToDoc(keys[i], bookmarks["saved"][keys[i]]["name"])
            }
        })
    }

    static getRadioValue() {
        //return id of selected bookmark
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

    static build() {
        //build event listeners
        window.addEventListener("keydown", EventHandle.keyDown)

        const renderFrameButton = document.getElementById("btn")
        renderFrameButton.addEventListener('click', EventHandle.renderPressed)

        const removeBookmarkButton = document.getElementById("remove-bookmark")
        removeBookmarkButton.addEventListener('click', EventHandle.removeBookmarkPressed)

        const addBookmarkButton = document.getElementById("add-bookmark")
        addBookmarkButton.addEventListener('click', EventHandle.addBookmarkPressed)

        const renderBookmarkButton = document.getElementById("render-bookmark")
        renderBookmarkButton.addEventListener('click', EventHandle.renderBookmarkPressed)

        const form = document.getElementById("bookmark-name")
        form.addEventListener('focus', EventHandle.formFocus)
        form.addEventListener('blur', EventHandle.formBlur)
    }


    static keyDown(e) {
        if (processing) {
            return
        } else {
            processing = true
        }

        if (focused_on_form) {
            processing = false
            return
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

    static addBookmarkPressed() {
        //TODO 
        const x = document.getElementById("x").value
        const y = document.getElementById("y").value
        const width = document.getElementById("width").value
        const height = document.getElementById("height").value
        const zoom = document.getElementById("zoom").value
        const threads = document.getElementById("threads").value
        const rep = document.getElementById("rep").value

        let nameInput = document.getElementById("bookmark-name")
        let name = nameInput.value

        let next_id = bookmarks["current_id"] + 1
        bookmarks["current_id"] = next_id

        let new_bookmark = {"x":x, "y":y, "width":width, "height":height, "zoom":zoom, "numthreads":threads, "depth":rep, "name":name}

        Bookmark.add(next_id, new_bookmark)

    }

    static renderBookmarkPressed() {
        let id = Bookmark.getRadioValue()
        Bookmark.render(id)
        updateImageDisplay()
    }

    static formFocus() {
        focused_on_form = true
        console.log("form focused")
    }

    static formBlur() {
        focused_on_form = false
        console.log("form blurred")
    }


}




function updateImageDisplay() {
    //refresh image display to current render
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
EventHandle.build()



//debugging tools

const reset = document.getElementById("reset")
reset.addEventListener('click', async () => {
    await Bookmark.buildBookmarkSelect()
    Bookmark.add(0, {"x":0, "y":0, "width":100, "height":100, "zoom":1, "threads":1, "rep":1, "name":"name"})

})