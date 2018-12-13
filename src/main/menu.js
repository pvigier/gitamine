const {app, Menu} = require('electron')

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open repo',
        accelerator: 'CmdOrCtrl+O',
        click: function() {
          console.log("Open repo")
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
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)