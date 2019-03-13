import * as React from 'react';
import * as Git from 'nodegit';
import { RepoWrapper } from '../helpers/repo-wrapper';
import { ReferenceList } from './reference-list';
import { StashList } from './stash-list';
import { InputDialogHandler } from './input-dialog';

export interface ReferenceExplorerProps { 
  repo: RepoWrapper;
  onCommitSelect: (commit: Git.Commit) => void;
  onIndexSelect: () => void;
  onOpenInputDialog: InputDialogHandler;
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
    const references = [...this.props.repo.references.values()];
    return (
      <div className='reference-explorer' ref={this.div}>
        <div>
          <li onClick={this.props.onIndexSelect}>Index</li>
          <ReferenceList title="Local branches"
            repo={this.props.repo}
            references={references.filter((reference) => reference.isBranch())} 
            head={this.props.repo.head}
            onOpenInputDialog={this.props.onOpenInputDialog}
            onClick={this.props.onCommitSelect} />
          <ReferenceList title="Remote branches"
            repo={this.props.repo}
            references={references.filter((reference) => reference.isRemote())} 
            head={this.props.repo.head}
            onOpenInputDialog={this.props.onOpenInputDialog}
            onClick={this.props.onCommitSelect} />
          <ReferenceList title="Tags"
            repo={this.props.repo}
            references={references.filter((reference) => reference.isTag())} 
            head={this.props.repo.head}
            onOpenInputDialog={this.props.onOpenInputDialog}
            onClick={this.props.onCommitSelect} />
          <StashList repo={this.props.repo}
            stashes={[...this.props.repo.stashes.values()]}
            onClick={this.props.onCommitSelect} />
        </div>
      </div>
    );
  }
}