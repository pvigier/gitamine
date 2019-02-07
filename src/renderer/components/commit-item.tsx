import { remote, clipboard, BrowserWindow } from 'electron';
import * as React from 'react';
import * as Git from 'nodegit';
import { ReferenceBadge } from './reference-badge';
import { RepoState } from "../helpers/repo-state";

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
        click: () => this.openCreateBranchWindow()
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
    ]
    const menu = remote.Menu.buildFromTemplate(template);
    event.preventDefault();
    menu.popup({});
  }

  openCreateBranchWindow() {
    let window: BrowserWindow | null = new remote.BrowserWindow({
      show: false,
      width: 400,
      height: 320,
      parent: remote.getCurrentWindow(),
      modal: true
    });

    window.loadURL(`file://${__dirname}/../../../assets/html/create-branch.html`);

    window.once('ready-to-show', () => {
      window!.show();
      window!.webContents.send('create-branch-data', this.props.commit.sha());
    });
    window.on('close', () => { 
      window = null
    });
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