import * as React from 'react';

export interface IndexItemProps { 
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
    return (
      <li className={this.props.selected ? 'selected-commit' : ''} onClick={this.handleClick}>
        Index
      </li>
    );
  }
}