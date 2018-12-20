import * as React from 'react';
import * as Git from 'nodegit';

export interface PatchItemProps { 
  patch: Git.ConvenientPatch;
  onPatchSelect: (patch: Git.ConvenientPatch) => void;
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
    return <li onClick={this.handleClick}>{path}</li>;
  }
}