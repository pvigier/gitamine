import * as React from 'react';
import * as Git from 'nodegit';
import { RepoState } from '../repo-state'

// Load Monaco

const loadMonaco = require('monaco-loader')
let monaco: any;
loadMonaco().then((m: any) => {
  monaco = m;
});

// Util functions
 
function getBlobByPath(tree: Git.Tree, components: string[]): Promise<Git.Blob> {
  if (components.length == 1) {
    return tree.entryByName(components[0]).getBlob();
  } else {
    return tree.entryByName(components[0]).getTree()
      .then((tree) => getBlobByPath(tree, components.slice(1)));
  }
}

function getContentByPath(commit: Git.Commit, path: string) {
  return commit.getTree()
    .then((tree) => getBlobByPath(tree, path.split('/')))
    .then((blob) => blob.toString());
}

export interface PatchViewerProps { 
  repo: RepoState,
  commit: Git.Commit,
  patch: Git.ConvenientPatch
}

export class PatchViewer extends React.PureComponent<PatchViewerProps, {}> {
  setDivRef: (element: HTMLDivElement) => void;
  editor: any;

  constructor(props: PatchViewerProps) {
    super(props);
    this.editor = null;
    // Get a DOM ref on the div that will contain monaco
    this.setDivRef = (element: HTMLDivElement) => {
      const options = {
        theme: 'vs-dark',
        automaticLayout: true
      }
      this.editor = monaco.editor.createDiffEditor(element, options)
    };
  }

  setModels(oldPath: string, oldString: string, newPath: string, newString: string) {
    const originalModel = monaco.editor.createModel(oldString, undefined, monaco.Uri.parse('old/' + oldPath));
    const modifiedModel = monaco.editor.createModel(newString, undefined, monaco.Uri.parse('new/' + newPath));
    this.editor.setModel({
      original: originalModel, 
      modified: modifiedModel
    });
  }

  updateEditor() {
    // Load new and old blob
    const parentSha = this.props.commit.parentId(0).tostrS();
    const parentCommit = this.props.repo.shaToCommit.get(parentSha)!;
    const oldPath = this.props.patch.oldFile().path();
    const newPath = this.props.patch.newFile().path();
    const oldPromise = getContentByPath(parentCommit, oldPath);
    const newPromise = getContentByPath(this.props.commit, newPath);
    Promise.all([oldPromise, newPromise])
      .then((strings) => this.setModels(oldPath, strings[0], newPath, strings[1]));
  }

  render() {
    this.updateEditor();
    return (
      <div className='patch-viewer' ref={this.setDivRef}>
        <h1>{this.props.patch.newFile().path()}</h1>
      </div>
    );
  }
}