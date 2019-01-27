import * as React from 'react';
import { NotificationItem } from './notification-item';

class Notification {
  id: number;
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
    this.removeNotification = this.removeNotification.bind(this);
  }

  addNotification(message: string) {
    const notification = {id: this.counter, message: message};
    ++this.counter;
    this.setState((prevState) => ({
      notifications: [...prevState.notifications, notification]
    }));
  }

  removeNotification(id: number) {
    this.setState((prevState) => {
      const notifications = prevState.notifications.slice();
      notifications.splice(notifications.findIndex((notification) => notification.id === id), 1);
      return {
        notifications: notifications
      };
    });
  }

  render() {
    // Notification items
    const notificationItems = this.state.notifications.map((notification) => 
      <NotificationItem message={notification.message}
        onRemove={this.removeNotification}
        id={notification.id}
        key={notification.id} />
    );

    return (
      <ul className='notification-queue'>
        {notificationItems}
      </ul>
    );
  }
}