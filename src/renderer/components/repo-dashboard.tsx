import * as React from 'react';
import * as Git from 'nodegit';
import { GraphViewer } from './graph-viewer';

export interface RepoDashboardProps { repo: Git.Repository; }

export class RepoDashboard extends React.Component<RepoDashboardProps, {}> {
  render() {
    return (
      <div>
        <h1>{this.props.repo.path()}</h1>
        <GraphViewer repo={this.props.repo}/>
      </div>
    );
  }
}