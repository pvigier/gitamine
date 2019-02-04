import * as React from 'react';
import { RepoState } from "../repo-state";

export class ToolbarProps {
  repo: RepoState;
}

export class Toolbar extends React.PureComponent<ToolbarProps, {}> {
  render() {
    return (
      <div className='repo-toolbar'>
        <h1>{this.props.repo.name}</h1>
      </div>
    );
  }
}