import * as React from 'react';
import * as Git from 'nodegit';
import { RepoState } from '../helpers/repo-state';
import { ReferenceItem } from './reference-item';
import { ReferenceList } from './reference-list';
import { StashList } from './stash-list';

export interface ReferenceExplorerProps { 
  repo: RepoState;
  onCommitSelect: (commit: Git.Commit) => void;
  onIndexSelect: () => void;
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
        <ReferenceItem repo={this.props.repo}
          name='Index' 
          selected={false} 
          onClick={this.props.onIndexSelect} />
        <h3>Branches</h3>
        <ReferenceList repo={this.props.repo}
          names={[...this.props.repo.references.keys()]}
          commits={[...this.props.repo.references.values()]} 
          head={this.props.repo.head}
          onClick={this.props.onCommitSelect} />
        <h3>Stashes</h3>
        <StashList repo={this.props.repo}
          stashes={[...this.props.repo.stashes.values()]}
          onClick={this.props.onCommitSelect} />
      </div>
    );
  }
}