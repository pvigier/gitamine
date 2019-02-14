import { ipcRenderer } from 'electron';
import * as React from 'react';
import { Field, Settings } from '../../shared/settings';
import { getRepoName } from '../helpers/repo-state';

export class WelcomeDashboardProps {
  onRecentlyOpenedRepoClick: (path: string) => void;
  onInitRepo: () => void;
}
export class WelcomeDashboard extends React.PureComponent<WelcomeDashboardProps, {}> {
  constructor(props: WelcomeDashboardProps) {
    super(props);
    this.sendOpenRepoMessage = this.sendOpenRepoMessage.bind(this);
    this.sendCloneRepoMessage = this.sendCloneRepoMessage.bind(this);
  }

  sendOpenRepoMessage() {
    ipcRenderer.send('open-open-repo-window');
  }

  sendCloneRepoMessage() {
    ipcRenderer.send('open-clone-repo-window');
  }

  render() {
    const recentlyOpenedItems = Settings.get(Field.RecentlyOpened, [])
      .map((path: string) => (
        <div className='action' 
          onClick={() => this.props.onRecentlyOpenedRepoClick(path)}
          key={path}>
          <h3>{getRepoName(path)}</h3>
          <p>{path}</p>
        </div>
      ));
    return (
      <div className='welcome-dashboard'>
        <h1>Welcome to gitamine!</h1>
        <h2>Recently opened repo</h2>
        <div className='actions'>
          {recentlyOpenedItems}
        </div>
        <h2>Actions</h2>
        <div className='actions'>
          <div className='action' onClick={this.sendOpenRepoMessage}>
            <h3>Open a repo</h3>
           </div>
          <div className='action' onClick={this.props.onInitRepo}>
            <h3>Init a repo</h3>
           </div>
          <div className='action' onClick={this.sendCloneRepoMessage}>
            <h3>Clone a repo</h3>
          </div>
        </div>
      </div>
    );
  }
}
