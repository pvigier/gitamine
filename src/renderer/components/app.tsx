import * as React from 'react';
import { RepoDashboard } from './repo-dashboard';
import { Repository } from '../repository';

export interface AppState { repos: Repository[]; }

export class App extends React.Component<{}, AppState> {
  static instance: App | null = null;
  state: AppState;

  constructor(props: {}) {
    super(props);
    this.state = {
      repos: []
    };
    // Set singleton
    App.instance = this;
  }

  addRepo(repo: Repository) {
    this.setState((state: AppState): AppState => ({
      repos: state.repos.concat([repo])
    }));
  }

  render() {
    const repoDashboards = this.state.repos.map((repo: Repository) => <RepoDashboard repo={repo} key={repo.repo.path()} />);
    return (
      <div id='app'>
        {repoDashboards}
      </div>
    );
  }
}
