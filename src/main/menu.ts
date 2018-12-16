import { Menu, dialog } from 'electron';

export function setMenu(mainWindow: Electron.BrowserWindow) {
  const template = [
    {
      label: 'File',
      submenu: [
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
  Menu.setApplicationMenu(menu);
}