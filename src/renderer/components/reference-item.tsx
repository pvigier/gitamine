import * as React from 'react';
import * as Git from 'nodegit';
import { RepoWrapper } from '../helpers/repo-wrapper';
import { createReferenceContextMenu } from '../helpers/reference-context-menu';
import { InputDialogHandler } from './input-dialog';

export interface ReferenceItemProps { 
  repo: RepoWrapper;
  reference: Git.Reference;
  selected: boolean;
  onOpenInputDialog: InputDialogHandler;
  onClick: () => void;
}

export class ReferenceItem extends React.PureComponent<ReferenceItemProps, {}> {
  constructor(props: ReferenceItemProps) {
    super(props);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
  }

  handleContextMenu(event: React.MouseEvent<HTMLSpanElement>) {
    event.preventDefault();
    const menu = createReferenceContextMenu(this.props.repo, this.props.reference, this.props.selected, this.props.onOpenInputDialog);
    menu.popup({});
  }

  handleDoubleClick() {
    this.props.repo.checkoutReference(this.props.reference);
  }

  render() {
    return (
      <li className={this.props.selected ? 'selected' : ''} 
        onClick={this.props.onClick}
        onContextMenu={this.handleContextMenu}
        onDoubleClick={this.handleDoubleClick}>
        {this.props.reference.shorthand()}
      </li>
    );
  }
}