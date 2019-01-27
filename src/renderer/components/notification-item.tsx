import * as React from 'react';

export interface NotificationItemProps { 
  message: string;
}

export class NotificationItem extends React.PureComponent<NotificationItemProps, {}> {
  constructor(props: NotificationItemProps) {
    super(props);
  }

  render() {
    return (
      <li>
        {this.props.message}
      </li>
    );
  }
}