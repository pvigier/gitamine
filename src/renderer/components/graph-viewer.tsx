import * as React from 'react';
import * as Git from 'nodegit';
import { GraphCanvas } from './graph-canvas';
import { RepoState } from "../helpers/repo-state";
import { CommitList } from './commit-list';

export interface GraphViewerProps { 
  repo: RepoState;
  selectedCommit: Git.Commit | null;
  onCommitSelect: (commit: Git.Commit) => void;
  onIndexSelect: () => void;
  onCreateBranch: (commit: Git.Commit) => void;
}

export class GraphViewer extends React.PureComponent<GraphViewerProps, {}> {
  canvas: React.RefObject<GraphCanvas>;
  commitList: React.RefObject<CommitList>;

  constructor(props: GraphViewerProps) {
    super(props);
    this.canvas = React.createRef();
    this.commitList = React.createRef();
    this.handleListScroll = this.handleListScroll.bind(this);
    this.handleListResize = this.handleListResize.bind(this);
    this.handleListStateUpdate = this.handleListStateUpdate.bind(this);
  }

  handleListScroll(offset: number, start: number, end: number) {
    if (this.canvas.current) {
      this.canvas.current.handleScroll(offset, start, end);
    }
  }

  handleListResize(height: number, start: number, end: number) {
    if (this.canvas.current) {
      this.canvas.current.handleResize(height, start, end);
    }
  }

  handleListStateUpdate(start: number, end: number) {
    if (this.canvas.current) {
      this.canvas.current.handleRangeUpdate(start, end);
    }
  }

  updateGraph() {
    if (this.commitList.current) {
      this.commitList.current.updateState();
      this.commitList.current.forceUpdate();
    }
  }

  render() {
    return (
      <div className='graph-viewer'>
        <div className='commit-graph'>
          <GraphCanvas repo={this.props.repo} ref={this.canvas} />
          <CommitList {...this.props} 
            onScroll={this.handleListScroll} 
            onResize={this.handleListResize}
            onStateUpdate={this.handleListStateUpdate}
            ref={this.commitList} />
        </div>
      </div>
    );
  }
}