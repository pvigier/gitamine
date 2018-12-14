import { Menu, dialog } from 'electron';

export function setMenu(): void {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open repo',
          accelerator: 'CmdOrCtrl+O',
          click: function() {
            let paths = dialog.showOpenDialog({properties: ['openDirectory']});
            if (paths) {
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