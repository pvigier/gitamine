import { remote } from 'electron';
import * as React from 'react';
import { RepoState } from "../helpers/repo-state";

function removeReferencePrefix(name: string) {
  return name.substr(name.indexOf('/', name.indexOf('/') + 1) + 1);
}

export class ReferenceBadgeProps {
  name: string;
  color: string;
  selected: boolean;
  repo: RepoState;
}

export class ReferenceBadge extends React.PureComponent<ReferenceBadgeProps, {}> {
  constructor(props: ReferenceBadgeProps) {
    super(props);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
  }

  handleContextMenu(event: React.MouseEvent<HTMLSpanElement>) {
    const template = [];
    if (!this.props.selected) {
      template.push(
        {
          label: `Checkout to ${this.getShortName()}`,
          click: () => this.props.repo.checkoutReference(this.props.name)
        },
        {
          label: `Remove ${this.getShortName()}`,
          click: () => this.props.repo.removeReference(this.props.name)
        }
      );
    }
    const menu = remote.Menu.buildFromTemplate(template);
    event.preventDefault();
    event.stopPropagation();
    menu.popup({});
  }

  handleDoubleClick() {
    this.props.repo.checkoutReference(this.props.name)
  }

  getShortName() {
    return removeReferencePrefix(this.props.name);
  }

  render() {
    const style = {};
    style['--branch-color'] = this.props.color; 
    const classNames = ['reference'];
    if (this.props.selected) {
      classNames.push('selected');
    }
    return (
      <span className={classNames.join(' ')} style={style} onContextMenu={this.handleContextMenu} onDoubleClick={this.handleDoubleClick}>
        {this.getShortName()}
      </span>
    );
  }
}