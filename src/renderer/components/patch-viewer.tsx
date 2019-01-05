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

// PatchViewer

enum ViewMode {
  Hunk,
  Inline,
  Split
}

export interface PatchViewerProps { 
  repo: RepoState,
  commit: Git.Commit,
  patch: Git.ConvenientPatch,
  onEscapePressed: () => void
}

export interface PatchViewerState {
  viewMode: ViewMode
}

export class PatchViewer extends React.PureComponent<PatchViewerProps, PatchViewerState> {
  setDivRef: (element: HTMLDivElement) => void;
  editor: any;

  constructor(props: PatchViewerProps) {
    super(props);
    this.state = {
      viewMode: ViewMode.Hunk
    }
    this.editor = null;
    // Get a DOM ref on the div that will contain monaco
    this.setDivRef = (element: HTMLDivElement) => {
      if (element) {
        const options = {
          //theme: 'vs-dark',
          automaticLayout: true,
          renderSideBySide: false,
          readOnly: true
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

  setHunkModels(oldPath: string, oldString: string, newPath: string, newString: string, 
    hunks: Git.ConvenientHunk[])
  {
    function generateLineNumbers(starts: number[], offsets: number[]) {
      return (i: number) => {
        let j = 0;
        while (i >= starts[j + 1]) {
          ++j;
        }
        return i + offsets[j];
      }
    }

    // Extract hunks from files
    const oldLines = oldString.split('\n');
    const oldHunks: string[] = [];
    const oldOffsets: number[] = [];
    const oldStarts = [1];
    const newLines = newString.split('\n');
    const newHunks: string[] = [];
    const newOffsets: number[] = [];
    const newStarts = [1];
    for (let hunk of hunks) {
      const oldStart = hunk.oldStart();
      const oldLength = hunk.oldLines();
      oldHunks.push(oldLines.slice(oldStart - 1, oldStart - 1 + oldLength).join('\n'));
      oldOffsets.push(oldStart - oldStarts[oldStarts.length - 1]);
      oldStarts.push(oldStarts[oldStarts.length - 1] + oldLength);
      const newStart = hunk.newStart();
      const newLength = hunk.newLines();
      newHunks.push(newLines.slice(newStart - 1, newStart - 1 + newLength).join('\n'));
      newOffsets.push(newStart - newStarts[newStarts.length - 1]);
      newStarts.push(newStarts[newStarts.length - 1] + newLength);
    }
    // Set models
    this.setModels(oldPath, oldHunks.join('\n'), newPath, newHunks.join('\n'));
    // Set line numbers
    this.editor.getOriginalEditor().updateOptions({
      lineNumbers: generateLineNumbers(oldStarts, oldOffsets)
    });
    this.editor.getModifiedEditor().updateOptions({
      lineNumbers: generateLineNumbers(newStarts, newOffsets)
    });
    // Add view zones
    const editor = this.editor.getModifiedEditor();
    editor.changeViewZones(function(changeAccessor: any) {
        for (let i = 0; i < hunks.length; ++i) {
          const hunk = hunks[i];
          const domNode = document.createElement('div');
          domNode.innerHTML = `@@ -${hunk.oldStart()},${hunk.oldLines()} +${hunk.newStart()},${hunk.newLines()}`;
          changeAccessor.addZone({
                afterLineNumber: newStarts[i] - 1,
                heightInLines: 1,
                domNode: domNode
          });
        }
    });
  }

  updateEditor() {
    // Load old blob
    let oldPromise: Promise<string>;
    const oldPath = this.props.patch.oldFile().path();
    let parentSha = '';
    if (this.props.patch.isAdded()) {
      oldPromise = Promise.resolve('');
    } else {
      parentSha = this.props.commit.parentId(0).tostrS();
      const parentCommit = this.props.repo.shaToCommit.get(parentSha)!;
      oldPromise = getContentByPath(parentCommit, oldPath);
    }
    // Load new blob
    let newPromise: Promise<string>;
    const newPath = this.props.patch.newFile().path();
    if (this.props.patch.isDeleted()) {
      newPromise = Promise.resolve('');
    } else {
      newPromise = getContentByPath(this.props.commit, newPath);
    }
    // Update the models
    if (this.state.viewMode !== ViewMode.Hunk) {
      Promise.all([oldPromise, newPromise])
        .then(([oldString, newString]) => this.setModels(parentSha + '/' + oldPath, oldString, 
          this.props.commit.sha() + '/' + newPath, newString));
    } else {
      Promise.all([oldPromise, newPromise, this.props.patch.hunks()])
        .then(([oldString, newString, hunks]) => this.setHunkModels(parentSha + '/' + oldPath, oldString, 
          this.props.commit.sha() + '/' + newPath, newString, hunks));
    }
  }

  render() {
    this.updateEditor();
    return (
      <div className='patch-viewer' onKeyUp={this.handleKeyUp}>
        <div className='patch-header'>
          <h2>{this.props.patch.newFile().path()}</h2>
        </div>
        <div className='patch-editor' ref={this.setDivRef} />
      </div>
    );
  }
}