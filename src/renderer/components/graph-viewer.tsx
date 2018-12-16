import * as React from 'react';
import * as Git from 'nodegit';
import { CommitItem } from './commit-item';

export interface GraphViewerProps { repo: Git.Repository; }
export interface GraphViewerState { commits: Git.Commit[]; }

export class GraphViewer extends React.Component<GraphViewerProps, GraphViewerState> {
  constructor(props: GraphViewerProps) {
    super(props);
    this.state = {
      commits: []
    };
    this.getAllCommitsOnMaster();
  }

  getAllCommitsOnMaster(): void {
    this.props.repo.getMasterCommit()
      .then((firstCommitOnMaster: Git.Commit) => {
        let commits = [];
        let history = firstCommitOnMaster.history();

        history.on('commit', (commit: Git.Commit) => {
          commits.push(commit);
        });

        history.on('end', (commits: Git.Commit[]) => {
          this.setState({
            commits: commits
          });
        });

        history.start();
      });
  }

  render() {
    const items = this.state.commits.map((commit: Git.Commit) => (
      <CommitItem commit={commit} key={commit.sha()} />
    ));
    return (
      <div className='graph-viewer'>
        <ul>{items}</ul>
      </div>
    );
  }
}