import * as React from 'react';
import * as Git from 'nodegit';
import { CommitItem } from './commit-item';
import { GraphCanvas } from './graph-canvas';
import { RepoState } from "../repo-state";

export interface GraphViewerProps { 
  repo: RepoState;
  selectedCommit: Git.Commit | null;
  onCommitSelect: (commit: Git.Commit) => void;
}

export class GraphViewer extends React.PureComponent<GraphViewerProps, {}> {
  render() {
    const items = this.props.repo.commits.map((commit: Git.Commit) => (
      <CommitItem 
        repo={this.props.repo} 
        commit={commit} 
        selected={this.props.selectedCommit === commit} 
        onCommitSelect={this.props.onCommitSelect} 
        key={commit.sha()} />
    ));

    return (
      <div className='graph-viewer'>
        <div className='commit-graph'>
          <GraphCanvas repo={this.props.repo} />
          <div className='commit-list'>
            <ul>{items}</ul>
          </div>
        </div>
      </div>
    );
  }
}