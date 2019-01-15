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

  refresh() {
    this.getPatches();
  }

  resize(offset: number) {
    if (this.div.current) {
      this.div.current.style.width = `${this.div.current.clientWidth + offset}px`;
    }
  }

  async getPatches() {
    const repo = this.props.repo.repo;
    const headCommit = this.props.repo.shaToCommit.get(this.props.repo.head)!;
    const options = {
      flags: Git.Diff.OPTION.INCLUDE_UNTRACKED | 
        Git.Diff.OPTION.RECURSE_UNTRACKED_DIRS
    }
    this.index = await repo.refreshIndex();
    const [unstagedDiff, stagedDiff] = await Promise.all([
      Git.Diff.indexToWorkdir(repo, this.index, options),
      Git.Diff.treeToIndex(repo, await headCommit.getTree(), this.index, options)
    ]);
    unstagedDiff.findSimilar({});
    stagedDiff.findSimilar({});
    this.setState({
      unstagedPatches: await unstagedDiff.patches(),
      stagedPatches: await stagedDiff.patches()
    });
  }

  async stagePatch(patch: Git.ConvenientPatch) {
    if (patch.isDeleted()) {
      await this.index.removeByPath(patch.newFile().path())
      await this.index.write();
    } else {
      await this.index.addByPath(patch.newFile().path())
      await this.index.write();
    }
  }

  async unstagePatch(patch: Git.ConvenientPatch) {
    const headCommit = this.props.repo.shaToCommit.get(this.props.repo.head)!;
    await Git.Reset.default(this.props.repo.repo, headCommit, patch.newFile().path());
  }

  render() {
    return (
      <div className='commit-viewer' ref={this.div}>
        <h2>Index</h2>
        <div className='button-inline'>
          <p>Unstaged files ({this.state.unstagedPatches.length})</p>
          <button disabled={this.state.unstagedPatches.length === 0}>Stage all changes</button>
        </div>
        <PatchList patches={this.state.unstagedPatches}
          selectedPatch={this.props.selectedPatch}
          onPatchSelect={this.handleUnstagedPatchSelect} 
          onStage={this.stagePatch} />
        <div className='button-inline'>
          <p>Staged files ({this.state.stagedPatches.length})</p>
          <button disabled={this.state.stagedPatches.length === 0}>Unstage all changes</button>
        </div >
        <PatchList patches={this.state.stagedPatches}
          selectedPatch={this.props.selectedPatch}
          onPatchSelect={this.handleStagedPatchSelect}
          onUnstage={this.unstagePatch} />
        <input placeholder={'Summary'} />
        <button>Commit</button>
      </div>
    );
  }
}