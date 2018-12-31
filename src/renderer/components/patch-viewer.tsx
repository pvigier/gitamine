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
  patch: Git.ConvenientPatch,
  onEscapePressed: () => void
}

export class PatchViewer extends React.PureComponent<PatchViewerProps, {}> {
  setDivRef: (element: HTMLDivElement) => void;
  editor: any;

  constructor(props: PatchViewerProps) {
    super(props);
    this.editor = null;
    // Get a DOM ref on the div that will contain monaco
    this.setDivRef = (element: HTMLDivElement) => {
      if (element) {
        const options = {
          theme: 'vs-dark',
          automaticLayout: true
        }
        this.editor = monaco.editor.createDiffEditor(element, options)
      }
    };
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  handleKeyUp(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.keyCode === 27) {
      this.props.onEscapePressed();
    }
  }

  setModels(oldPath: string, oldString: string, newPath: string, newString: string) {
    function updateOrCreateModel(path: string, value: string) {
      const uri = monaco.Uri.parse(path);
      let model = monaco.editor.getModel(uri);
      if (!model)
        model = monaco.editor.createModel(value, undefined, uri);
      return model;
    }

    const originalModel = updateOrCreateModel(oldPath, oldString);
    const modifiedModel = updateOrCreateModel(newPath, newString);
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
      .then((strings) => this.setModels(parentSha + '/' + oldPath, strings[0], 
        this.props.commit.sha() + '/' + newPath, strings[1]));
  }

  render() {
    this.updateEditor();
    return (
      <div className='patch-viewer' ref={this.setDivRef} onKeyUp={this.handleKeyUp}>
        <h1>{this.props.patch.newFile().path()}</h1>
      </div>
    );
  }
}