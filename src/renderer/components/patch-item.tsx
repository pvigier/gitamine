import { remote, clipboard } from 'electron';
import * as React from 'react';
import * as Git from 'nodegit';
import { RepoState, PatchType } from '../helpers/repo-state';
import { openInEditor } from '../helpers/open-in-editor';

export interface PatchItemProps { 
  repo?: RepoState;
  patch: Git.ConvenientPatch;
  type: PatchType;
  selected: boolean;
  onPatchSelect: (patch: Git.ConvenientPatch) => void;
}

function getPatchIcon(patch: Git.ConvenientPatch) {
  if (patch.isAdded() || patch.isUntracked()) {
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
    this.handleContextMenu = this.handleContextMenu.bind(this);
  }

  handleClick() {
    this.props.onPatchSelect(this.props.patch);
  }

  handleStageClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    this.props.repo!.stagePatch(this.props.patch);
  }

  handleUnstageClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    this.props.repo!.unstagePatch(this.props.patch);
  }

  handleContextMenu(event: React.MouseEvent<HTMLLIElement>) {
    const path = this.props.patch.newFile().path();
    const template: Electron.MenuItemConstructorOptions[] = [];
    if (this.props.type === PatchType.Unstaged) {
      template.push({
        label: 'Stage',
        click: () => this.props.repo!.stagePatch(this.props.patch)
      });
    }
    if (this.props.type === PatchType.Staged) {
      template.push({
        label: 'Unstage',
        click: () => this.props.repo!.unstagePatch(this.props.patch)
      });
    }
    if (this.props.type === PatchType.Unstaged) {
      template.push(
        {
          label: 'Discard changes',
          click: () => this.props.repo!.discardPatch(this.props.patch)
        },
        {
          type: 'separator'
        },
      );
    }
    template.push(
      {
        label: 'Copy file path to clipboard',
        click: () => clipboard.writeText(path)
      },
      {
        type: 'separator'
      },
      {
        label: 'Open in editor',
        click: () => openInEditor(path)
      }
    );
    const menu = remote.Menu.buildFromTemplate(template);
    event.preventDefault();
    menu.popup({});
  }

  render() {
    // Buttons
    const buttons: JSX.Element[] = [];
    if (this.props.type === PatchType.Unstaged) {
      buttons.push(<button className='green-button' 
        onClick={this.handleStageClick} 
        key='stage'>Stage</button>);
    }
    if (this.props.type === PatchType.Staged) {
      buttons.push(<button className='red-button'
        onClick={this.handleUnstageClick} 
        key='unstage'>Unstage</button>);
    }
    const buttonDiv = buttons.length > 0 ? 
      <div className='buttons'>{buttons}</div> : 
      null;

    const path = this.props.patch.newFile().path();
    const i = Math.max(path.lastIndexOf('/'), 0);
    return (
      <li className={this.props.selected ? 'selected-patch' : ''}  
        onClick={this.handleClick}
        onContextMenu={this.handleContextMenu}>
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