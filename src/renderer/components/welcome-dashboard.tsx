import * as React from 'react';
import * as settings from 'electron-settings';
import { Field, getKey } from '../settings';

export class WelcomeDashboard extends React.PureComponent<{}, {}> {
  render() {
    const recentlyOpenedItems = settings.get(getKey(Field.RecentlyOpened))
      .map((path: string) => <li key={path}>{path}</li>);
    return (
      <div>
        <h1>Welcome to gitamine!</h1>
        <h2>Recently opened repo</h2>
        <ul>
          {recentlyOpenedItems}
        </ul>
        <h2>Actions</h2>
        <ul>
          <li>Open a repo</li>
          <li>Init a repo</li>
          <li>Clone a repo</li>
        </ul>
      </div>
    );
  }
}
