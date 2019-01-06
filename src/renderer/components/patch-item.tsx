import * as React from 'react';
import * as Git from 'nodegit';

export interface PatchItemProps { 
  patch: Git.ConvenientPatch;
  selected: boolean;
  onPatchSelect: (patch: Git.ConvenientPatch) => void;
}

function getPatchIcon(patch: Git.ConvenientPatch) {
  if (patch.isAdded()) {
    return <span className='patch-add' />;
  } else if (patch.isDeleted()) {
    return <span className='patch-delete' />;
  } else if (patch.isModified()) {
    return <span className='patch-modify' />;
  } else if (patch.isRenamed()) {
    return <span className='patch-rename' />;
  } else {
    return null;
  }
}

export class PatchItem extends React.PureComponent<PatchItemProps, {}> {
  li: HTMLLIElement | null;
  resizeObserver: any;

  constructor(props: PatchItemProps) {
    super(props);
    this.setLiRef = this.setLiRef.bind(this);
    this.updateEllipsis = this.updateEllipsis.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  setLiRef(element: HTMLLIElement) {
    this.li = element;
    if (this.li) {
      this.updateEllipsis();
      this.resizeObserver = new ResizeObserver(this.updateEllipsis).observe(this.li);
    }
  }

  updateEllipsis() {
    if (this.li) {
      if (this.li.offsetWidth < this.li.scrollWidth){
        const path = this.props.patch.newFile().path();
        this.li.setAttribute('data-tail', path.substr(path.lastIndexOf('/')));
      } else {
        this.li.setAttribute('data-tail', '');
      }
    }
  }

  handleClick(event: React.MouseEvent<HTMLLIElement>) {
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