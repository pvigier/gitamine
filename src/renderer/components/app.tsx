import * as React from 'react';
import { RepoDashboard } from './repo-dashboard';
import { RepoState } from "../repo-state";

export interface AppState { repos: RepoState[]; }

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

  addRepo(repo: RepoState) {
    this.setState((state: AppState): AppState => ({
      repos: state.repos.concat([repo])
    }));
  }

  render() {
    const repoDashboards = this.state.repos.map((repo: RepoState) => <RepoDashboard repo={repo} key={repo.repo.path()} />);
    return (
      <div id='app'>
        {repoDashboards}
      </div>
    );
  }
}
