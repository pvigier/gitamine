import * as React from 'react';
import * as Git from 'nodegit';
import { StashItem } from './stash-item';
import { RepoWrapper, Stash } from '../helpers/repo-wrapper';

export interface StashListProps { 
  repo: RepoWrapper;
  stashes: Stash[];
  onClick: (commit: Git.Commit) => void;
}

export interface StashListState {
  hide: boolean;
}

export class StashList extends React.PureComponent<StashListProps, StashListState> {
  constructor(props: StashListProps) {
    super(props);
    this.state = {
      hide: false
    }
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.setState((prevState) => ({
      hide: !prevState.hide
    }));
  }

  render() {
    const stashItems = this.props.stashes.sort((a, b) => b.index - a.index).map((stash) => (
      <StashItem repo={this.props.repo}
        name={stash.commit.summary()} 
        index={stash.index}
        onClick={() => this.props.onClick(stash.commit)} 
        key={stash.commit.sha()} />
    ));
    return (
      <>
        <h3 onClick={this.handleClick}>
          Stashes
          <span>{this.state.hide ? '+' : '\u2212'}</span>
        </h3>
        <ul className={this.state.hide ? 'hidden' : ''}>
          {stashItems}
        </ul>
      </>
    );
  }
}