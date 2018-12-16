import * as React from 'react';
import * as Git from 'nodegit';
import { RepoDashboard } from './repo-dashboard'

export interface AppState { repos: Git.Repository[]; }

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

  addRepo(repo: Git.Repository) {
    this.setState((state: AppState): AppState => ({
      repos: state.repos.concat([repo])
    }));
  }

  render() {
    let repoDashboards = this.state.repos.map((repo: Git.Repository) => <RepoDashboard repo={repo} key={repo.path()} />);
    return (
      <div id='app'>
        {repoDashboards}
      </div>
    );
  }
}
