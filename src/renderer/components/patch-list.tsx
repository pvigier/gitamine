import * as React from 'react';
import * as Git from 'nodegit';
import { PatchItem } from './patch-item';
import { RepoState, PatchType } from '../repo-state';

export interface PatchListProps { 
  repo?: RepoState
  patches: Git.ConvenientPatch[];
  type: PatchType;
  selectedPatch: Git.ConvenientPatch | null;
  onPatchSelect: (patch: Git.ConvenientPatch) => void;
}

export class PatchList extends React.PureComponent<PatchListProps, {}> {
  constructor(props: PatchListProps) {
    super(props);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  handleKeyDown(event: React.KeyboardEvent<HTMLUListElement>) {
    if (this.props.selectedPatch) {
      if (event.keyCode === 38) {
        let i = this.props.patches.indexOf(this.props.selectedPatch);
        i = (i - 1 + this.props.patches.length) % this.props.patches.length;
        this.props.onPatchSelect(this.props.patches[i])
      } else if (event.keyCode === 40) {
        let i = this.props.patches.indexOf(this.props.selectedPatch);
        i = (i + 1) % this.props.patches.length;
        this.props.onPatchSelect(this.props.patches[i])
      }
    }
  }

  render() {
    // Patch items
    const patchItems = this.props.patches.map((patch) => {
      const path = patch.newFile().path();
      return <PatchItem repo={this.props.repo}
        patch={patch} 
        type={this.props.type}
        selected={patch === this.props.selectedPatch} 
        onPatchSelect={this.props.onPatchSelect} 
        key={path} />;
    });

    return (
      <ul className='patch-list' tabIndex={1} onKeyDown={this.handleKeyDown}>
        {patchItems}
      </ul>
    );
  }
}