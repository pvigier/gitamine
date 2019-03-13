import * as React from 'react';
import * as Git from 'nodegit';
import { RepoWrapper, removeReferencePrefix } from '../helpers/repo-wrapper';

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

  handleFetchButtonClick() {
    this.props.repo.fetchAll();
  }

  handlePullButtonClick() {
    if (this.props.repo.head) {
      this.props.repo.pull(removeReferencePrefix(this.props.repo.head));
    }
  }

  handlePushButtonClick() {
    this.props.repo.push();
  }

  handleBranchButtonClick() {
    // Replace sha by commit
    if (this.props.selectedCommit === null && this.props.repo.headCommit) {
      this.props.onCreateBranch(this.props.repo.headCommit);
    } else if (this.props.selectedCommit) {
      this.props.onCreateBranch(this.props.selectedCommit);
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
          <button onClick={this.handlePullButtonClick}>Pull</button>
          <button onClick={this.handlePushButtonClick}>Push</button>
          <button onClick={this.handleBranchButtonClick}>Branch</button>
          <button onClick={this.handleStashButtonClick}>Stash</button>
          <button onClick={this.handlePopButtonClick}>Pop</button>
        </div>
        <button onClick={this.props.onRepoClose}>Close</button>
      </div>
    );
  }
}