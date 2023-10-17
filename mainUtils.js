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
        return fs.promises.stat(itemPath).then((stats) => {
          return stats.isFile();
        });
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

async function getDataFiles(files = []) {
  const jsonFiles = files.filter((file) => {
    return file?.name?.includes(".json") && file?.name?.includes("live-");
  });
  const promise = jsonFiles.map((jsonFile) => {
    const { filePath } = jsonFile;
    return fs.promises.stat(filePath).then((stats) => {
      return { size: stats.size, ...jsonFile };
    });
  });
  return Promise.all(promise);
}

async function moveFiles() {
  const userProfile = getUserPrifle();
  const directoryPath = `${userProfile}\\Downloads`;
  const files = await getFilesInDownloadFolder({ directoryPath });
  const videoFIles = getWebmFiles(files);
  const dataJsonFiles = await getDataFiles(files);
  try {
    await moveVideoChunksFilesToSpecificFolder(videoFIles);
    await moveDataJsonFilesToSpecificFolder(dataJsonFiles);
  } catch (error) {
    console.log("moveFiles error", error);
  }
}

async function moveVideoChunksFilesToSpecificFolder(files = []) {
  try {
    const userProfile = getUserPrifle();
    const videoChunksObject = separateFilesBasedOnClassUID(files);
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

const getDataJsonFiles = (data) => {
  const sortedData = data.sort((file1, file2) => file2.size - file1.size);
  return { toBeMoved: data[0], toBeDeleted: data.slice(1) };
};

async function moveDataJsonFilesToSpecificFolder(files = []) {
  try {
    const userProfile = getUserPrifle();
    const dataJsonFilesObject = separateFilesBasedOnClassUID(files);
    Object.entries(dataJsonFilesObject)?.map((jsonFileObject) => {
      const [classUID, dataJsonFiles] = jsonFileObject;
      const { toBeMoved, toBeDeleted } = getDataJsonFiles(dataJsonFiles);
      const directoryPath = `${userProfile}\\VideoRecording\\${classUID}`;
      createDirectory({ directoryPath: directoryPath });
      toBeDeleted.map((file) => deleteFile(file.filePath));
      moveFile({
        file: { ...toBeMoved, name: `live-${classUID}-event-data.json` },
        directoryPath,
      });
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

function separateFilesBasedOnClassUID(data = []) {
  return data.reduce((acc, file) => {
    const classUID = file.name.split("-")[1];
    if (acc[classUID]) {
      const chunks = acc[classUID];
      return { ...acc, [classUID]: [...chunks, file] };
    }
    return {
      ...acc,
      [classUID]: [file],
    };
  }, {});
}
module.exports = { moveFiles, createTray, deleteFile };
