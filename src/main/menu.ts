import { BrowserWindow, Menu } from 'electron';

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

export function setMenu(mainWindow: Electron.BrowserWindow) {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Clone repo',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('clone-repo')
        },
        {
          label: 'Init repo',
          accelerator: 'CmdOrCtrl+I',
          click: () => mainWindow.webContents.send('init-repo')
        },
        {
          label: 'Open repo',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow.webContents.send('open-repo')
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