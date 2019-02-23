import * as React from 'react';
import * as Git from 'nodegit';
import { ReferenceItem } from './reference-item';

export interface ReferenceListProps { 
  head: string | null;
  names: string[];
  commits: Git.Commit[];
  onReferenceClick: (commit: Git.Commit) => void;
}

export class ReferenceList extends React.PureComponent<ReferenceListProps, {}> {
  render() {
    const referenceItems = this.props.names.map((name, i) => (
      <ReferenceItem name={name} 
        selected={this.props.head === name}
        onClick={() => this.props.onReferenceClick(this.props.commits[i])} 
        key={name} />
    ));
    return (
      <ul>
        {referenceItems}
      </ul>
    );
  }
}