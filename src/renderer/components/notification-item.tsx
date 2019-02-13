import * as React from 'react';

export enum NotificationType {
  Information,
  Error
}

export interface NotificationItemProps { 
  id: number;
  message: string;
  type: NotificationType;
  onRemove: (key: number) => void;
}

export class NotificationItem extends React.PureComponent<NotificationItemProps, {}> {
  li: React.RefObject<HTMLLIElement>;
  hover: boolean;
  shouldDisappear: boolean;

  constructor(props: NotificationItemProps) {
    super(props);
    this.li = React.createRef();
    this.hover = false;
    this.shouldDisappear = false;
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.appear = this.appear.bind(this);
    this.disappear = this.disappear.bind(this);
  }
  
  componentDidMount() {
    setTimeout(this.appear, 100);
    setTimeout(() => {
      this.shouldDisappear = true;
      if (!this.hover) {
        this.disappear();
      }
    }, 3000);
  }

  handleMouseEnter() {
    this.hover = true;
  }

  handleMouseLeave() {
    this.hover = false;
    if (this.shouldDisappear) {
      this.disappear();
    }
  }

  appear() {
    if (this.li.current) {
      this.li.current!.classList.add('shown');
    }
  }

  disappear() {
    if (this.li.current) {
      this.li.current!.classList.remove('shown');
      setTimeout(() => this.props.onRemove(this.props.id), 1000);
    }
  }

  render() {
    return (
      <li ref={this.li} 
        className={this.props.type === NotificationType.Error ? 'error' : 'information'}
        onClick={this.disappear} 
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}>
        {this.props.message}
      </li>
    );
  }
}