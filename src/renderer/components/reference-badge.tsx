import * as React from 'react';

function removeReferencePrefix(name: string) {
  return name.substr(name.indexOf('/', name.indexOf('/') + 1) + 1);
}

export class ReferenceBadgeProps {
  name: string;
  color: string;
}

export class ReferenceBadge extends React.PureComponent<ReferenceBadgeProps, {}> {
  render() {
    const style = {};
    style['--branch-color'] = this.props.color; 
    return (
      <span className='reference' style={style}>
        {removeReferencePrefix(this.props.name)}
      </span>
    );
  }
}