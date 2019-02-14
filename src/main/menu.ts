import { BrowserWindow, Menu, dialog } from 'electron';

function createModalWindow(parent: BrowserWindow, path: string) {
  let window: BrowserWindow | null = new BrowserWindow({
    show: false,
    width: 400,
    height: 320,
    parent: parent,
    modal: true
  });

  window.loadURL(path);

  window.once('ready-to-show', () => {
    window!.show();
  });
  window.on('close', () => { 
    window = null
  });
}

export function openCloneRepoWindow(mainWindow: Electron.BrowserWindow) {
  createModalWindow(mainWindow, `file://${__dirname}/../../assets/html/clone-repo.html`);
}

export function openOpenRepoWindow(mainWindow: Electron.BrowserWindow) {
  dialog.showOpenDialog(mainWindow, {properties: ['openDirectory']}, (paths) => {
    if (paths) {
      mainWindow.webContents.send('open-repo', paths[0]);
    }
  });
}

export function setMenu(mainWindow: Electron.BrowserWindow) {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Clone repo',
          accelerator: 'CmdOrCtrl+N',
          click: () => openCloneRepoWindow(mainWindow)
        },
        {
          label: 'Init repo',
          accelerator: 'CmdOrCtrl+I',
          click: () => mainWindow.webContents.send('init-repo')
        },
        {
          label: 'Open repo',
          accelerator: 'CmdOrCtrl+O',
          click: () => openOpenRepoWindow(mainWindow)
        },
        {
          type: 'separator'
        },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => createModalWindow(mainWindow, `file://${__dirname}/../../assets/html/preferences.html`)
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {role: 'reload'},
        {role: 'forcereload'},
        {role: 'toggledevtools'},
      ]
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  mainWindow.setMenu(menu);
}