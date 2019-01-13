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
  index: Git.Index;

  constructor(props: IndexViewerProps) {
    super(props);
    this.div = React.createRef<HTMLDivElement>();
    this.state = {
      unstagedPatches: [],
      stagedPatches: []
    }
    this.handleUnstagedPatchSelect = this.handleUnstagedPatchSelect.bind(this);
    this.handleStagedPatchSelect = this.handleStagedPatchSelect.bind(this);
    this.stagePatch = this.stagePatch.bind(this);
    this.unstagePatch = this.unstagePatch.bind(this);
    this.getPatches();
  }

  handleUnstagedPatchSelect(patch: Git.ConvenientPatch) {
    this.props.onPatchSelect(patch, PatchViewerMode.Stage);
  }

  handleStagedPatchSelect(patch: Git.ConvenientPatch) {
    this.props.onPatchSelect(patch, PatchViewerMode.Unstage);
  }

  stagePatch(patch: Git.ConvenientPatch) {
    this.index.addByPath(patch.newFile().path())
      .then(() => this.index.write());
  }

  unstagePatch(patch: Git.ConvenientPatch) {
    this.index.removeByPath(patch.newFile().path())
      .then(() => this.index.write());
  }

  resize(offset: number) {
    if (this.div.current) {
      this.div.current.style.width = `${this.div.current.clientWidth + offset}px`;
    }
  }

  getPatches() {
    const repo = this.props.repo.repo;
    const headCommit = this.props.repo.shaToCommit.get(this.props.repo.head)!;
    Promise.all([repo.index(), headCommit.getTree()])
      .then(([index, tree]) => {
        this.index = index;
        const unstagedPatches = Git.Diff.indexToWorkdir(repo, index) 
          .then((diff) => diff.findSimilar({}).then(() => diff))
          .then((diff) => diff.patches());
        const stagedPatches = Git.Diff.treeToIndex(repo, tree, index)
          .then((diff) => diff.findSimilar({}).then(() => diff))
          .then((diff) => diff.patches());
        Promise.all([unstagedPatches, stagedPatches])
          .then(([unstagedPatches, stagedPatches]) => {
            this.setState({
              unstagedPatches: unstagedPatches,
              stagedPatches: stagedPatches
            });
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
          onPatchSelect={this.handleUnstagedPatchSelect} 
          onStage={this.stagePatch} />
        <p>Staged files</p>
        <PatchList patches={this.state.stagedPatches}
          selectedPatch={this.props.selectedPatch}
          onPatchSelect={this.handleStagedPatchSelect}
          onUnstage={this.unstagePatch} />
      </div>
    );
  }
}