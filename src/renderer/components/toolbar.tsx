import * as React from 'react';
import { RepoState } from "../helpers/repo-state";

export class ToolbarProps {
  repo: RepoState;
}

export class Toolbar extends React.PureComponent<ToolbarProps, {}> {
  constructor(props: ToolbarProps) {
    super(props);
    this.handleFetchButtonClick = this.handleFetchButtonClick.bind(this);
    this.handlePushButtonClick = this.handlePushButtonClick.bind(this);
  }

  handleFetchButtonClick() {
    this.props.repo.fetchAll();
  }

  handlePushButtonClick() {
    this.props.repo.push();
  }

  render() {
    return (
      <div className='repo-toolbar'>
        <h1>{this.props.repo.name}</h1>
        <div className='toolbar-buttons'>
          <button onClick={this.handleFetchButtonClick}>Fetch</button>
          <button onClick={this.handlePushButtonClick}>Push</button>
          <button>Branch</button>
          <button>Stash</button>
          <button>Pop</button>
        </div>
      </div>
    );
  }
}