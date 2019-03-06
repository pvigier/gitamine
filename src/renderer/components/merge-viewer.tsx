import * as React from 'react';
import * as Git from 'nodegit';
import { PatchList } from './patch-list';
import { RepoState, PatchType } from '../helpers/repo-state';

export interface MergeViewerProps { 
  repo: RepoState;
  selectedPatch: Git.ConvenientPatch | null;
  onPatchSelect: (patch: Git.ConvenientPatch | null, type: PatchType) => void;
}

export interface MergeViewerState {
  unmergedPatches: Git.ConvenientPatch[];
  stagedPatches: Git.ConvenientPatch[];
  selectedUnmergedPatches: Set<Git.ConvenientPatch>;
}

export class MergeViewer extends React.PureComponent<MergeViewerProps, MergeViewerState> {
  form: React.RefObject<HTMLFormElement>;
  iSelectedPatch: number;

  constructor(props: MergeViewerProps) {
    super(props);
    this.form = React.createRef<HTMLFormElement>();
    this.state = {
      unmergedPatches: [],
      stagedPatches: [],
      selectedUnmergedPatches: new Set(),
    }
    this.handleUnmergedPatchSelect = this.handleUnmergedPatchSelect.bind(this);
    this.handleSelectedUnmergedPatchesChange = this.handleSelectedUnmergedPatchesChange.bind(this);
    this.handleStagedPatchSelect = this.handleStagedPatchSelect.bind(this);
    this.handlePatchesStage = this.handlePatchesStage.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.getPatches();
  }
   
  handleUnmergedPatchSelect(patch: Git.ConvenientPatch) {
    this.setState({
      selectedUnmergedPatches: new Set([patch]),
    });
    this.iSelectedPatch = this.state.unmergedPatches.indexOf(patch);
    this.props.onPatchSelect(patch, PatchType.Unstaged);
  }

  handleSelectedUnmergedPatchesChange(selectedPatches: Set<Git.ConvenientPatch>) {
    this.setState({
      selectedUnmergedPatches: selectedPatches,
    });
    this.props.onPatchSelect(null, PatchType.Staged);
  }

  handleStagedPatchSelect(patch: Git.ConvenientPatch) {
    this.setState({
      selectedUnmergedPatches: new Set(),
    });
    this.iSelectedPatch = this.state.stagedPatches.indexOf(patch);
    this.props.onPatchSelect(patch, PatchType.Committed);
  }

  handlePatchesStage() {
    if (this.props.selectedPatch || this.state.selectedUnmergedPatches.size === 0) {
      this.props.repo.stageAll(this.state.unmergedPatches)
    } else if (this.state.selectedUnmergedPatches.size > 0) {
      this.props.repo.stageAll([...this.state.selectedUnmergedPatches])
    }
    this.setState({
      selectedUnmergedPatches: new Set()
    });
  }

  async refresh() {
    await this.getPatches();
  }

  refreshSelectedPatch(unstagedPatch: boolean) {
    const patches = unstagedPatch ? 
      [this.state.unmergedPatches, this.state.stagedPatches] :
      [this.state.stagedPatches, this.state.unmergedPatches];
    const handler = unstagedPatch ? 
      [this.handleUnmergedPatchSelect, this.handleStagedPatchSelect] :
      [this.handleStagedPatchSelect, this.handleUnmergedPatchSelect];
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
    if (this.form.current) {
      this.form.current.style.width = `${this.form.current.clientWidth - offset}px`;
    }
  }

  async getPatches() {
    return new Promise<void>(async (resolve) => {
      this.setState({
        unmergedPatches: await this.props.repo.getUnstagedPatches(),
        stagedPatches: await this.props.repo.getStagedPatches()
      }, () => {
        resolve();
      });
    });
  }

  async handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Test if all conflicts are resolved
    // Merge or abort
    // Close path viewer if it is open
    this.props.onPatchSelect(null, PatchType.Committed);
    // Reset the state
    this.setState({
      selectedUnmergedPatches: new Set(),
    });
  }

  formatButtonString(patches: Set<Git.ConvenientPatch>) {
    if (this.props.selectedPatch || patches.size === 0) {
      return 'Mark all resolved'
    } else if (patches.size === 1) {
      return 'Mark 1 file resolved'
    } else {
      return `Mark ${patches.size} files resolved`
    }
  }

  render() {
    return (
      <form className='commit-viewer index-viewer' ref={this.form} onSubmit={this.handleSubmit}>
        <div className='commit-message'>
          <h2>Index</h2>
        </div>
        <div className='section-header'>
          <p>Conflicted files ({this.state.unmergedPatches.length})</p>
          <button className='yellow-button'
            type='button'
            disabled={this.state.unmergedPatches.length === 0}
            onClick={this.handlePatchesStage}>
            {this.formatButtonString(this.state.selectedUnmergedPatches)}
          </button>
        </div>
        <PatchList repo={this.props.repo}
          patches={this.state.unmergedPatches}
          type={PatchType.Conflicted}
          selectedPatch={this.props.selectedPatch}
          selectedPatches={this.state.selectedUnmergedPatches}
          onPatchSelect={this.handleUnmergedPatchSelect} 
          onSelectedPatchesChange={this.handleSelectedUnmergedPatchesChange} />
        <div className='section-header'>
          <p>Staged files ({this.state.stagedPatches.length})</p>
        </div >
        <PatchList repo={this.props.repo}
          patches={this.state.stagedPatches}
          type={PatchType.Committed}
          selectedPatch={this.props.selectedPatch}
          onPatchSelect={this.handleStagedPatchSelect} />
        <button className='green-button'
          type='submit'
          disabled={this.state.unmergedPatches.length === 0}>
          Merge
        </button>
        <button className='red-button' type='submit'>
          Abort
        </button>
      </form>
    );
  }
}