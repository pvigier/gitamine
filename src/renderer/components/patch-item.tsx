import * as React from 'react';
import * as Git from 'nodegit';

export interface PatchItemProps { 
  patch: Git.ConvenientPatch;
  selected: boolean;
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
    this.setLiRef = this.setLiRef.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  setLiRef(element: HTMLLIElement) {
    if (element && element.offsetWidth < element.scrollWidth){
      const path = this.props.patch.newFile().path();
      element.setAttribute('data-tail', path.substr(path.lastIndexOf('/')));
    }
  }

  handleClick(e: React.MouseEvent<HTMLLIElement>) {
    this.props.onPatchSelect(this.props.patch);
  }

  render() {
    const classNames =['ellipsis-middle', this.props.selected ? 'selected-patch' : ''];
    return (
      <li className={classNames.join(' ')} onClick={this.handleClick} ref={this.setLiRef}>
        {getPatchIcon(this.props.patch)} {this.props.patch.newFile().path()}
      </li>
    );
  }
}