import * as React from 'react';
import * as Git from 'nodegit';
import { GraphViewer } from './graph-viewer';
import { CommitViewer } from './commit-viewer';
import { PatchViewer } from './patch-viewer';
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
    this.exitPatchViewer = this.exitPatchViewer.bind(this);
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

  exitPatchViewer() {
    this.setState({
      selectedPatch: null
    } as RepoDashboardState);
  }

  render() {
    let viewer; 
    if (this.state.selectedCommit && this.state.selectedPatch) {
      viewer = <PatchViewer repo={this.props.repo} 
        commit={this.state.selectedCommit!} 
        patch={this.state.selectedPatch!} 
        onEscapePressed={this.exitPatchViewer} /> 
    } else {
      viewer = <GraphViewer repo={this.props.repo} 
        selectedCommit={this.state.selectedCommit} 
        onCommitSelect={this.handleCommitSelect} />
    }
    return (
      <div className='repo-dashboard'>
        <div className='repo-header'>
          <h1>{this.props.repo.name}</h1>
        </div>
        <div className='repo-content'>
          {viewer}
          <CommitViewer commit={this.state.selectedCommit} 
            selectedPatch={this.state.selectedPatch} 
            onPatchSelect={this.handlePatchSelect} 
      </div>
    );
  }
}