import { remote, clipboard } from 'electron';
import * as React from 'react';
import * as Git from 'nodegit';
import { ReferenceBadge } from './reference-badge';
import { RepoState } from "../repo-state";

export interface CommitItemProps { 
  repo: RepoState;
  references: string[];
  commit: Git.Commit;
  selected: boolean;
  color: string;
  onCommitSelect: (commit: Git.Commit) => void;
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
    const template = [
      {
        label: 'Create branch here',
        click: () => console.log('branch')
      },
      {
        label: 'Reset to this commit',
        click: () => console.log('reset')
      },
      {
        type: 'separator'
      },
      {
        label: 'Copy commit sha to clipboard',
        click: () => clipboard.writeText(this.props.commit.sha())
      },
    ]
    const menu = remote.Menu.buildFromTemplate(template);
    event.preventDefault();
    menu.popup({});
  }

  render() {
    const badges = this.props.references.map((name) => (
      <ReferenceBadge name={name} 
        color={this.props.color} 
        selected={name === this.props.repo.head} 
        repo={this.props.repo}
        key={name} />
    ));
    return (
      <li className={this.props.selected ? 'selected-commit' : ''} 
        onClick={this.handleClick}
        onContextMenu={this.handleContextMenu}>
        {badges}{this.props.commit.message()}
      </li>
    );
  }
}