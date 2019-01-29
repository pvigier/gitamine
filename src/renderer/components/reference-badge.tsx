import * as React from 'react';

function removeReferencePrefix(name: string) {
  return name.substr(name.indexOf('/', name.indexOf('/') + 1) + 1);
}

export class ReferenceBadgeProps {
  name: string;
  color: string;
  selected: boolean;
}

export class ReferenceBadge extends React.PureComponent<ReferenceBadgeProps, {}> {
  render() {
    const style = {};
    style['--branch-color'] = this.props.color; 
    const classNames = ['reference'];
    if (this.props.selected) {
      classNames.push('selected');
    }
    return (
      <span className={classNames.join(' ')} style={style}>
        {removeReferencePrefix(this.props.name)}
      </span>
    );
  }
}