import { BrowserWindow, Menu, dialog } from 'electron';

function createModalWindow(parent: BrowserWindow, path: string) {
  let win: BrowserWindow | null = new BrowserWindow({
    show: false,
    width: 400,
    height: 320,
    parent: parent,
    modal: true
  });

  win.loadURL(path);

  win.on('close', () => { win = null });
  win.webContents.on('dom-ready', () => {
    if (win) {
      win.show();
    }
  });
}

export function setMenu(mainWindow: Electron.BrowserWindow) {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Init repo',
          accelerator: 'CmdOrCtrl+I',
          click: () => createModalWindow(mainWindow, `file://${__dirname}/../renderer/init-repo.html`)
        },
        {
          label: 'Open repo',
          accelerator: 'CmdOrCtrl+O',
          click: function() {
            let paths = dialog.showOpenDialog(mainWindow, {properties: ['openDirectory']});
            if (paths) {
              mainWindow.webContents.send('open-repo', paths[0]);
            }
          }
        },
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