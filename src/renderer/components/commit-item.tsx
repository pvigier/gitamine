import * as React from 'react';
import * as Git from 'nodegit';
import { RepoState } from "../repo-state";

function removeBranchPrefix(name: string) {
  return name.substr(name.indexOf('/', name.indexOf('/') + 1) + 1);
}

export interface CommitItemProps { 
  repo: RepoState;
  commit: Git.Commit;
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
    let references = this.props.repo.shaToReferences.get(this.props.commit.sha()) || [];
    references = references.map((reference) => `[${removeBranchPrefix(reference)}]`);
    return <li onClick={this.handleClick}>{references.join(' ')} {this.props.commit.message()}</li>;
  }
}