import * as React from 'react';
import * as Git from 'nodegit';
import { StashItem } from './stash-item';
import { RepoState, Stash } from '../helpers/repo-state';

export interface StashListProps { 
  repo: RepoState;
  stashes: Stash[];
  onClick: (commit: Git.Commit) => void;
}

export class StashList extends React.PureComponent<StashListProps, {}> {
  render() {
    const referenceItems = this.props.stashes.sort((a, b) => b.index - a.index).map((stash) => (
      <StashItem repo={this.props.repo}
        name={stash.commit.summary()} 
        index={stash.index}
        onClick={() => this.props.onClick(stash.commit)} 
        key={stash.commit.sha()} />
    ));
    return (
      <ul>
        {referenceItems}
      </ul>
    );
  }
}