import * as React from 'react';
import { removeReferencePrefix } from '../helpers/repo-state';

export interface ReferenceItemProps { 
  name: string;
  selected: boolean;
  onClick: () => void;
}

export class ReferenceItem extends React.PureComponent<ReferenceItemProps, {}> {
  render() {
    return (
      <li className={this.props.selected ? 'selected' : ''} onClick={this.props.onClick}>
        {removeReferencePrefix(this.props.name)}
      </li>
    );
  }
}