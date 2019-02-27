import * as React from 'react';
import * as Git from 'nodegit';
import { ReferenceItem } from './reference-item';
import { InputDialogHandler } from './input-dialog';
import { RepoState } from '../helpers/repo-state';

export interface ReferenceListProps { 
  repo: RepoState;
  head: string | null;
  references: Git.Reference[];
  onOpenInputDialog: InputDialogHandler;
  onClick: (commit: Git.Commit) => void;
}

export class ReferenceList extends React.PureComponent<ReferenceListProps, {}> {
  render() {
    const referenceItems = this.props.references
      .sort((lhs, rhs) => lhs.name() <= rhs.name() ? -1 : 1)
      .map((reference) => {
        const name = reference.name();
        return <ReferenceItem repo={this.props.repo}
          reference={reference} 
          selected={this.props.head === reference.name()}
          onOpenInputDialog={this.props.onOpenInputDialog}
          onClick={() => this.props.onClick(this.props.repo.getReferenceCommit(name, reference))} 
          key={name} />;
      });
    return (
      <ul>
        {referenceItems}
      </ul>
    );
  }
}