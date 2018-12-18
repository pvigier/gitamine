import * as React from 'react';
import * as Git from 'nodegit';

export interface CommitItemProps { 
  commit: Git.Commit;
  onCommitSelect: (commit: Git.Commit) => void;
}

export class CommitItem extends React.Component<CommitItemProps, {}> {
  constructor(props: CommitItemProps) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e: React.MouseEvent<HTMLLIElement>) {
    this.props.onCommitSelect(this.props.commit);
  }

  render() {
    return <li onClick={this.handleClick}>{this.props.commit.message()}</li>;
  }
}