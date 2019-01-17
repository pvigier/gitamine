import * as Path from 'path';
import * as fs from 'fs';
import * as node_watch from 'node-watch';
import * as React from 'react';
import * as Git from 'nodegit';
import { GraphViewer } from './graph-viewer';
import { CommitViewer } from './commit-viewer';
import { IndexViewer } from './index-viewer';
import { PatchViewer, PatchViewerMode } from './patch-viewer';
import { Splitter } from './splitter';
import { RepoState } from "../repo-state";

export interface RepoDashboardProps { 
  repo: RepoState;
}

export interface RepoDashboardState { 
  selectedCommit: Git.Commit | null;
  selectedPatch: Git.ConvenientPatch | null;
  patchViewerMode: PatchViewerMode;
}

export class RepoDashboard extends React.PureComponent<RepoDashboardProps, RepoDashboardState> {
  graphViewer: React.RefObject<GraphViewer>;
  rightViewer: React.RefObject<CommitViewer | IndexViewer>;

  constructor(props: RepoDashboardProps) {
    super(props);
    this.graphViewer = React.createRef();
    this.rightViewer = React.createRef();
    this.handleCommitSelect = this.handleCommitSelect.bind(this);
    this.handleIndexSelect = this.handleIndexSelect.bind(this);
    this.handlePatchSelect = this.handlePatchSelect.bind(this);
    this.exitPatchViewer = this.exitPatchViewer.bind(this);
    this.handlePanelResize = this.handlePanelResize.bind(this);
    this.state = {
      selectedCommit: null,
      selectedPatch: null,
      patchViewerMode: PatchViewerMode.ReadOnly
    };

    const path = this.props.repo.path;
    // Watch index and head 
    // TODO: there may be problems with index.lock
    fs.watch(path, async (error: string, filename: string) => {
      if (filename === 'index') {
        this.refreshIndex();
      } else if (filename === 'HEAD') {
        await this.refreshHead();
        this.refreshIndex();
      }
    });
    // Watch working directory
    const regex = /.*\.git\/.*/; // Exclude .git folders
    node_watch(Path.dirname(path), 
      {recursive: true, filter: (f: string) => !regex.test(f)}, 
      (error: string, filename: string) => {
        console.log('wd', filename);
        // TODO: check if the file is ignored
        this.refreshIndex();
      }
    );
    // Watch references
    node_watch(Path.join(path, 'refs'), {recursive: true}, async () => {
      await this.refreshReferences();
      this.refreshIndex();
    });
  }

  handleCommitSelect(commit: Git.Commit) {
    this.setState({
      selectedCommit: commit
    });
  }

  handleIndexSelect() {
    this.setState({
      selectedCommit: null
    });
  }

  handlePatchSelect(patch: Git.ConvenientPatch, mode: PatchViewerMode) {
    this.setState({
      selectedPatch: patch,
      patchViewerMode: mode
    });
  }

  exitPatchViewer() {
    this.setState({
      selectedPatch: null
    });
  }

  handlePanelResize(offset: number) {
    if (this.rightViewer.current) {
      this.rightViewer.current.resize(offset);
    }
  }

  refreshIndex() {
    if (!this.state.selectedCommit && this.rightViewer.current) {
      (this.rightViewer.current as IndexViewer).refresh();
    }
  }

  async refreshHead() {
    await this.props.repo.updateHead();
    await this.props.repo.updateGraph();
    if (this.graphViewer.current) {
      this.graphViewer.current.updateGraph();
    }
  }

  async refreshReferences() {
    // TODO: update only references that changed
    await this.props.repo.update();
    if (this.graphViewer.current) {
      this.graphViewer.current.updateGraph();
    }
  }

  render() {
    let leftViewer; 
    if (this.state.selectedPatch) {
      leftViewer = <PatchViewer repo={this.props.repo} 
        patch={this.state.selectedPatch!} 
        mode={this.state.patchViewerMode}
        onEscapePressed={this.exitPatchViewer} /> 
    } else {
      leftViewer = <GraphViewer repo={this.props.repo} 
        selectedCommit={this.state.selectedCommit} 
        onCommitSelect={this.handleCommitSelect}
        onIndexSelect={this.handleIndexSelect} 
        ref={this.graphViewer} />
    }
    let rightViewer;
    if (this.state.selectedCommit) {
      rightViewer = <CommitViewer commit={this.state.selectedCommit} 
        selectedPatch={this.state.selectedPatch} 
        onPatchSelect={this.handlePatchSelect} 
        ref={this.rightViewer as React.RefObject<CommitViewer>} />
    } else {
      rightViewer = <IndexViewer repo={this.props.repo} 
        selectedPatch={this.state.selectedPatch} 
        onPatchSelect={this.handlePatchSelect} 
        ref={this.rightViewer as React.RefObject<IndexViewer>} />
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