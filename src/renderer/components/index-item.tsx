import * as React from 'react';
import * as Git from 'nodegit';
import { RepoState } from '../helpers/repo-wrapper';

export interface IndexItemProps { 
  repoState: RepoState;
  selected: boolean;
  onIndexSelect: () => void;
}

export class IndexItem extends React.PureComponent<IndexItemProps, {}> {
  constructor(props: IndexItemProps) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.props.onIndexSelect();
  }

  render() {
    //console.log(this.props.state);
    let suffix = ''
    switch (this.props.repoState) {
      case RepoState.Cherrypick:
        suffix = 'cherrypicking'
        break;
      case RepoState.Merge:
        suffix = 'merging';
        break;
      case RepoState.Rebase:
        suffix = 'rebasing';
        break;
      case RepoState.Revert:
        suffix = 'reverting';
        break;
    }
    return (
      <li className={this.props.selected ? 'selected-commit' : ''} onClick={this.handleClick}>
        Index{suffix ? ` (${suffix})` : null}
      </li>
    );
  }
}