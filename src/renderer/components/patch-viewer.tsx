import * as React from 'react';
import * as Git from 'nodegit';

export interface PatchViewerProps { 
  commit: Git.Commit,
  patch: Git.ConvenientPatch
}

export class PatchViewer extends React.PureComponent<PatchViewerProps, {}> {
  setDivRef: (element: HTMLDivElement) => void;

  constructor(props: PatchViewerProps) {
    super(props);
    this.setDivRef = (element: HTMLDivElement) => {
      const loadMonaco = require('monaco-loader')

      loadMonaco().then((monaco: any) => {
        const options = {
          theme: 'vs-dark',
          automaticLayout: true
        }

        const editor = monaco.editor.create(element, options)
      })
    };
  }

  render() {
    const patch = this.props.patch;
    return (
      <div className='patch-viewer' ref={this.setDivRef}>
        <h1>{patch.newFile().path()}</h1>
      </div>
    );
  }
}