import * as React from 'react';
import * as Git from 'nodegit';
import { RepoState } from "../helpers/repo-state";
import { createReferenceContextMenu } from '../helpers/reference-context-menu';
import { InputDialogHandler } from './input-dialog';

export class ReferenceBadgeProps {
  reference: Git.Reference;
  color: string;
  selected: boolean;
  repo: RepoState;
  onOpenInputDialog: InputDialogHandler;
}

export class ReferenceBadge extends React.PureComponent<ReferenceBadgeProps, {}> {
  constructor(props: ReferenceBadgeProps) {
    super(props);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
  }

  handleContextMenu(event: React.MouseEvent<HTMLSpanElement>) {
    event.preventDefault();
    event.stopPropagation();
    const menu = createReferenceContextMenu(this.props.repo, this.props.reference, this.props.selected, this.props.onOpenInputDialog);
    menu.popup({});
  }

  handleDoubleClick() {
    this.props.repo.checkoutReference(this.props.reference)
  }

  render() {
    const style = {};
    style['--branch-color'] = this.props.color; 
    const classNames = ['reference'];
    if (this.props.selected) {
      classNames.push('selected');
    }
    return (
      <span className={classNames.join(' ')} style={style} 
        onContextMenu={this.handleContextMenu} 
        onDoubleClick={this.handleDoubleClick}>
        {this.props.reference.shorthand()}
      </span>
    );
  }
}