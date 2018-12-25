import * as React from 'react';
import * as Git from 'nodegit';

export interface PatchViewerProps { 
  commit: Git.Commit,
  patch: Git.ConvenientPatch
}

export class PatchViewer extends React.PureComponent<PatchViewerProps, {}> {
  render() {
    const patch = this.props.patch;
    return (
      <div className='patch-viewer'>
        <h1>{patch.newFile().path()}</h1>
      </div>
    );
  }
}