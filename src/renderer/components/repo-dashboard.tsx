import * as React from 'react';
import * as Git from 'nodegit';
import { GraphViewer } from './graph-viewer';
import { CommitViewer } from './commit-viewer';
import { IndexViewer } from './index-viewer';
import { PatchViewer } from './patch-viewer';
import { Splitter } from './splitter';
import { RepoState } from "../repo-state";

export interface RepoDashboardProps { repo: RepoState; }

export interface RepoDashboardState { 
  selectedCommit: Git.Commit | null;
  selectedPatch: Git.ConvenientPatch | null;
}

export class RepoDashboard extends React.PureComponent<RepoDashboardProps, RepoDashboardState> {
  rightViewer: React.RefObject<CommitViewer | IndexViewer>;

  constructor(props: RepoDashboardProps) {
    super(props);
    this.rightViewer = React.createRef();
    this.handleCommitSelect = this.handleCommitSelect.bind(this);
    this.handleIndexSelect = this.handleIndexSelect.bind(this);
    this.handlePatchSelect = this.handlePatchSelect.bind(this);
    this.exitPatchViewer = this.exitPatchViewer.bind(this);
    this.handlePanelResize = this.handlePanelResize.bind(this);
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

  handleIndexSelect() {
    this.setState({
      selectedCommit: null
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

  handlePanelResize(offset: number) {
    if (this.rightViewer.current) {
      this.rightViewer.current.resize(offset);
    }
  }

  render() {
    let leftViewer; 
    if (this.state.selectedCommit && this.state.selectedPatch) {
      leftViewer = <PatchViewer repo={this.props.repo} 
        commit={this.state.selectedCommit!} 
        patch={this.state.selectedPatch!} 
        onEscapePressed={this.exitPatchViewer} /> 
    } else {
      leftViewer = <GraphViewer repo={this.props.repo} 
        selectedCommit={this.state.selectedCommit} 
        onCommitSelect={this.handleCommitSelect}
        onIndexSelect={this.handleIndexSelect} />
    }
    let rightViewer;
    if (this.state.selectedCommit) {
      rightViewer = <CommitViewer commit={this.state.selectedCommit} 
        selectedPatch={this.state.selectedPatch} 
        onPatchSelect={this.handlePatchSelect} 
        ref={this.rightViewer as React.RefObject<CommitViewer>} />
    } else {
      rightViewer = <IndexViewer ref={this.rightViewer as React.RefObject<IndexViewer>} />
    }
    return (
      <div className='repo-dashboard'>
        <div className='repo-header'>
          <h1>{this.props.repo.name}</h1>
        </div>
        <div className='repo-content'>
          {leftViewer}
          <Splitter onPanelResize={this.handlePanelResize} />
          {rightViewer}
        </div>
      </div>
    );
  }
}