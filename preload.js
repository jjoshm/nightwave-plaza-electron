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
    discordButton = elem.cloneNode(true);

    discordButton.addEventListener("click", () => {
        ipcRenderer.send('mini');
    });
    elem.parentNode.replaceChild(discordButton, elem);
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


async function closeButton() {
    const target = await waitForElm(".noselect.button-minimize");
    const buttonContainer = document.createElement('div');
    buttonContainer.innerHTML = '<button ontouchstart="" class="noselect button-close"><span></span></button>';
    const button = buttonContainer.firstChild;
    button.addEventListener("click", () => {
        ipcRenderer.send('close');
    });
    target.parentNode.appendChild(button);
}

async function init() {
    const target = await waitForElm("#window-player > div > div > div > div.content.p-1.p-sm-2 > div > div.col-12.col-sm > div > div:nth-child(4) > div.col-6.col-md-5 > div > div:nth-child(2) > button");
    let discordButton = document.createElement("button");
    discordButton.classList.add("noselect", "d-block", "discordButton")
    let icon = document.createElement("i");
    icon.classList.add("i", "icon-cog", "mr-0");
    discordButton.appendChild(icon);
    discordButton.dataset.enabled = "false";
    discordButton.addEventListener("click", async (event) => {
        console.log("here", event.currentTarget.dataset.enabled)
        if (event.currentTarget.dataset.enabled == "true") {
            ipcRenderer.send("discordEnabled", false);
        } else {
            ipcRenderer.send("discordEnabled", true);
            let data = await playing();
            setTimeout(() => { ipcRenderer.send("playing", data) }, 2000);
        }
    });
    target.parentNode.appendChild(discordButton);
}

ipcRenderer.on("state", async (_event, data) => {
    const discordButton = await waitForElm(".discordButton");
    console.log("state in preload", data);
    discordButton.classList.add(data.discordEnabled ? 'on' : 'off');
    discordButton.classList.remove(data.discordEnabled ? 'off' : 'on');
    discordButton.dataset.enabled = data.discordEnabled ? "true" : "false";
});

async function playing() {
    const artistElem = await waitForElm(".player-artist.track-artist");
    const titleElem = await waitForElm(".player-title.track-title");
    return { artist: artistElem.innerText, title: titleElem.innerText }
}

async function syncPlaying() {
    const titleElem = await waitForElm(".player-title.track-title");

    const observer = new MutationObserver(async () => {
        const data = await playing()
        ipcRenderer.send("playing", data);
    });

    observer.observe(titleElem, {
        characterData: true,
        childList: true
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    await init();

    closeButton();
    syncHeight();
    drag();
    minimizeButton();
    syncPlaying();
}, { once: true })

