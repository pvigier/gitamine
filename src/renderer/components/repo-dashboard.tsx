import * as React from 'react';
import * as Git from 'nodegit';
import { GraphViewer } from './graph-viewer';

export interface RepoDashboardProps { repo: Git.Repository; }

export class RepoDashboard extends React.Component<RepoDashboardProps, {}> {
  render() {
    return (
      <div className='repo-dashboard'>
        <div className='repo-header'>
          <h1>{this.props.repo.path()}</h1>
        </div>
        <GraphViewer repo={this.props.repo}/>
      </div>
    );
  }
}