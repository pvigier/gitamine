import * as React from 'react';
import * as Git from 'nodegit';
import { GraphViewer } from './graph-viewer';
import { CommitViewer } from './commit-viewer';
import { RepoState } from "../repo-state";

export interface RepoDashboardProps { repo: RepoState; }

export interface RepoDashboardState { 
  selectedCommit: Git.Commit | null;
  selectedPatch: Git.ConvenientPatch | null;
}

export class RepoDashboard extends React.PureComponent<RepoDashboardProps, RepoDashboardState> {
  constructor(props: RepoDashboardProps) {
    super(props);
    this.handleCommitSelect = this.handleCommitSelect.bind(this);
    this.handlePatchSelect = this.handlePatchSelect.bind(this);
    this.state = {
      selectedCommit: null,
      selectedPatch: null
    };
  }

  handleCommitSelect(commit: Git.Commit) {
    this.setState({
      selectedCommit: commit
    } as RepoDashboardState);
  }

  handlePatchSelect(patch: Git.ConvenientPatch) {
    this.setState({
      selectedPatch: patch
    } as RepoDashboardState);
  }

  render() {
    return (
      <div className='repo-dashboard'>
        <div className='repo-header'>
          <h1>{this.props.repo.name}</h1>
        </div>
        <GraphViewer repo={this.props.repo} onCommitSelect={this.handleCommitSelect} />
        <CommitViewer commit={this.state.selectedCommit} onPatchSelect={this.handlePatchSelect} />
      </div>
    );
  }
}