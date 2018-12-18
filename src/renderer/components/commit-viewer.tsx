import * as React from 'react';
import * as Git from 'nodegit';

export interface CommitViewerProps { commit: Git.Commit | null; }

export class CommitViewer extends React.Component<CommitViewerProps, {}> {
  render() {
    const commit = this.props.commit;
    if (commit) {
      const authoredDate = new Date(commit.author().when().time() * 1000);
      return (
        <div className='commit-viewer'>
          <h2>{commit.message()}</h2>
          <p>{commit.sha()}</p>
          <p>Authored {authoredDate.toString()} by {commit.author().name()}</p>
          <p>Last modified {commit.date().toString()}</p>
          <p>Parents: {commit.parents().toString()}</p>
        </div>
      );
    } else {
      return <div className='commit-viewer'><p>Commit</p></div>;
    }
  }
}