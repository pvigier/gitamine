import * as React from 'react';
import * as Git from 'nodegit';
import { PatchList } from './patch-list';
import { RepoState, PatchType } from '../helpers/repo-state';

export interface IndexViewerProps { 
  repo: RepoState;
  selectedPatch: Git.ConvenientPatch | null;
  onPatchSelect: (patch: Git.ConvenientPatch | null, type: PatchType) => void;
}

export interface IndexViewerState {
  unstagedPatches: Git.ConvenientPatch[];
  stagedPatches: Git.ConvenientPatch[];
  amend: boolean;
  summary: string;
  selectedUnstagedPatches: Set<Git.ConvenientPatch>;
  selectedStagedPatches: Set<Git.ConvenientPatch>;
}

export class IndexViewer extends React.PureComponent<IndexViewerProps, IndexViewerState> {
  div: React.RefObject<HTMLDivElement>;
  iSelectedPatch: number;
  iAnchorPatch: number;
  iShiftPatch: number | null;
  handleUnstagedPatchSelect: (patch: Git.ConvenientPatch, ctrlKey: boolean, shiftKey: boolean) =>void;
  handleStagedPatchSelect: (patch: Git.ConvenientPatch, ctrlKey: boolean, shiftKey: boolean) =>void;

  constructor(props: IndexViewerProps) {
    super(props);
    this.div = React.createRef<HTMLDivElement>();
    this.state = {
      unstagedPatches: [],
      stagedPatches: [],
      amend: false,
      summary: '',
      selectedUnstagedPatches: new Set(),
      selectedStagedPatches: new Set()
    }
    this.handleUnstagedPatchSelect = this.generatePatchSelectHandler('unstagedPatches', 'selectedUnstagedPatches', 'selectedStagedPatches', PatchType.Unstaged);
    this.handleStagedPatchSelect = this.generatePatchSelectHandler('stagedPatches', 'selectedStagedPatches', 'selectedUnstagedPatches', PatchType.Staged);
    this.handlePatchesStage = this.handlePatchesStage.bind(this);
    this.handlePatchesUnstage = this.handlePatchesUnstage.bind(this);
    this.handleAmendChange = this.handleAmendChange.bind(this);
    this.handleSummaryChange = this.handleSummaryChange.bind(this);
    this.commit = this.commit.bind(this);
  }

  componentDidMount() {
    this.getPatches();
  }

  generatePatchSelectHandler(targetedPatchesKey: string, targetedSelectedPatchesKey: string, otherSelectedPatchesKey: string, type: PatchType) {
    return (patch: Git.ConvenientPatch, ctrlKey: boolean, shiftKey: boolean) => {
        this.setState((prevState) => {
        const patches = (prevState as any)[targetedPatchesKey] as Git.ConvenientPatch[];
        const selectedPatches = new Set((prevState as any)[targetedSelectedPatchesKey] as Set<Git.ConvenientPatch>);

        function addOrDelete(patch: Git.ConvenientPatch) {
          if (selectedPatches.has(patch)) {
            selectedPatches.delete(patch);
          } else {
            selectedPatches.add(patch);
          }
        }

        function addRange(start: number, end: number) {
          if (start > end) {
            [start, end] = [end, start];
          }
          patches.slice(start, end + 1).forEach((patch) => selectedPatches.add(patch));
        }

        function deleteRange(start: number, end: number) {
          if (start > end) {
            [start, end] = [end, start];
          }
          patches.slice(start, end + 1).forEach((patch) => selectedPatches.delete(patch));
        }

        function generateNewState(targetedSelectedPatches: Set<Git.ConvenientPatch>) {
          const state = {};
          state[targetedSelectedPatchesKey] = targetedSelectedPatches;
          state[otherSelectedPatchesKey] = new Set<Git.ConvenientPatch>();
          return state as IndexViewerState;
        }

        const iPatch = patches.indexOf(patch);
        if (selectedPatches.size > 0 && ctrlKey) {
          addOrDelete(patch);
          this.iAnchorPatch = iPatch;
          this.iShiftPatch = null;
          this.props.onPatchSelect(null, PatchType.Committed);
          return generateNewState(selectedPatches);
        } else if (selectedPatches.size > 0 && shiftKey) {
          if (this.iShiftPatch !== null) {
            deleteRange(this.iAnchorPatch, this.iShiftPatch);
          }
          addRange(this.iAnchorPatch, iPatch);
          this.iShiftPatch = iPatch;
          this.props.onPatchSelect(null, PatchType.Committed);
          return generateNewState(selectedPatches);
        } else {
          this.iSelectedPatch = iPatch; 
          this.iAnchorPatch = this.iSelectedPatch;
          this.iShiftPatch = null;
          this.props.onPatchSelect(patch, type);
          return generateNewState(new Set([patch]));
        }
      });
    }
  }

  handlePatchesStage() {
    if (this.props.selectedPatch || this.state.selectedUnstagedPatches.size === 0) {
      this.props.repo.stageAll(this.state.unstagedPatches)
    } else if (this.state.selectedUnstagedPatches.size > 0) {
      this.props.repo.stageAll([...this.state.selectedUnstagedPatches])
    }
    this.setState({
      selectedUnstagedPatches: new Set()
    });
  }

  handlePatchesUnstage() {
    if (this.props.selectedPatch || this.state.selectedStagedPatches.size === 0) {
      this.props.repo.unstageAll(this.state.stagedPatches)
    } else if (this.state.selectedStagedPatches.size > 0) {
      this.props.repo.unstageAll([...this.state.selectedStagedPatches])
    }
    this.setState({
      selectedStagedPatches: new Set()
    });
  }

  handleAmendChange(event: React.ChangeEvent<HTMLInputElement>) {
    const newState = {
      amend: event.target.checked
    } as IndexViewerState
    if (newState.amend && !this.state.summary) {
      newState.summary = this.props.repo.headCommit.summary();
    }
    this.setState(newState);
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
      if (this.state.amend) {
        await this.props.repo.amend(this.state.summary);
      } else {
        await this.props.repo.commit(this.state.summary);
      }
      this.setState({
        amend: false,
        summary: ''
      });
    }
  }

  formatButtonString(prefix: string, patches: Set<Git.ConvenientPatch>) {
    if (this.props.selectedPatch || patches.size === 0) {
      return `${prefix} all changes`
    } else if (patches.size === 1) {
      return `${prefix} 1 file`
    } else {
      return `${prefix} ${patches.size} files`
    }
  }

  render() {
    const repo = this.props.repo;
    return (
      <div className='commit-viewer' ref={this.div}>
        <h2>Index</h2>
        <div className='section-header'>
          <p>Unstaged files ({this.state.unstagedPatches.length})</p>
          <button className='green-button'
            disabled={this.state.unstagedPatches.length === 0}
            onClick={this.handlePatchesStage}>
            {this.formatButtonString('Stage', this.state.selectedUnstagedPatches)}
          </button>
        </div>
        <PatchList repo={this.props.repo}
          patches={this.state.unstagedPatches}
          type={PatchType.Unstaged}
          selectedPatch={this.props.selectedPatch}
          selectedPatches={this.state.selectedUnstagedPatches}
          onPatchSelect={this.handleUnstagedPatchSelect} />
        <div className='section-header'>
          <p>Staged files ({this.state.stagedPatches.length})</p>
          <button className='red-button'
            disabled={this.state.stagedPatches.length === 0}
            onClick={this.handlePatchesUnstage}>
            {this.formatButtonString('Unstage', this.state.selectedStagedPatches)}
           </button>
        </div >
        <PatchList repo={this.props.repo}
          patches={this.state.stagedPatches}
          type={PatchType.Staged}
          selectedPatch={this.props.selectedPatch}
          selectedPatches={this.state.selectedStagedPatches}
          onPatchSelect={this.handleStagedPatchSelect} />
        <div className='section-header'>
          <p>Commit message</p>
          <div className='amend-container'>
            <input type='checkbox' id='amend' name='amend' checked={this.state.amend} onChange={this.handleAmendChange} />
            <label htmlFor='amend'>Amend</label> 
          </div>
        </div>
        <input placeholder={'Summary'} 
          value={this.state.summary} 
          onChange={this.handleSummaryChange} />
        <button className='green-button'
          onClick={this.commit} 
          disabled={this.state.summary.length === 0}>
          {this.state.amend ? 'Amend' : 'Commit'}
        </button>
      </div>
    );
  }
}