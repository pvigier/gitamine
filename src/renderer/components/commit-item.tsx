import * as React from 'react';
import * as Git from 'nodegit';
import { ReferenceBadge } from './reference-badge';
import { InputDialogHandler } from './input-dialog';
import { RepoState, Stash } from '../helpers/repo-state';
import { createStashContextMenu } from '../helpers/stash-context-menu';
import { createCommitContextMenu } from '../helpers/commit-context-menu';

export interface CommitItemProps { 
  repo: RepoState;
  commit: Git.Commit;
  head: string | null;
  references: string[];
  selected: boolean;
  color: string;
  stash?: Stash;
  onCommitSelect: (commit: Git.Commit) => void;
  onCreateBranch: (commit: Git.Commit) => void;
  onOpenInputDialog: InputDialogHandler;
}

export class CommitItem extends React.PureComponent<CommitItemProps, {}> {
  constructor(props: CommitItemProps) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
  }

  handleClick(event: React.MouseEvent<HTMLLIElement>) {
    this.props.onCommitSelect(this.props.commit);
  }

  handleContextMenu(event: React.MouseEvent<HTMLLIElement>) {
    event.preventDefault();
    let menu: Electron.Menu;
    if (!this.props.stash) {
      menu = createCommitContextMenu(this.props.repo, 
        this.props.commit, 
        this.props.onCreateBranch, 
        this.props.onOpenInputDialog);
    } else {
      menu = createStashContextMenu(this.props.repo, this.props.stash.index);
    }
    menu.popup({});
  }

  render() {
    const badges = this.props.references.map((name) => (
      <ReferenceBadge reference={this.props.repo.references.get(name)!} 
        color={this.props.color} 
        selected={name === this.props.head} 
        repo={this.props.repo}
        onOpenInputDialog={this.props.onOpenInputDialog}
        key={name} />
    ));
    return (
      <li className={this.props.selected ? 'selected-commit' : ''} 
        onClick={this.handleClick}
        onContextMenu={this.handleContextMenu}>
        {badges}{this.props.commit.summary()}
      </li>
    );
  }
}