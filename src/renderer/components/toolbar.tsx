import * as React from 'react';
import * as Git from 'nodegit';
import { RepoWrapper, removeReferencePrefix } from '../helpers/repo-wrapper';
import { SpinnerButton } from './spinner-button';

export class ToolbarProps {
  repo: RepoWrapper;
  selectedCommit: Git.Commit | null;
  onRepoClose: () => void;
  onCreateBranch: (commit: Git.Commit) => void;
}

export class Toolbar extends React.PureComponent<ToolbarProps, {}> {
  constructor(props: ToolbarProps) {
    super(props);
    this.handleFetchButtonClick = this.handleFetchButtonClick.bind(this);
    this.handlePullButtonClick = this.handlePullButtonClick.bind(this);
    this.handlePushButtonClick = this.handlePushButtonClick.bind(this);
    this.handleBranchButtonClick = this.handleBranchButtonClick.bind(this);
    this.handleStashButtonClick = this.handleStashButtonClick.bind(this);
    this.handlePopButtonClick = this.handlePopButtonClick.bind(this);
  }

  async handleFetchButtonClick() {
    await this.props.repo.fetchAll();
  }

  async handlePullButtonClick() {
    if (this.props.repo.head) {
      await this.props.repo.pull(removeReferencePrefix(this.props.repo.head.name()));
    }
  }

  async handlePushButtonClick() {
    await this.props.repo.push();
  }

  handleBranchButtonClick() {
    // Replace sha by commit
    if (this.props.selectedCommit === null && this.props.repo.headCommit) {
      this.props.onCreateBranch(this.props.repo.headCommit);
    } else if (this.props.selectedCommit) {
      this.props.onCreateBranch(this.props.selectedCommit);
    }
  }

  async handleStashButtonClick() {
    await this.props.repo.stash();
  }

  async handlePopButtonClick() {
    await this.props.repo.popStash();
  }

  render() {
    return (
      <div className='repo-toolbar'>
        <div className='repo-title'>
          <h1>{this.props.repo.name}</h1>
        </div>
        <div className='separator' />
        <div className='toolbar-buttons'>
          <SpinnerButton value='Fetch' onClick={this.handleFetchButtonClick} />
          <SpinnerButton value='Pull' onClick={this.handlePullButtonClick} />
          <SpinnerButton value='Push' onClick={this.handlePushButtonClick} />
          <button onClick={this.handleBranchButtonClick}>Branch</button>
          <SpinnerButton value='Stash' onClick={this.handleStashButtonClick} />
          <SpinnerButton value='Pop' onClick={this.handlePopButtonClick} />
        </div>
        <button onClick={this.props.onRepoClose}>Close</button>
      </div>
    );
  }
}