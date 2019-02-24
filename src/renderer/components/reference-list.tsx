import * as React from 'react';
import * as Git from 'nodegit';
import { ReferenceItem } from './reference-item';
import { InputDialogHandler } from './input-dialog';
import { RepoState } from '../helpers/repo-state';

export interface ReferenceListProps { 
  repo: RepoState;
  head: string | null;
  names: string[];
  commits: Git.Commit[];
  onOpenInputDialog: InputDialogHandler;
  onClick: (commit: Git.Commit) => void;
}

export class ReferenceList extends React.PureComponent<ReferenceListProps, {}> {
  render() {
    const referenceItems = this.props.names.sort().map((name, i) => (
      <ReferenceItem repo={this.props.repo}
        name={name} 
        selected={this.props.head === name}
        onOpenInputDialog={this.props.onOpenInputDialog}
        onClick={() => this.props.onClick(this.props.commits[i])} 
        key={name} />
    ));
    return (
      <ul>
        {referenceItems}
      </ul>
    );
  }
}