const { app, BrowserWindow, ipcMain ,Menu, nativeImage, Tray} = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path')

let mainWindow;
let tray = null

autoUpdater.autoDownload=false;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
  });
  mainWindow.loadFile('index.html');
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  // ipcMain.send('app_version', { version: app.getVersion() });
  mainWindow.once('ready-to-show', () => {
    console.log("ready-to-show")
    // autoUpdater.checkForUpdates();
  });
  mainWindow.webContents.openDevTools();

}

app.on('ready', () => {
  console.log("aap ready")
  autoUpdater.checkForUpdates();
  if(!tray){
    createTray();
  }
  const shouldStartOnLogin= true;
  app.setLoginItemSettings({
    openAtLogin:shouldStartOnLogin,
    openAsHidden:false
  })
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  console.log("activate ",{mainWindow})
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
  console.log("app_version",{  version: app.getVersion() })
});

autoUpdater.on('update-available', () => {
  // mainWindow.webContents.send('update_available');
  console.log("update-available")
  autoUpdater.downloadUpdate();
});

autoUpdater.on('update-downloaded', () => {
  // mainWindow.webContents.send('update_downloaded');
  console.log("update-downloaded")
  setTimeout(()=>{
    autoUpdater.quitAndInstall();
  },2000)
});


function createTray () {
  const icon = path.join(__dirname, '/app.png');
  const trayicon = nativeImage.createFromPath(icon)
  tray = new Tray(trayicon.resize({ width: 16 }))
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        createWindow()
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit() // actually quit the app.
      }
    },
  ])

  tray.setContextMenu(contextMenu)
}

  