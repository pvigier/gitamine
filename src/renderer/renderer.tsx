import { ipcRenderer } from 'electron';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Git from 'nodegit';
import { AppContainer } from 'react-hot-loader';
import { App } from './components/app';

function render() {
  ReactDOM.render(<AppContainer><App /></AppContainer>, document.getElementById('container'));
}

render();
if (module.hot) { module.hot.accept(render); }

// Events

ipcRenderer.on('open-repo', (event: Electron.Event, path: string) => {
  Git.Repository.open(path)
    .then(function(repo: Git.Repository) {
      if (App.instance) {
        App.instance.addRepo(repo);
      }
    });
});