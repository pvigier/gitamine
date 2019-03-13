import * as os from 'os';
import * as Path from 'path';
import * as React from 'react';
import { Field, Settings } from '../../shared/settings';
import { getRepoName } from '../helpers/repo-wrapper';

function getWorkingDirectory(path: string) {
  if (path.endsWith('.git')) {
    return Path.dirname(path);
  } else {
    return path;
  }
}

export class WelcomeDashboardProps {
  onRecentlyOpenedRepoClick: (path: string) => void;
  onOpenRepo: () => void;
  onInitRepo: () => void;
  onCloneRepo: () => void;
}

export class WelcomeDashboard extends React.PureComponent<WelcomeDashboardProps, {}> {
  render() {
    const homeDir = os.homedir();
    const recentlyOpenedItems = Settings.get(Field.RecentlyOpened, [])
      .map((path: string) => {
        const relativePath = Path.relative(homeDir, path);
        const formattedPath = relativePath.startsWith('..') ? 
          Path.normalize(getWorkingDirectory(path)) : 
          `~${Path.sep}${getWorkingDirectory(relativePath)}`;
        const i = formattedPath.lastIndexOf(Path.sep);
        return (
          <div className='action' 
            onClick={() => this.props.onRecentlyOpenedRepoClick(path)}
            key={path}>
            <h3>{getRepoName(path)}</h3>
            <p> 
              <span className='ellipsis-middle'>
                <span className='left'>{formattedPath.substr(0, i)}</span>
                <span className='right'>{formattedPath.substr(i)}</span>
              </span>
            </p>
          </div>
        );
      });
    return (
      <div className='welcome-dashboard'>
        <h1>Welcome to gitamine!</h1>
        <h2>Recently opened repo</h2>
        <div className='actions'>
          {recentlyOpenedItems}
        </div>
        <h2>Actions</h2>
        <div className='actions'>
          <div className='action' onClick={this.props.onOpenRepo}>
            <h3>Open a repo</h3>
           </div>
          <div className='action' onClick={this.props.onInitRepo}>
            <h3>Init a repo</h3>
           </div>
          <div className='action' onClick={this.props.onCloneRepo}>
            <h3>Clone a repo</h3>
          </div>
        </div>
      </div>
    );
  }
}
