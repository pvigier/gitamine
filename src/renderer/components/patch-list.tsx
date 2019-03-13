import * as React from 'react';
import * as Git from 'nodegit';
import { PatchItem } from './patch-item';
import { RepoWrapper, PatchType } from '../helpers/repo-wrapper';

// Util

function generatePatchKey(patch: Git.ConvenientPatch) {
  return `${patch.status()}${patch.oldFile().path()}${patch.newFile().path()}`;
}

function addOrDelete(selectedPatches: Set<Git.ConvenientPatch>, patch: Git.ConvenientPatch) {
  if (selectedPatches.has(patch)) {
    selectedPatches.delete(patch);
  } else {
    selectedPatches.add(patch);
  }
}

function addRange(patches: Git.ConvenientPatch[], selectedPatches: Set<Git.ConvenientPatch>, start: number, end: number) {
  if (start > end) {
    [start, end] = [end, start];
  }
  patches.slice(start, end + 1).forEach((patch) => selectedPatches.add(patch));
}

function deleteRange(patches: Git.ConvenientPatch[], selectedPatches: Set<Git.ConvenientPatch>, start: number, end: number) {
  if (start > end) {
    [start, end] = [end, start];
  }
  patches.slice(start, end + 1).forEach((patch) => selectedPatches.delete(patch));
}

// Patch list

export interface PatchListProps { 
  repo?: RepoWrapper
  patches: Git.ConvenientPatch[];
  type: PatchType;
  selectedPatch: Git.ConvenientPatch | null;
  selectedPatches?: Set<Git.ConvenientPatch>;
  onPatchSelect: (patch: Git.ConvenientPatch) => void;
  onSelectedPatchesChange?: (selectedPatches: Set<Git.ConvenientPatch>) => void;
}

export class PatchList extends React.PureComponent<PatchListProps, {}> {
  iPatch: number;
  iAnchor: number;
  iShift: number | null;

  constructor(props: PatchListProps) {
    super(props);
    this.iShift = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handlePatchSelect = this.handlePatchSelect.bind(this);
  }

  handlePatchSelect(patch: Git.ConvenientPatch, ctrlKey: boolean, shiftKey: boolean) {
    this.iPatch = this.props.patches.indexOf(patch);
    if (this.props.selectedPatches && this.props.selectedPatches.size > 0 && ctrlKey) {
      const selectedPatches = new Set(this.props.selectedPatches);
      addOrDelete(selectedPatches, patch);
      this.iAnchor = this.iPatch;
      this.iShift = null;
      this.props.onSelectedPatchesChange!(selectedPatches);
    } else if (this.props.selectedPatches && this.props.selectedPatches.size > 0 && shiftKey) {
      const selectedPatches = new Set(this.props.selectedPatches);
      if (this.iShift !== null) {
        deleteRange(this.props.patches, selectedPatches, this.iAnchor, this.iShift);
      }
      addRange(this.props.patches, selectedPatches, this.iAnchor, this.iPatch);
      this.iShift = this.iPatch;
      this.props.onSelectedPatchesChange!(selectedPatches);
    } else {
      this.iAnchor = this.iPatch;
      this.iShift = null;
      this.props.onPatchSelect(patch);
    }
  }

  handleKeyDown(event: React.KeyboardEvent<HTMLUListElement>) {
    if (this.props.selectedPatch || (this.props.selectedPatches !== undefined && this.props.selectedPatches.size > 0)) {
      if (event.keyCode === 38 && this.iPatch > 0) {
        this.handlePatchSelect(this.props.patches[this.iPatch - 1], event.ctrlKey, event.shiftKey)
      } else if (event.keyCode === 40 && this.iAnchor < this.props.patches.length - 1) {
        this.handlePatchSelect(this.props.patches[this.iPatch + 1], event.ctrlKey, event.shiftKey)
      }
    }
  }

  render() {
    // Patch items
    const patchItems = this.props.patches.map((patch) => {
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