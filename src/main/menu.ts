import {  Menu } from 'electron';

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
          click: () => mainWindow.webContents.send('preferences')
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