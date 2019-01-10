import * as React from 'react';
import * as Git from 'nodegit';
import { CommitItem } from './commit-item';
import { IndexItem } from './index-item';
import { RepoState } from "../repo-state";

const ITEM_HEIGHT = 28;

export interface CommitListProps { 
  repo: RepoState;
  selectedCommit: Git.Commit | null;
  onCommitSelect: (commit: Git.Commit) => void;
  onIndexSelect: () => void;
  onScroll: (height: number, start: number, end: number) => void;
  onResize: (offset: number, start: number, end: number) => void;
}

export interface CommitListState {
  start: number;
  end: number;
}

export class CommitList extends React.PureComponent<CommitListProps, CommitListState> {
  div: React.RefObject<HTMLDivElement>;
  resizeObserver: any;

  constructor(props: CommitListProps) {
    super(props);
    this.div = React.createRef();
    this.state = {
      start: 0,
      end: 0
    }
    this.handleScroll = this.handleScroll.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
    if (this.div.current) {
      this.resizeObserver = new ResizeObserver(this.handleResize).observe(this.div.current);
    }
  }

  handleScroll() {
    if (this.div.current) {
      const newState = this.computeState()!;
      this.props.onScroll(this.div.current.scrollTop, newState.start, newState.end);
      this.setState(newState);
    }
  }

  handleResize() {
    if (this.div.current) {
      const newState = this.computeState()!;
      this.props.onResize(this.div.current.clientHeight, newState.start, newState.end);
      this.setState(newState);
    }
  }

  computeState() {
    const div = this.div.current!;
    const start = Math.floor(div.scrollTop / ITEM_HEIGHT);
    const end = Math.ceil((div.scrollTop + div.clientHeight) / ITEM_HEIGHT);
    return {
      start: start,
      end: end
    };
  }

  render() {
    const commits = this.props.repo.commits.slice(this.state.start, this.state.end);
    const items = [
      <IndexItem selected={this.props.selectedCommit === null}
        onIndexSelect={this.props.onIndexSelect} 
        key='index' />,
      ...commits.map((commit: Git.Commit) => (
        <CommitItem 
          repo={this.props.repo} 
          commit={commit} 
          selected={this.props.selectedCommit === commit} 
          onCommitSelect={this.props.onCommitSelect} 
          key={commit.sha()} />
      ))];

    // Compute height of the divs
    const paddingTop = this.state.start * ITEM_HEIGHT;
    const paddingBottom = (this.props.repo.commits.length - this.state.end) * ITEM_HEIGHT;
    const style = {
      paddingTop: paddingTop,
      paddingBottom: paddingBottom
    };
    return (
      <div className='commit-list' onScroll={this.handleScroll} ref={this.div}>
        <ul style={style}>{items}</ul>
      </div>
    );
  }
}

