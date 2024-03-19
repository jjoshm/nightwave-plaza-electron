const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const storage = require('electron-json-storage');
const path = require('path');
const fs = require('fs');

const homePage = 'https://plaza.one/';
const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

let mainWindow;
let tray;

const WIDTH = 444;

storage.has('nighwaveplazastate', function(error, hasKey) {
    if (error) throw error;
    if (!hasKey) {
        storage.set('nighwaveplazastate', { discordEnabled: false }, function(error) {
            if (error) throw error;
        });
    }
});

let client = require('discord-rich-presence')('1219537876975357975');

function DiscordRPC(title) {
    console.log("RPC:", client)
    client.updatePresence({
        details: title,
        startTimestamp: Date.now(),
        largeImageKey: 'cat',
        largeImageKey: 'cat',
        instance: true,
    });
};

function disableRPC() {
    client.disconnect();
    client = require('discord-rich-presence')('1219537876975357975');
}

app.whenReady().then(async () => {
    mainWindow = new BrowserWindow({
        fullscreenable: false,
        alwaysOnTop: true,
        width: WIDTH,
        height: 200,
        resizable: false,
        frame: false,

        webPreferences: {
            contextIsolation: false,
            userAgent: userAgent,
            preload: path.join(__dirname, 'preload.js')
        },
    });

    mainWindow.loadURL(homePage);

    fs.readFile(path.join(__dirname, 'styles.css'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading CSS file:', err); return;
        }
        mainWindow.webContents.insertCSS(data);
    });

    tray = new Tray(path.join(__dirname, 'icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Play/Pause',
            click: () => {
                mainWindow.webContents.send("pp");
            }
        },
        {
            label: 'Show App',
            click: () => {
                mainWindow.show();
            }
        },
        {
            label: 'Quit',
            click: () => {
                app.quit();
            }
        }
    ]);
    tray.setToolTip('Nightwave Plaza');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });

    function syncState() {
        let state = storage.getSync('nighwaveplazastate');
        mainWindow.webContents.send("state", state);
    }

    setInterval(syncState, 1000);
});

ipcMain.on('discordEnabled', (_event, discordEnabled) => {
    console.log("discordEnabled:", discordEnabled);
    storage.set('nighwaveplazastate', { discordEnabled: discordEnabled }, function(error) {
        if (error) throw error;
    });
    if (!discordEnabled) {
        disableRPC();
    }

});

ipcMain.on('mini', () => {
    mainWindow.hide();
});

ipcMain.on('playing', (_event, data) => {
    console.log("updating discord", data);
    let state = storage.getSync('nighwaveplazastate');
    console.log("state in renderer", state);
    if (state.discordEnabled) {
        DiscordRPC(`${data.artist} - ${data.title}`)
    }
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

let offsetX;
let offsetY;
let isDragging = false;

ipcMain.on('start-dragging', (_event, initialOffsetX, initialOffsetY) => {
    console.log("drag start")
    isDragging = true;
    offsetX = initialOffsetX;
    offsetY = initialOffsetY;
});

ipcMain.on('dragging', (_event, screenX, screenY) => {
    console.log("drag")
    if (isDragging) {
        mainWindow.setPosition(screenX + offsetX, screenY + offsetY, true);
    }
});

ipcMain.on('stop-dragging', () => {
    console.log("drag stop")
    isDragging = false;
});

ipcMain.on('height', (_event, height) => {
    mainWindow.setResizable(true);
    mainWindow.setSize(WIDTH, height);
    mainWindow.setResizable(false);
});

ipcMain.on('close', (_event) => {
    app.quit();
});
