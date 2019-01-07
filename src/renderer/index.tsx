import { ipcRenderer } from 'electron';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Git from 'nodegit';
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

function openRepo(path: string) {
  if (app) {
    const repo = new RepoState(path, () => { app.addRepo(repo); });
  }
}

ipcRenderer.on('open-repo', (event: Electron.Event, path: string) => {
  openRepo(path);
});

ipcRenderer.on('init-repo', (event: Electron.Event, path: string) => {
  Git.Repository.init(path, 0).then(() => openRepo(path));
});