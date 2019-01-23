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

export function setMenu(mainWindow: Electron.BrowserWindow) {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Clone repo',
          accelerator: 'CmdOrCtrl+N',
          click: () => createModalWindow(mainWindow, `file://${__dirname}/../../assets/html/clone-repo.html`)
        },
        {
          label: 'Init repo',
          accelerator: 'CmdOrCtrl+I',
          click: () => createModalWindow(mainWindow, `file://${__dirname}/../../assets/html/init-repo.html`)
        },
        {
          label: 'Open repo',
          accelerator: 'CmdOrCtrl+O',
          click: function() {
            dialog.showOpenDialog(mainWindow, {properties: ['openDirectory']}, (paths) => {
              if (paths) {
                mainWindow.webContents.send('open-repo', paths[0]);
              }
            });
          }
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