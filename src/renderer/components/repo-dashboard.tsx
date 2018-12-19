import * as React from 'react';
import * as Git from 'nodegit';
import { GraphViewer } from './graph-viewer';
import { CommitViewer } from './commit-viewer';
import { RepoState } from "../repo-state";

export interface RepoDashboardProps { repo: RepoState; }
export interface RepoDashboardState { selectedCommit: Git.Commit | null; }

export class RepoDashboard extends React.Component<RepoDashboardProps, RepoDashboardState> {
  constructor(props: RepoDashboardProps) {
    super(props);
    this.handleCommitSelect = this.handleCommitSelect.bind(this);
    this.state = {
      selectedCommit: null
    };
  }

  handleCommitSelect(commit: Git.Commit) {
    this.setState({
      selectedCommit: commit
    });
  }

  render() {
    return (
      <div className='repo-dashboard'>
        <div className='repo-header'>
          <h1>{this.props.repo.repo.path()}</h1>
        </div>
        <GraphViewer repo={this.props.repo} onCommitSelect={this.handleCommitSelect} />
        <CommitViewer commit={this.state.selectedCommit} />
      </div>
    );
  }
}