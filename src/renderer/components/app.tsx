import * as React from 'react';
import { RepoDashboard } from './repo-dashboard';
import { RepoState } from '../repo-state';
import { NotificationQueue } from './notification-queue';

export interface AppState {
  repos: RepoState[]; 
}

export class App extends React.PureComponent<{}, AppState> {
  notificationQueue: React.RefObject<NotificationQueue>;

  constructor(props: {}) {
    super(props);
    this.notificationQueue = React.createRef();
    this.state = {
      repos: []
    };
  }

  addRepo(repo: RepoState) {
    this.setState((state: AppState): AppState => ({
      repos: [repo]
    }));
  }

  showNotification(message: string) {
    if (this.notificationQueue.current) {
      this.notificationQueue.current.addNotification(message);
    }
  }

  render() {
    const repoDashboards = this.state.repos.map((repo: RepoState) => <RepoDashboard repo={repo} key={repo.path} />);
    return (
      <div id='app'>
        {repoDashboards}
        <NotificationQueue ref={this.notificationQueue} />
      </div>
    );
  }
}
