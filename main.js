const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  Tray,
} = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const { getFiles, createTray } = require("./mainUtils");

let mainWindow;
let tray = null;
let isQuitApp = false;
autoUpdater.autoDownload = false;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.loadFile("index.html");
  mainWindow.on("closed", function () {
    mainWindow = null;
  });

  mainWindow.once("ready-to-show", () => {
    console.log("ready-to-show");
    // autoUpdater.checkForUpdates();
  });
  mainWindow.on("close", function (evt) {
    console.log("mainWindow close", { isQuitApp });
    if (!isQuitApp) {
      evt.preventDefault();
      mainWindow.hide();
    }
  });
  // mainWindow.webContents.openDevTools();
}

app.on("ready", () => {
  console.log("aap ready");
  getFiles();
  autoUpdater.checkForUpdates();
  if (!tray) {
    createTray({showApp,quitApp});
  }
  const shouldStartOnLogin = true;
  app.setLoginItemSettings({
    openAtLogin: shouldStartOnLogin,
    openAsHidden: false,
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  console.log("activate ", { mainWindow });
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on("app_version", (event) => {
  event.sender.send("app_version", { version: app.getVersion() });
  console.log("app_version", { version: app.getVersion() });
});

autoUpdater.on("update-available", () => {
  // mainWindow.webContents.send('update_available');
  console.log("update-available");
  autoUpdater.downloadUpdate();
});

autoUpdater.on("update-downloaded", () => {
  // mainWindow.webContents.send('update_downloaded');
  console.log("update-downloaded");
  setTimeout(() => {
    isQuitApp = true;
    autoUpdater.quitAndInstall();
  }, 8000);
});

function showApp(){
  if(createWindow){
    createWindow();
  }
}
function quitApp(){
  if(app){
    isQuitApp = true;
    app.quit(); 
  }
}

