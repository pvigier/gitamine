import * as React from 'react';
import * as Git from 'nodegit';
import { RepoState } from "../repo-state";

function removeBranchPrefix(name: string) {
  return name.substr(name.indexOf('/', name.indexOf('/') + 1) + 1);
}

export interface CommitItemProps { 
  repo: RepoState;
  references: string[];
  commit: Git.Commit;
  selected: boolean;
  color: string;
  onCommitSelect: (commit: Git.Commit) => void;
}

export class CommitItem extends React.PureComponent<CommitItemProps, {}> {
  constructor(props: CommitItemProps) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event: React.MouseEvent<HTMLLIElement>) {
    this.props.onCommitSelect(this.props.commit);
  }

  render() {
    const spans = this.props.references.map((reference) => {
      const style = {};
      style['--branch-color'] = this.props.color; 
      return (
        <span key={reference} className='reference' style={style}>
          {removeBranchPrefix(reference)}
        </span>
      );
    });
    return (
      <li className={this.props.selected ? 'selected-commit' : ''} onClick={this.handleClick}>
        {spans}{this.props.commit.message()}
      </li>
    );
  }
}