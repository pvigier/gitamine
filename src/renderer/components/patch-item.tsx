import * as React from 'react';
import * as Git from 'nodegit';

export interface PatchItemProps { 
  patch: Git.ConvenientPatch;
  selected: boolean;
  onPatchSelect: (patch: Git.ConvenientPatch) => void;
  onStage?: (patch: Git.ConvenientPatch) => void;
  onUnstage?: (patch: Git.ConvenientPatch) => void;
}

function getPatchIcon(patch: Git.ConvenientPatch) {
  if (patch.isAdded()) {
    return <span className='icon patch-add' />;
  } else if (patch.isDeleted()) {
    return <span className='icon patch-delete' />;
  } else if (patch.isModified()) {
    return <span className='icon patch-modify' />;
  } else if (patch.isRenamed()) {
    return <span className='icon patch-rename' />;
  } else {
    return null;
  }
}

export class PatchItem extends React.PureComponent<PatchItemProps, {}> {
  constructor(props: PatchItemProps) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handleStageClick = this.handleStageClick.bind(this);
    this.handleUnstageClick = this.handleUnstageClick.bind(this);
  }

  handleClick() {
    this.props.onPatchSelect(this.props.patch);
  }

  handleStageClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    this.props.onStage!(this.props.patch);
  }

  handleUnstageClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    this.props.onUnstage!(this.props.patch);
  }

  render() {
    // Buttons
    const buttons: JSX.Element[] = [];
    if (this.props.onStage) {
      buttons.push(<button onClick={this.handleStageClick} key='stage'>Stage</button>);
    }
    if (this.props.onUnstage) {
      buttons.push(<button onClick={this.handleUnstageClick} key='unstage'>Unstage</button>);
    }
    const buttonDiv = buttons.length > 0 ? 
      <div className='buttons'>{buttons}</div> : 
      null;

    const path = this.props.patch.newFile().path();
    const i = Math.max(path.lastIndexOf('/'), 0);
    return (
      <li className={this.props.selected ? 'selected-patch' : ''}  
        onClick={this.handleClick}>
        {getPatchIcon(this.props.patch)}
        <div className='ellipsis-middle'>
          <div className='left'>{path.substr(0, i)}</div>
          <div className='right'>{path.substr(i)}</div>
        </div>
        {buttonDiv}
      </li>
    );
  }
}