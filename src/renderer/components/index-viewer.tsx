import * as React from 'react';
import * as Git from 'nodegit';
import { PatchList } from './patch-list';
import { PatchViewerMode } from './patch-viewer';
import { RepoState } from '../repo-state';

export interface IndexViewerProps { 
  repo: RepoState;
  selectedPatch: Git.ConvenientPatch | null;
  onPatchSelect: (patch: Git.ConvenientPatch | null, mode: PatchViewerMode) => void;
}

export interface IndexViewerState {
  unstagedPatches: Git.ConvenientPatch[];
  stagedPatches: Git.ConvenientPatch[];
  summary: string;
}

export class IndexViewer extends React.PureComponent<IndexViewerProps, IndexViewerState> {
  div: React.RefObject<HTMLDivElement>;

  constructor(props: IndexViewerProps) {
    super(props);
    this.div = React.createRef<HTMLDivElement>();
    this.state = {
      unstagedPatches: [],
      stagedPatches: [],
      summary: ''
    }
    this.handleUnstagedPatchSelect = this.handleUnstagedPatchSelect.bind(this);
    this.handleStagedPatchSelect = this.handleStagedPatchSelect.bind(this);
    this.handleSummaryChange = this.handleSummaryChange.bind(this);
    this.commit = this.commit.bind(this);
    this.getPatches();
  }

  handleUnstagedPatchSelect(patch: Git.ConvenientPatch) {
    this.props.onPatchSelect(patch, PatchViewerMode.Stage);
  }

  handleStagedPatchSelect(patch: Git.ConvenientPatch) {
    this.props.onPatchSelect(patch, PatchViewerMode.Unstage);
  }

  handleSummaryChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({summary: event.target.value});
  }

  async refresh() {
    await this.getPatches();
  }

  refreshSelectedPatch(unstagedPatch: boolean) {
    const patches = unstagedPatch ? 
      [this.state.unstagedPatches, this.state.stagedPatches] :
      [this.state.stagedPatches, this.state.unstagedPatches];
    const handler = unstagedPatch ? 
      [this.handleUnstagedPatchSelect, this.handleStagedPatchSelect] :
      [this.handleStagedPatchSelect, this.handleUnstagedPatchSelect];
    const path = this.props.selectedPatch!.newFile().path();
    for (let i = 0; i < patches.length; ++i) {
      for (let patch of patches[i]) {
        if (path === patch.newFile().path()) {
          handler[i].call(this, patch);
          return;
        }
      }
    }
    this.props.onPatchSelect(null, PatchViewerMode.ReadOnly);
  }

  resize(offset: number) {
    if (this.div.current) {
      this.div.current.style.width = `${this.div.current.clientWidth + offset}px`;
    }
  }

  async getPatches() {
    return new Promise<void>(async (resolve) => {
      this.setState({
        unstagedPatches: await this.props.repo.getUnstagedPatches(),
        stagedPatches: await this.props.repo.getStagedPatches()
      }, () => {
        resolve();
      });
    });
  }

  async commit() {
    if (this.state.summary.length > 0) {
      await this.props.repo.commit(this.state.summary);
      this.setState({
        summary: ''
      });
    }
  }

  render() {
    const repo = this.props.repo;
    return (
      <div className='commit-viewer' ref={this.div}>
        <h2>Index</h2>
        <div className='button-inline'>
          <p>Unstaged files ({this.state.unstagedPatches.length})</p>
          <button disabled={this.state.unstagedPatches.length === 0}
            onClick={repo.stageAll.bind(repo, this.state.unstagedPatches)}>
            Stage all changes
          </button>
        </div>
        <PatchList patches={this.state.unstagedPatches}
          selectedPatch={this.props.selectedPatch}
          onPatchSelect={this.handleUnstagedPatchSelect} 
          onStage={repo.stagePatch.bind(repo)} />
        <div className='button-inline'>
          <p>Staged files ({this.state.stagedPatches.length})</p>
          <button disabled={this.state.stagedPatches.length === 0}
            onClick={repo.unstageAll.bind(repo, this.state.stagedPatches)}>
            Unstage all changes
           </button>
        </div >
        <PatchList patches={this.state.stagedPatches}
          selectedPatch={this.props.selectedPatch}
          onPatchSelect={this.handleStagedPatchSelect}
          onUnstage={repo.unstagePatch.bind(repo)} />
        <input placeholder={'Summary'} 
          value={this.state.summary} 
          onChange={this.handleSummaryChange} />
        <button onClick={this.commit} disabled={this.state.summary.length === 0}>
          Commit
        </button>
      </div>
    );
  }
}