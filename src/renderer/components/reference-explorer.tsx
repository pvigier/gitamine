import * as React from 'react';
import * as Git from 'nodegit';
import { RepoState } from '../helpers/repo-state';

export interface ReferenceExplorerProps { 
  repo: RepoState;
}

export interface ReferenceExplorerState { 
}

export class ReferenceExplorer extends React.PureComponent<ReferenceExplorerProps, ReferenceExplorerState> {
  div: React.RefObject<HTMLDivElement>;

  constructor(props: ReferenceExplorerProps) {
    super(props);
    this.div = React.createRef();
  }

  resize(offset: number) {
    if (this.div.current) {
      this.div.current.style.width = `${this.div.current.clientWidth + offset}px`;
    }
  }

  render() {
    return (
      <div className='reference-explorer' ref={this.div}>

      </div>
    );
  }
}