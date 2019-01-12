import * as React from 'react';
import * as Git from 'nodegit';
import { PatchItem } from './patch-item';

export interface PatchListProps { 
  patches: Git.ConvenientPatch[];
  selectedPatch: Git.ConvenientPatch | null;
  onPatchSelect: (patch: Git.ConvenientPatch) => void;
}

export interface PatchListState {
}

export class PatchList extends React.PureComponent<PatchListProps, PatchListState> {
  constructor(props: PatchListProps) {
    super(props);
    this.state = {
    }
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
      return <PatchItem patch={patch} 
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