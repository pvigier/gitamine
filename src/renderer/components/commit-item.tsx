import * as React from 'react';
import * as Git from 'nodegit';
import { RepoState } from "../repo-state";

function removeBranchPrefix(name: string) {
  return name.substr(name.indexOf('/', name.indexOf('/') + 1) + 1);
}

export interface CommitItemProps { 
  repo: RepoState;
  commit: Git.Commit;
  selected: boolean;
  onCommitSelect: (commit: Git.Commit) => void;
}

export class CommitItem extends React.PureComponent<CommitItemProps, {}> {
  constructor(props: CommitItemProps) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e: React.MouseEvent<HTMLLIElement>) {
    this.props.onCommitSelect(this.props.commit);
  }

  render() {
    const references = this.props.repo.shaToReferences.get(this.props.commit.sha()) || [];
    const spans = references.map((reference) => 
      <span key={reference} className='reference'>{removeBranchPrefix(reference)}</span>);
    return (
      <li className={this.props.selected ? 'selected-commit' : ''} onClick={this.handleClick}>
        {spans}{this.props.commit.message()}
      </li>
    );
  }
}