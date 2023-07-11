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
        option.name = "bookmarks"
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

        const inputs = document.getElementById("inputs")
        for (let i in inputs.children) {
            let input = inputs.children[i]

            if (input.tagName == "INPUT") {
                input.addEventListener('focus', EventHandle.formFocus)
                input.addEventListener('blur', EventHandle.formBlur)
            }
        }

        const bookmarkInput = document.getElementById("bookmark-name")
        bookmarkInput.addEventListener('focus', EventHandle.formFocus)
        bookmarkInput.addEventListener('blur', EventHandle.formBlur)

        const saveButton = document.getElementById("save")
        saveButton.addEventListener('click', EventHandle.savePressed)
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
        //TODO restructure json
        let json = packSettings()

        let nameInput = document.getElementById("bookmark-name")
        let name = nameInput.value

        let next_id = bookmarks["current_id"] + 1
        bookmarks["current_id"] = next_id

        json["name"] = name

        Bookmark.add(next_id, json)

    }

    static renderBookmarkPressed() {
        let id = Bookmark.getRadioValue()
        Bookmark.render(id)
        updateImageDisplay()
    }

    static savePressed() {
        window.electronAPI.ipcRenderSave()
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
    //TODO pack into json format
    const x = Number(document.getElementById("x").value)
    const y = Number(document.getElementById("y").value)
    const width = Number(document.getElementById("width").value)
    const height = Number(document.getElementById("height").value)
    const zoom = Number(document.getElementById("zoom").value)
    const threads = Number(document.getElementById("threads").value)
    const rep = Number(document.getElementById("rep").value)

    const pixel_1_r = Number(document.getElementById("pixel_1_r").value)
    const pixel_1_g = Number(document.getElementById("pixel_1_g").value)
    const pixel_1_b = Number(document.getElementById("pixel_1_b").value)

    const pixel_2_r = Number(document.getElementById("pixel_2_r").value)
    const pixel_2_g = Number(document.getElementById("pixel_2_g").value)
    const pixel_2_b = Number(document.getElementById("pixel_2_b").value)

    const pixel_3_r = Number(document.getElementById("pixel_3_r").value)
    const pixel_3_g = Number(document.getElementById("pixel_3_g").value)
    const pixel_3_b = Number(document.getElementById("pixel_3_b").value)

    const grad_rep = Number(document.getElementById("grad_rep").value)
    const base = Number(document.getElementById("base").value)

    var json = {
        "x":x,
        "y":y,
        "xsize":width,
        "ysize":height,
        "zoom":zoom,
        "numthreads":threads,
        "depth":rep,
        "color_method":"log_grad",
        "color_params":{
            "point1":[pixel_1_r, pixel_1_g, pixel_1_b],
            "point2":[pixel_2_r, pixel_2_g, pixel_2_b],
            "set_color":[pixel_3_r, pixel_3_g, pixel_3_b],
            "repetitions":grad_rep,
            "base":base
        }
    
    }

    return json
}

async function renderImage() {
    var json = packSettings()
    const result = await window.electronAPI.ipcRenderDisplay(json)
}

Bookmark.buildBookmarkSelect()
EventHandle.build()



