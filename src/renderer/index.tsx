import { ipcRenderer } from 'electron';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Git from 'nodegit';
import * as unhandled from 'electron-unhandled';
import { AppContainer } from 'react-hot-loader';
import { App } from './components/app';
import { RepoState } from "./repo-state";

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

function openRepo(repo: Git.Repository) {
  if (app) {
    const repoState = new RepoState(repo, () => { app.addRepo(repoState); });
  }
}

ipcRenderer.on('clone-repo', async (event: Electron.Event, [path, url]: [string, string]) => {
  try {
    const repo = await Git.Clone.clone(url, path);
    openRepo(repo);
  } catch (e) {
    app.showNotification(e.message);
  }
});

ipcRenderer.on('init-repo', async (event: Electron.Event, path: string) => {
  try {
    const repo = await Git.Repository.init(path, 0);
    openRepo(repo);
  } catch (e) {
    app.showNotification(e.message);
  }
});

ipcRenderer.on('open-repo', async (event: Electron.Event, path: string) => {
  try {
    const repo = await Git.Repository.open(path);
    openRepo(repo);
  } catch (e) {
    app.showNotification(e.message);
  }
});

// Unhandled exceptions

function handleError(e: any) {
  if (e.code === 'ENOTDIR' || e.code === 'ENOENT') {
    console.log(e);
  }
  else {
    console.error(e);
  }
}

unhandled({
  logger: handleError 
});