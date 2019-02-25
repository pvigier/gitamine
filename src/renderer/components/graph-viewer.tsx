import * as React from 'react';
import * as Git from 'nodegit';
import { GraphCanvas } from './graph-canvas';
import { CommitList } from './commit-list';
import { Splitter } from './splitter';
import { ReferenceExplorer } from './reference-explorer'
import { InputDialogHandler } from './input-dialog';
import { RepoState } from "../helpers/repo-state";

export interface GraphViewerProps { 
  repo: RepoState;
  selectedCommit: Git.Commit | null;
  onCommitSelect: (commit: Git.Commit) => void;
  onIndexSelect: () => void;
  onCreateBranch: (commit: Git.Commit) => void;
  onOpenInputDialog: InputDialogHandler;
}

export class GraphViewer extends React.PureComponent<GraphViewerProps, {}> {
  referenceExplorer: React.RefObject<ReferenceExplorer>;
  div: React.RefObject<HTMLDivElement>;
  canvas: React.RefObject<GraphCanvas>;
  commitList: React.RefObject<CommitList>;

  constructor(props: GraphViewerProps) {
    super(props);
    this.referenceExplorer = React.createRef();
    this.div = React.createRef();
    this.canvas = React.createRef();
    this.commitList = React.createRef();
    this.handleListScroll = this.handleListScroll.bind(this);
    this.handleListResize = this.handleListResize.bind(this);
    this.handleListStateUpdate = this.handleListStateUpdate.bind(this);
    this.handleCanvasResize = this.handleCanvasResize.bind(this);
    this.handleLeftPanelResize = this.handleLeftPanelResize.bind(this);
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

  handleCanvasResize(offset: number) {
    if (this.div.current) {
      const parentWidth = this.div.current.parentElement!.clientWidth;
      // 32px is the min width of the graph canvas
      // 100px is the min width of the commit list
      const newWidth = Math.max(32, Math.min(this.div.current.clientWidth + offset, parentWidth - 100));
      this.setCanvasWidth(newWidth);
    }
  }

  handleLeftPanelResize(offset: number) {
    if (this.referenceExplorer.current) {
      this.referenceExplorer.current.resize(offset);
    }
  }

  updateGraph() {
    if (this.commitList.current) {
      this.commitList.current.updateState();
      this.commitList.current.forceUpdate();
    }
    if (this.referenceExplorer.current) {
      this.referenceExplorer.current.forceUpdate();
    }
  }

  shrinkCanvas() {
    if (this.canvas.current) {
      const canvasWidth = this.canvas.current.getWidth();
      // 32px is the min width of the graph canvas
      // 20px is the padding around the canvas
      // 98px is the width to display 4 branches
      this.setCanvasWidth(Math.max(32, Math.min(canvasWidth + 20, 98)));
    }
  }

  setCanvasWidth(width: number) {
    document.body.style.setProperty('--canvas-width', `${width}px`);
  }

  render() {
    return (
      <div className='graph-viewer'>
        <ReferenceExplorer repo={this.props.repo} 
          onCommitSelect={async (commit) => { 
            await this.props.onCommitSelect(commit); 
            if (this.commitList.current) {
              this.commitList.current.centerOnItem(this.props.repo.shaToIndex.get(commit.sha())!);
            }
          }}
          onIndexSelect={async () => { 
            await this.props.onIndexSelect(); 
            if (this.commitList.current) {
              this.commitList.current.centerOnItem(-1);
            }
          }}
          onOpenInputDialog={this.props.onOpenInputDialog}
          ref={this.referenceExplorer} />
        <Splitter onDrag={this.handleLeftPanelResize} />
        <div className='graph-container'>
          <div className='commit-graph' ref={this.div}>
            <GraphCanvas repo={this.props.repo} ref={this.canvas} />
            <Splitter onDrag={this.handleCanvasResize} />
            <CommitList {...this.props} 
              onScroll={this.handleListScroll} 
              onResize={this.handleListResize}
              onStateUpdate={this.handleListStateUpdate}
              ref={this.commitList} />
          </div>
        </div>
      </div>
    );
  }
}