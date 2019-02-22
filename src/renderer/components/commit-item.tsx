import { remote, clipboard } from 'electron';
import * as React from 'react';
import * as Git from 'nodegit';
import { ReferenceBadge } from './reference-badge';
import { RepoState, Stash } from '../helpers/repo-state';

export interface CommitItemProps { 
  repo: RepoState;
  commit: Git.Commit;
  head: string;
  references: string[];
  selected: boolean;
  color: string;
  stash?: Stash;
  onCommitSelect: (commit: Git.Commit) => void;
  onCreateBranch: (commit: Git.Commit) => void;
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
    const template: Electron.MenuItemConstructorOptions[] = [];
    if (!this.props.stash) {
      template.push(
        {
          label: 'Create branch here',
          click: () => this.props.onCreateBranch(this.props.commit)
        },
        {
          label: 'Reset to this commit',
          submenu: [
            {
              label: 'Soft',
              click: () => this.props.repo.reset(this.props.commit, Git.Reset.TYPE.SOFT)
            },
            {
              label: 'Mixed',
              click: () => this.props.repo.reset(this.props.commit, Git.Reset.TYPE.MIXED)
            },
            {
              label: 'Hard',
              click: () => this.props.repo.reset(this.props.commit, Git.Reset.TYPE.HARD)
            }
          ]
        },
        {
          type: 'separator'
        },
        {
          label: 'Copy commit sha to clipboard',
          click: () => clipboard.writeText(this.props.commit.sha())
        },
      );
    } else {
      template.push(
        {
          label: 'Apply stash',
          click: () => this.props.repo.applyStash(this.props.stash!.index)
        },
        {
          label: 'Pop stash',
          click: () => this.props.repo.popStash(this.props.stash!.index)
        },
        {
          label: 'Drop stash',
          click: () => this.props.repo.dropStash(this.props.stash!.index)
        },
      )
    }
    const menu = remote.Menu.buildFromTemplate(template);
    event.preventDefault();
    menu.popup({});
  }

  render() {
    const badges = this.props.references.map((name) => (
      <ReferenceBadge name={name} 
        color={this.props.color} 
        selected={name === this.props.head} 
        repo={this.props.repo}
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