const { app, BrowserWindow } = require('electron');

let mainWindow;

app.on('ready', () => {
  console.log('Application ready!');

  mainWindow = new BrowserWindow({
    show: false,
    width:  800,
    height: 600,
    backgroundColor: '#1e1e1e'
  });

  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.show();
  });

  mainWindow.loadURL(`file://${__dirname}/../../index.html`);
  
});

// Menu

require('./menu')