import * as React from 'react';
import * as Git from 'nodegit';
import { CommitItem } from './commit-item';
import { GraphCanvas } from './graph-canvas';
import { Repository } from '../repository';

export interface GraphViewerProps { 
  repo: Repository;
  onCommitSelect: (commit: Git.Commit) => void;
}

export class GraphViewer extends React.Component<GraphViewerProps, {}> {
  render() {
    const items = this.props.repo.commits.map((commit: Git.Commit) => (
      <CommitItem commit={commit} onCommitSelect={this.props.onCommitSelect} key={commit.sha()} />
    ));
    return (
      <div className='graph-viewer'>
        <div className='commit-graph'>
          <GraphCanvas repo={this.props.repo} />
        </div>
        <div className='commit-list'>
          <ul>{items}</ul>
        </div>
      </div>
    );
  }
}