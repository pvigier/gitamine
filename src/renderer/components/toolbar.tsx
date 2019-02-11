import * as React from 'react';
import * as Git from 'nodegit';
import { RepoState } from '../helpers/repo-state';
import { openCreateBranchWindow } from '../helpers/open-create-branch-window';

export class ToolbarProps {
  repo: RepoState;
  selectedCommit: Git.Commit | null;
}

export class Toolbar extends React.PureComponent<ToolbarProps, {}> {
  constructor(props: ToolbarProps) {
    super(props);
    this.handleFetchButtonClick = this.handleFetchButtonClick.bind(this);
    this.handlePushButtonClick = this.handlePushButtonClick.bind(this);
    this.handleBranchButtonClick = this.handleBranchButtonClick.bind(this);
    this.handleStashButtonClick = this.handleStashButtonClick.bind(this);
    this.handlePopButtonClick = this.handlePopButtonClick.bind(this);
  }

  handleFetchButtonClick() {
    this.props.repo.fetchAll();
  }

  handlePushButtonClick() {
    this.props.repo.push();
  }

  handleBranchButtonClick() {
    if (this.props.selectedCommit === null) {
      openCreateBranchWindow(this.props.repo.headCommit.sha());
    } else {
      openCreateBranchWindow(this.props.selectedCommit.sha());
    }
  }

  handleStashButtonClick() {
    this.props.repo.stash();
  }

  handlePopButtonClick() {
    this.props.repo.popStash();
  }

  render() {
    return (
      <div className='repo-toolbar'>
        <div className='repo-title'>
          <h1>{this.props.repo.name}</h1>
        </div>
        <div className='separator' />
        <div className='toolbar-buttons'>
          <button onClick={this.handleFetchButtonClick}>Fetch</button>
          <button onClick={this.handlePushButtonClick}>Push</button>
          <button onClick={this.handleBranchButtonClick}>Branch</button>
          <button onClick={this.handleStashButtonClick}>Stash</button>
          <button onClick={this.handlePopButtonClick}>Pop</button>
        </div>
      </div>
    );
  }
}