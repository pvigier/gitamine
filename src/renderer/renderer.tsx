import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { App } from './components/app';

let render = () => {
  ReactDOM.render(<AppContainer><App /></AppContainer>, document.getElementById('app'));
};

render();
if (module.hot) { module.hot.accept(render); }