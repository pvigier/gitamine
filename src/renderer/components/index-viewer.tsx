import * as React from 'react';
import * as Git from 'nodegit';
import { PatchList } from './patch-list';
import { RepoState, PatchType } from '../repo-state';

export interface IndexViewerProps { 
  repo: RepoState;
  selectedPatch: Git.ConvenientPatch | null;
  onPatchSelect: (patch: Git.ConvenientPatch | null, type: PatchType) => void;
}

export interface IndexViewerState {
  unstagedPatches: Git.ConvenientPatch[];
  stagedPatches: Git.ConvenientPatch[];
  summary: string;
}

export class IndexViewer extends React.PureComponent<IndexViewerProps, IndexViewerState> {
  div: React.RefObject<HTMLDivElement>;
  iSelectedPatch: number;

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
  }

  componentDidMount() {
    this.getPatches();
  }

  handleUnstagedPatchSelect(patch: Git.ConvenientPatch) {
    this.iSelectedPatch = this.state.unstagedPatches.indexOf(patch); 
    this.props.onPatchSelect(patch, PatchType.Unstaged);
  }

  handleStagedPatchSelect(patch: Git.ConvenientPatch) {
    this.iSelectedPatch = this.state.stagedPatches.indexOf(patch); 
    this.props.onPatchSelect(patch, PatchType.Staged);
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
    // Try to find the find in the same list
    let patch = patches[0].find((patch) => path === patch.newFile().path());
    if (patch) {
      handler[0].call(this, patch);
      return;
    }
    // If there is another patch in this list, select it
    if (patches[0].length > 0) {
      const i = this.iSelectedPatch < patches[0].length ?
        this.iSelectedPatch :
        Math.max(patches[0].length - 1, this.iSelectedPatch - 1);
      handler[0].call(this, patches[0][i]);
      return;
    }
    // Otherwise, try to find the file in the other list
    patch = patches[1].find((patch) => path === patch.newFile().path());
    if (patch) {
      handler[1].call(this, patch);
      return;
    }
    // Finally, if there nothing succeeded reset the selected patch
    this.props.onPatchSelect(null, PatchType.Committed);
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
        <PatchList repo={this.props.repo}
          patches={this.state.unstagedPatches}
          type={PatchType.Unstaged}
          selectedPatch={this.props.selectedPatch}
          onPatchSelect={this.handleUnstagedPatchSelect} />
        <div className='button-inline'>
          <p>Staged files ({this.state.stagedPatches.length})</p>
          <button disabled={this.state.stagedPatches.length === 0}
            onClick={repo.unstageAll.bind(repo, this.state.stagedPatches)}>
            Unstage all changes
           </button>
        </div >
        <PatchList repo={this.props.repo}
          patches={this.state.stagedPatches}
          type={PatchType.Staged}
          selectedPatch={this.props.selectedPatch}
          onPatchSelect={this.handleStagedPatchSelect} />
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