import * as React from 'react';
import { RepoDashboard } from './repo-dashboard';
import { RepoState } from "../repo-state";

export interface AppState { repos: RepoState[]; }

export class App extends React.Component<{}, AppState> {
  state: AppState;

  constructor(props: {}) {
    super(props);
    this.state = {
      repos: []
    };
  }

  addRepo(repo: RepoState) {
    this.setState((state: AppState): AppState => ({
      repos: state.repos.concat([repo])
    }));
  }

  render() {
    const repoDashboards = this.state.repos.map((repo: RepoState) => <RepoDashboard repo={repo} key={repo.path} />);
    return (
      <div id='app'>
        {repoDashboards}
      </div>
    );
  }
}
