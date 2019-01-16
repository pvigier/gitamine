import * as React from 'react';
import * as Git from 'nodegit';
import { GraphCanvas } from './graph-canvas';
import { RepoState } from "../repo-state";
import { CommitList } from './commit-list';

export interface GraphViewerProps { 
  repo: RepoState;
  selectedCommit: Git.Commit | null;
  onCommitSelect: (commit: Git.Commit) => void;
  onIndexSelect: () => void;
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

  updateGraph() {
    if (this.canvas.current) {
      this.canvas.current.drawGraph();
    }
    if (this.commitList.current) {
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
            ref={this.commitList} />
        </div>
      </div>
    );
  }
}