import * as React from 'react';
import * as Git from 'nodegit';

export interface CommitItemProps { commit: Git.Commit; }

export class CommitItem extends React.Component<CommitItemProps, {}> {
  render() {
    return <li>{this.props.commit.message()}</li>;
  }
}