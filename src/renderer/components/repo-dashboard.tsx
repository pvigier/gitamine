import * as Path from 'path';
import * as fs from 'fs';
import * as chokidar from 'chokidar';
import * as React from 'react';
import * as Git from 'nodegit';
import { GraphViewer } from './graph-viewer';
import { CommitViewer } from './commit-viewer';
import { IndexViewer } from './index-viewer';
import { PatchViewer } from './patch-viewer';
import { Splitter } from './splitter';
import { Toolbar } from './toolbar';
import { RepoState, PatchType } from '../helpers/repo-state';
import { ThemeManager } from '../helpers/theme-manager';

export interface RepoDashboardProps { 
  repo: RepoState;
  themeManager: ThemeManager;
}

export interface RepoDashboardState { 
  selectedCommit: Git.Commit | null;
  selectedPatch: Git.ConvenientPatch | null;
  patchType: PatchType;
}

export class RepoDashboard extends React.PureComponent<RepoDashboardProps, RepoDashboardState> {
  graphViewer: React.RefObject<GraphViewer>;
  rightViewer: React.RefObject<CommitViewer | IndexViewer>;
  dirtyWordingDirectory: boolean;

  constructor(props: RepoDashboardProps) {
    super(props);
    this.graphViewer = React.createRef();
    this.rightViewer = React.createRef();
    this.dirtyWordingDirectory = false;
    this.handleCommitSelect = this.handleCommitSelect.bind(this);
    this.handleIndexSelect = this.handleIndexSelect.bind(this);
    this.handlePatchSelect = this.handlePatchSelect.bind(this);
    this.exitPatchViewer = this.exitPatchViewer.bind(this);
    this.handlePanelResize = this.handlePanelResize.bind(this);
    this.state = {
      selectedCommit: null,
      selectedPatch: null,
      patchType: PatchType.Committed
    };
  }

  async componentDidMount() {
    await this.props.repo.init();
    if (!this.state.selectedCommit && this.rightViewer.current) {
      const indexViewer = this.rightViewer.current as IndexViewer;
      await indexViewer.refresh();
    }
    if (this.graphViewer.current) {
      this.graphViewer.current.updateGraph();
    }
    this.setWatchers();
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

  handlePatchSelect(patch: Git.ConvenientPatch | null, type: PatchType) {
    this.setState({
      selectedPatch: patch,
      patchType: type
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
  
  setWatchers() {
    const path = this.props.repo.path;
    // Watch index and head 
    // fs.watch seems sufficient for that, I should try with chokidar
    fs.watch(path, async (error: string, filename: string) => {
      console.log('repo', filename);
      if (filename === 'index') {
        this.refreshIndex();
      } else if (filename === 'HEAD') {
        await this.refreshHead();
        this.refreshIndex();
      }
    });

    // Watch working directory
    // It seems to work much better on big repo with polling
    const wdPath = Path.dirname(path);
    const workingDirectoryWatcher = chokidar.watch(wdPath, {
      ignoreInitial: true,
      ignored: [/(.*\.git(\/.*|$))/, (path: string) => this.props.repo.isIgnored(Path.relative(wdPath, path))],
      followSymlinks: false,
      usePolling: true,
      interval: 200,
      binaryInterval: 500
    });
    workingDirectoryWatcher.on('all', async (event: string, path: string) => {
      console.log('wd', event, path);
      if (path.endsWith('.gitignore')) {
        this.props.repo.updateIgnore();
      }
      this.dirtyWordingDirectory = true;
    });
    // To prevent from updating too often
    setInterval(async () => {
      if (this.dirtyWordingDirectory) {
        this.refreshIndex();
        this.dirtyWordingDirectory = false;
      }
    }, 200);

    // Watch references
    const referencesWatcher = chokidar.watch(Path.join(path, 'refs'), {
      ignoreInitial: true,
      followSymlinks: false
    });
    referencesWatcher.on('all', async (event: string, path: string) => {
      console.log('refs', event, path);
      await this.refreshReferences();
      this.refreshIndex();
    });
  }

  async refreshIndex() {
    if (!this.state.selectedCommit && this.rightViewer.current) {
      const indexViewer = this.rightViewer.current as IndexViewer;
      await indexViewer.refresh();
      if (this.state.selectedPatch && this.state.patchType !== PatchType.Committed) {
        indexViewer.refreshSelectedPatch(this.state.patchType === PatchType.Unstaged);
      }
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
    await this.props.repo.requestUpdateCommits();
    await this.props.repo.updateHead();
    await this.props.repo.updateGraph();
    if (this.graphViewer.current) {
      this.graphViewer.current.updateGraph();
    }
  }

  render() {
    let leftViewer; 
    if (this.state.selectedPatch) {
      leftViewer = <PatchViewer repo={this.props.repo} 
        patch={this.state.selectedPatch!} 
        type={this.state.patchType}
        editorTheme={this.props.themeManager.getEditorTheme()}
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
        <Toolbar repo={this.props.repo} />
        <div className='repo-content'>
          {leftViewer}
          <Splitter onPanelResize={this.handlePanelResize} />
          {rightViewer}
        </div>
      </div>
    );
  }
}