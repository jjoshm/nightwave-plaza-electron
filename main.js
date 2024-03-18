const { app, globalShortcut, BrowserWindow, session, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const homePage = 'https://plaza.one/';
const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

let mainWindow;
let tray;

const WIDTH = 444;

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

    fs.readFile(path.join(__dirname, 'styles.css')
        , 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading CSS file:', err);
                return;
            }
            mainWindow.webContents.insertCSS(data);
        });

    // Create a system tray icon
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
    tray.setToolTip('plaza.one');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });


    mainWindow.setPosition(1, 1);

});

ipcMain.on('mini', () => {
    mainWindow.hide();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
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
    isDragging = true;
    offsetX = initialOffsetX;
    offsetY = initialOffsetY;
});

ipcMain.on('dragging', (_event, screenX, screenY) => {
    if (isDragging) {
        console.log('Dragging: ', screenX + offsetX, screenY + offsetY);
        console.log('cp:', mainWindow.getPosition());
        mainWindow.setPosition(screenX + offsetX, screenY + offsetY, true);
    }
});

ipcMain.on('stop-dragging', () => {
    isDragging = false;
});

ipcMain.on('height', (_event, height) => {
    mainWindow.setResizable(true);
    mainWindow.setSize(WIDTH, height);
    mainWindow.setResizable(false);
});
