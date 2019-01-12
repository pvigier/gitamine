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
      <ul className='patch-list'>
        {patchItems}
      </ul>
    );
  }
}