import * as React from 'react';
import { NotificationItem } from './notification-item';

class Notification {
  key: number;
  message: string;
}

export interface NotificationQueueState {
  notifications: Notification[];
}

export class NotificationQueue extends React.PureComponent<{}, NotificationQueueState> {
  counter: number;

  constructor(props: {}) {
    super(props);
    this.counter = 0;
    this.state = {
      notifications: []
    };
  }

  addNotification(message: string) {
    const notification = {key: this.counter, message: message};
    ++this.counter;
    this.setState((prevState) => ({
      notifications: [...prevState.notifications, notification]
    }));
  }

  render() {
    // Notification items
    const notificationItems = this.state.notifications.map((notification) => 
      <NotificationItem message={notification.message} key={notification.key} />
    );

    return (
      <ul>
        {notificationItems}
      </ul>
    );
  }
}