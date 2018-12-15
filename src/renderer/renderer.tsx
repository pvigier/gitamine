import { ipcRenderer } from 'electron';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Git from 'nodegit';
import { AppContainer } from 'react-hot-loader';
import { App } from './components/app';

let render = () => {
  ReactDOM.render(<AppContainer><App /></AppContainer>, document.getElementById('app'));
};

render();
if (module.hot) { module.hot.accept(render); }

// Events

ipcRenderer.on('open-repo', (event: Electron.Event, path: string) => {
  console.log(event, path);
  Git.Repository.open(path)
    .then(function(repo: Git.Repository) {
      if (App.instance) {
        App.instance.addRepo(repo);
      }
    });
});