import { app, BrowserWindow } from 'electron';
import { setMenu } from './menu';
import { ThemeManager } from '../shared/theme-manager';

// Dev mode
const isDevMode = process.execPath.match(/[\\/]electron/);

async function initDevTools() {
  const installExtension = await import('electron-devtools-installer');
  mainWindow!.webContents.openDevTools();
  await installExtension.default(installExtension.REACT_DEVELOPER_TOOLS);
}

let mainWindow: BrowserWindow | null = null;

const createWindow = async () => {
  const themeManager = new ThemeManager();
  await themeManager.loadTheme();

  // Create the browser window
  mainWindow = new BrowserWindow({
    show: false,
    minWidth: 800,
    minHeight: 600,
    width: 800,
    height: 600,
    backgroundColor: themeManager.getBackgroundColor()
  });

  // Set the menu
  setMenu(mainWindow);

  // Load the index.html of the app
  mainWindow.loadURL(`file://${__dirname}/../../assets/html/index.html`);

  // Open the DevTools
  if (isDevMode) {
    await initDevTools();
  }

  // Only show when the DOM is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow!.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open
  if (mainWindow === null) {
    createWindow();
  }
});