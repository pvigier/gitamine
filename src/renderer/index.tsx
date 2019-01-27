import { ipcRenderer } from 'electron';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Git from 'nodegit';
import * as settings from 'electron-settings';
import * as unhandled from 'electron-unhandled';
import { AppContainer } from 'react-hot-loader';
import { App } from './components/app';
import { RepoState } from "./repo-state";
import { Field, getKey } from './settings';

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
    const repoState = new RepoState(repo, () => { 
      app.addRepo(repoState); 
      // Update settings
      const recentlyOpened: string[] = settings.get(getKey(Field.RecentlyOpened), []);
      // Make sure that there is no duplicate
      const iPath = recentlyOpened.indexOf(repoState.path);
      if (iPath !== -1) {
        recentlyOpened.splice(iPath, 1);
      }
      settings.set(getKey(Field.RecentlyOpened), [repoState.path, ...recentlyOpened.slice(0, 2)]);
    });
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