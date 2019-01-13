import * as React from 'react';
import * as Git from 'nodegit';
import { PatchList } from './patch-list';
import { PatchViewerMode } from './patch-viewer';
import { RepoState } from '../repo-state';

export interface IndexViewerProps { 
  repo: RepoState;
  selectedPatch: Git.ConvenientPatch | null;
  onPatchSelect: (patch: Git.ConvenientPatch, mode: PatchViewerMode) => void;
}

export interface IndexViewerState {
  unstagedPatches: Git.ConvenientPatch[];
  stagedPatches: Git.ConvenientPatch[];
}

export class IndexViewer extends React.PureComponent<IndexViewerProps, IndexViewerState> {
  div: React.RefObject<HTMLDivElement>;

  constructor(props: IndexViewerProps) {
    super(props);
    this.div = React.createRef<HTMLDivElement>();
    this.state = {
      unstagedPatches: [],
      stagedPatches: []
    }
    this.handleUnstagedPatchSelect = this.handleUnstagedPatchSelect.bind(this);
    this.handleStagedPatchSelect = this.handleStagedPatchSelect.bind(this);
    this.getUnstagedPatches();
    this.getStagedPatches();
  }

  handleUnstagedPatchSelect(patch: Git.ConvenientPatch) {
    this.props.onPatchSelect(patch, PatchViewerMode.Stage);
  }

  handleStagedPatchSelect(patch: Git.ConvenientPatch) {
    this.props.onPatchSelect(patch, PatchViewerMode.Unstage);
  }

  resize(offset: number) {
    if (this.div.current) {
      this.div.current.style.width = `${this.div.current.clientWidth + offset}px`;
    }
  }

  getUnstagedPatches() {
    const repo = this.props.repo.repo;
    repo.index()
      .then((index) => Git.Diff.indexToWorkdir(repo, index) )
      .then((diff) => diff.findSimilar({}).then(() => diff))
      .then((diff) => diff.patches())
      .then((patches) => {
        this.setState({
          unstagedPatches: patches
        });
      });
  }

  getStagedPatches() {
    const repo = this.props.repo.repo;
    const headCommit = this.props.repo.shaToCommit.get(this.props.repo.head)!;
    Promise.all([repo.index(), headCommit.getTree()])
      .then(([index, tree]) => Git.Diff.treeToIndex(repo, tree, index) )
      .then((diff) => diff.findSimilar({}).then(() => diff))
      .then((diff) => diff.patches())
      .then((patches) => {
        this.setState({
          stagedPatches: patches
        });
      });
  }

  render() {
    return (
      <div className='commit-viewer' ref={this.div}>
        <h2>Index</h2>
        <p>Unstaged files</p>
        <PatchList patches={this.state.unstagedPatches}
          selectedPatch={this.props.selectedPatch}
          onPatchSelect={this.handleUnstagedPatchSelect} />
        <p>Staged files</p>
        <PatchList patches={this.state.stagedPatches}
          selectedPatch={this.props.selectedPatch}
          onPatchSelect={this.handleStagedPatchSelect} />
      </div>
    );
  }
}