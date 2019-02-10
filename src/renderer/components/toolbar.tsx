import * as React from 'react';
import { RepoState } from '../helpers/repo-state';

export class ToolbarProps {
  repo: RepoState;
}

export class Toolbar extends React.PureComponent<ToolbarProps, {}> {
  constructor(props: ToolbarProps) {
    super(props);
    this.handleFetchButtonClick = this.handleFetchButtonClick.bind(this);
    this.handlePushButtonClick = this.handlePushButtonClick.bind(this);
    this.handleStashButtonClick = this.handleStashButtonClick.bind(this);
    this.handlePopButtonClick = this.handlePopButtonClick.bind(this);
  }

  handleFetchButtonClick() {
    this.props.repo.fetchAll();
  }

  handlePushButtonClick() {
    this.props.repo.push();
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
          <button>Branch</button>
          <button onClick={this.handleStashButtonClick}>Stash</button>
          <button onClick={this.handlePopButtonClick}>Pop</button>
        </div>
      </div>
    );
  }
}