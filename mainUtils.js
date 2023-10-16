const { app, Menu, nativeImage, Tray } = require("electron");
const fs = require("fs");
const path = require("path");

function getUserPrifle() {
  return process.env.USERPROFILE;
}

async function getFilesInDownloadFolder({ directoryPath }) {
  try {
    const items = await fs.promises.readdir(directoryPath);
    return items
      .filter((item) => {
        const itemPath = path.join(directoryPath, item);
        return fs.promises.stat(itemPath).then((stats) => stats.isDirectory());
      })
      .map((item) => {
        const itemPath = path.join(directoryPath, item);
        return { name: item, filePath: itemPath };
      });
  } catch (err) {
    console.error(`Error reading directory: ${err.message}`);
  }
  return [];
}

function getWebmFiles(files = []) {
  return files.filter((file) => {
    return file?.name?.includes(".webm") && file?.name?.includes("live-");
  });
}

async function moveFiles() {
  const userProfile = getUserPrifle();
  const directoryPath = `${userProfile}\\Downloads`;
  const files = await getFilesInDownloadFolder({ directoryPath });
  const videoFIles = getWebmFiles(files);
  try {
    await moveFilesToSpecificFolder(videoFIles);
  } catch (error) {
    console.log("moveFiles");
  }
}

async function moveFilesToSpecificFolder(files = []) {
  try {
    const userProfile = getUserPrifle();
    const videoChunksObject = separateVideoFilesBasedOnClassUID(files);
    Object.entries(videoChunksObject)?.map((classVideoChunks) => {
      const [classUID, videoChunksFiles] = classVideoChunks;
      const directoryPath = `${userProfile}\\VideoRecording\\${classUID}`;
      createDirectory({ directoryPath: directoryPath });
      videoChunksFiles.map((file) => moveFile({ file, directoryPath }));
    });
  } catch (error) {
    throw error;
  }
}

async function createDirectory({ directoryPath }) {
  if (!fs.existsSync(directoryPath)) {
    try {
      fs.mkdirSync(directoryPath, { recursive: true });
      return true;
    } catch (err) {
      throw err;
    }
  }
}

async function moveFile({ file, directoryPath }) {
  const sourcePath = file.filePath;
  const destinationPath = `${directoryPath}\\${file.name}`;
  try {
    await fs.promises.rename(sourcePath, destinationPath);
  } catch (err) {
    throw err;
  }
}

function createTray({ showApp, quitApp }) {
  const icon = path.join(__dirname, "/app.png");
  const trayicon = nativeImage.createFromPath(icon);
  tray = new Tray(trayicon.resize({ width: 16 }));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show App",
      click: showApp,
    },
    {
      label: "Quit",
      click: quitApp,
    },
  ]);
  tray.setContextMenu(contextMenu);
}

async function deleteFile(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    throw error;
  }
}

function separateVideoFilesBasedOnClassUID(data = []) {
  return data.reduce((acc, file) => {
    const classUID = file.name.split("-")[1];
    if (acc[classUID]) {
      const videoChunks = acc[classUID];
      return { ...acc, [classUID]: [...videoChunks, file] };
    }
    return {
      ...acc,
      [classUID]: [file],
    };
  }, {});
}
module.exports = { moveFiles, createTray, deleteFile };
