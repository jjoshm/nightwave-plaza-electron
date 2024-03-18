const { ipcRenderer } = require('electron');

function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

ipcRenderer.on("pp", () => {
    const playButton = document.querySelector(".noselect.d-block.player-play");
    playButton.click();
});

async function minimizeButton() {
    const elem = await waitForElm(".noselect.button-minimize");
    clone = elem.cloneNode(true);

    clone.addEventListener("click", () => {
        ipcRenderer.send('mini');
    });
    elem.parentNode.replaceChild(clone, elem);
}

async function drag() {
    const draggableElement = await waitForElm('#window-player .header.header-draggable.noselect');
    draggableElement.addEventListener('mousedown', (event) => {
        const bounds = draggableElement.getBoundingClientRect();
        ipcRenderer.send('start-dragging', bounds.left, bounds.top);
    });

    document.addEventListener('mousemove', (event) => {
        ipcRenderer.send('dragging', event.screenX, event.screenY);
    });

    document.addEventListener('mouseup', () => {
        ipcRenderer.send('stop-dragging');
    });
}


async function syncHeight() {
    const elem = await waitForElm("#window-player");
    function i() {
        const height = elem.clientHeight;
        ipcRenderer.send('height', height);
    }
    i();
    setInterval(i, 20)
}

document.addEventListener("DOMContentLoaded", (event) => {
    syncHeight();
    minimizeButton();
    drag();
})

