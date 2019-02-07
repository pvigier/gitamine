import * as React from 'react';
import { RepoState } from "../helpers/repo-state";

export class ToolbarProps {
  repo: RepoState;
}

export class Toolbar extends React.PureComponent<ToolbarProps, {}> {
  render() {
    return (
      <div className='repo-toolbar'>
        <h1>{this.props.repo.name}</h1>
        <div className='toolbar-buttons'>
          <button>Fetch</button>
          <button>Push</button>
          <button>Branch</button>
          <button>Stash</button>
          <button>Pop</button>
        </div>
      </div>
    );
  }
}