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

ipcRenderer.on('clone-repo', () => {
  if (app) {
    app.openCloneRepoDialog();
  }
});

ipcRenderer.on('init-repo', () => {
  if (app) {
    app.openInitRepoDialog();
  }
});

ipcRenderer.on('open-repo', () => {
  if (app) {
    app.openOpenRepoDialog();
  }
});

ipcRenderer.on('preferences', () => {
  if (app) {
    app.openPreferencesDialog();
  }
});

// Unhandled exceptions

function handleError(e: any) {
  // This was necessary for node-watch, is it still necessary for chokidar?
  if (e.code === 'ENOTDIR' || e.code === 'ENOENT') {
    console.log(e);
  } else {
    console.error(e);
  }
}

unhandled({
  logger: handleError 
});