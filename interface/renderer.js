class Bookmark {
    static get() {
        return window.electronAPI.ipcGetBookmarks()
    }

    static add(id, json) {
        window.electronAPI.ipcAddBookmark(id, json)
    }

    static remove(id) {
        window.electronAPI.ipcRemoveBookmark(id)
    }

    static render(id) {
        window.electronAPI.ipcRenderBookmark(id)
    }
}


function updateImageDisplay() {
    var time = new Date().getTime()
    var image_element = document.getElementById("display")
    image_element.src = "../assets/fractal_image.png?t=" + time
    console.log("displayed!")
}

function handleKeydown(e) {
    if (processing) {
        return
    } else {
        processing = true
    }

    var x = document.getElementById("x")
    var y = document.getElementById("y")
    var zoom = document.getElementById("zoom")
    console.log(e.key)

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

const setButton = document.getElementById("btn")
var processing = false

setButton.addEventListener('click', async () => {
    await renderImage()
    updateImageDisplay()
})

window.addEventListener("keydown", handleKeydown)

