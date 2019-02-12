import * as React from 'react';
import * as Git from 'nodegit';
import { PatchItem } from './patch-item';
import { RepoState, PatchType } from '../helpers/repo-state';

function generatePatchKey(patch: Git.ConvenientPatch) {
  return `${patch.status()}${patch.oldFile().path()}${patch.newFile().path()}`;
}

export interface PatchListProps { 
  repo?: RepoState
  patches: Git.ConvenientPatch[];
  type: PatchType;
  selectedPatch: Git.ConvenientPatch | null;
  selectedPatches?: Set<Git.ConvenientPatch>;
  onPatchSelect: (patch: Git.ConvenientPatch, ctrlKey: boolean, shiftKey: boolean) => void;
}

export class PatchList extends React.PureComponent<PatchListProps, {}> {
  iAnchor: number;

  constructor(props: PatchListProps) {
    super(props);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handlePatchSelect = this.handlePatchSelect.bind(this);
  }

  handlePatchSelect(patch: Git.ConvenientPatch, ctrlKey: boolean, shiftKey: boolean) {
    this.iAnchor = this.props.patches.indexOf(patch);
    this.props.onPatchSelect(patch, ctrlKey, shiftKey);
  }

  handleKeyDown(event: React.KeyboardEvent<HTMLUListElement>) {
    if (this.props.selectedPatch || (this.props.selectedPatches !== undefined && this.props.selectedPatches.size > 0)) {
      if (event.keyCode === 38 && this.iAnchor > 0) {
        --this.iAnchor;
        this.props.onPatchSelect(this.props.patches[this.iAnchor], event.ctrlKey, event.shiftKey)
      } else if (event.keyCode === 40 && this.iAnchor < this.props.patches.length - 1) {
        ++this.iAnchor;
        this.props.onPatchSelect(this.props.patches[this.iAnchor], event.ctrlKey, event.shiftKey)
      }
    }
  }

  render() {
    // Patch items
    const patchItems = this.props.patches.map((patch, i) => {
      const selected = patch === this.props.selectedPatch || (this.props.selectedPatches !== undefined && this.props.selectedPatches.has(patch));
      return <PatchItem repo={this.props.repo}
        patch={patch} 
        type={this.props.type}
        selected={selected} 
        onPatchSelect={this.handlePatchSelect} 
        key={generatePatchKey(patch)} />;
    });

    return (
      <ul className='patch-list' tabIndex={1} onKeyDown={this.handleKeyDown}>
        {patchItems}
      </ul>
    );
  }
}