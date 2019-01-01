import * as React from 'react';
import * as Git from 'nodegit';

export interface PatchItemProps { 
  patch: Git.ConvenientPatch;
  onPatchSelect: (patch: Git.ConvenientPatch) => void;
}

function getPatchIcon(patch: Git.ConvenientPatch) {
  if (patch.isAdded()) {
    return 'a';
  } else if (patch.isDeleted()) {
    return 'd';
  } else if (patch.isModified()) {
    return 'm';
  } else if (patch.isRenamed()) {
    return 'r';
  } else {
    return 'u';
  }
}

export class PatchItem extends React.PureComponent<PatchItemProps, {}> {
  constructor(props: PatchItemProps) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e: React.MouseEvent<HTMLLIElement>) {
    this.props.onPatchSelect(this.props.patch);
  }

  render() {
    const path = this.props.patch.newFile().path();
    return <li onClick={this.handleClick}>{getPatchIcon(this.props.patch)} {path}</li>;
  }
}