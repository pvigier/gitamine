import * as React from 'react';
import * as Git from 'nodegit';

export interface IndexItemProps { 
  state: number;
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
    switch (this.props.state) {
      case Git.Repository.STATE.CHERRYPICK:
        suffix = 'cherrypicking'
        break;
      case Git.Repository.STATE.MERGE:
        suffix = 'merging';
        break;
      case Git.Repository.STATE.REBASE:
      case Git.Repository.STATE.REBASE_INTERACTIVE:
      case Git.Repository.STATE.REBASE_MERGE:
        suffix = 'rebasing';
        break;
      case Git.Repository.STATE.REVERT:
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