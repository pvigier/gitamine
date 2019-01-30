import { ipcRenderer } from 'electron';
import * as React from 'react';
import { Field, Settings } from '../settings';

export class WelcomeDashboardProps {
  onRecentlyOpenedRepoClick: (path: string) => void
}
export class WelcomeDashboard extends React.PureComponent<WelcomeDashboardProps, {}> {
  constructor(props: WelcomeDashboardProps) {
    super(props);
    this.sendOpenRepoMessage = this.sendOpenRepoMessage.bind(this);
    this.sendInitRepoMessage = this.sendInitRepoMessage.bind(this);
    this.sendCloneRepoMessage = this.sendCloneRepoMessage.bind(this);
  }

  sendOpenRepoMessage() {
    ipcRenderer.send('open-open-repo-window');
  }

  sendInitRepoMessage() {
    ipcRenderer.send('open-init-repo-window');
  }

  sendCloneRepoMessage() {
    ipcRenderer.send('open-clone-repo-window');
  }

  render() {
    const recentlyOpenedItems = Settings.get(Field.RecentlyOpened, [])
      .map((path: string) => (
        <button key={path} onClick={() => this.props.onRecentlyOpenedRepoClick(path)}>
          {path}
        </button>
      ));
    return (
      <div className='welcome-dashboard'>
        <h1>Welcome to gitamine!</h1>
        <h2>Recently opened repo</h2>
        <div>
          {recentlyOpenedItems}
        </div>
        <h2>Actions</h2>
        <div>
          <button onClick={this.sendOpenRepoMessage}>Open a repo</button>
          <button onClick={this.sendInitRepoMessage}>Init a repo</button>
          <button onClick={this.sendCloneRepoMessage}>Clone a repo</button>
        </div>
      </div>
    );
  }
}