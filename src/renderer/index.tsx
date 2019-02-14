import { ipcRenderer } from 'electron';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as unhandled from 'electron-unhandled';
import { AppContainer } from 'react-hot-loader';
import { App } from './components/app';

let app: App;

function setAppRef(a: App) {
  app = a;
}

function render() {
  ReactDOM.render(<AppContainer><App ref={setAppRef} /></AppContainer>, document.getElementById('container'));
}

render();
if (module.hot) { module.hot.accept(render); }

// Events

ipcRenderer.on('update-theme', (event: Electron.Event, theme: string) => {
  if (app) {
    app.updateTheme(theme);
  }
});

ipcRenderer.on('clone-repo', (event: Electron.Event, [path, url]: [string, string]) => {
  if (app) {
    app.cloneRepo(path, url);
  }
});

ipcRenderer.on('init-repo', (event: Electron.Event, path: string) => {
  if (app) {
    app.initRepo(path);
  }
});

ipcRenderer.on('open-repo', (event: Electron.Event, path: string) => {
  if (app) {
    app.openRepo(path);
  }
});

// Unhandled exceptions

function handleError(e: any) {
  if (e.code === 'ENOTDIR' || e.code === 'ENOENT') {
    console.log(e);
  } else {
    console.error(e);
  }
}

unhandled({
  logger: handleError 
});