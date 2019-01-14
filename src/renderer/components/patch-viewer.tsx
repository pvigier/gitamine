import * as Path from 'path';
import * as fs from 'fs';
import * as React from 'react';
import * as Git from 'nodegit';
import { RepoState } from '../repo-state'

// Load Monaco

const loadMonaco = require('monaco-loader')
let monaco: any;
loadMonaco().then((m: any) => {
  monaco = m;
});

// Util

async function getBlob(repo: Git.Repository, file: Git.DiffFile) {
  try {
    return (await repo.getBlob(file.id())).toString();
  } catch (e) {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(Path.join(Path.dirname(repo.path()), file.path()), (error, data) => {
        if (!error) {
          resolve(data.toString());
        } else {
          reject(error);
        }
      });
    })
  }
}

// PatchViewer

export enum PatchViewerMode {
  ReadOnly,
  Stage,
  Unstage
}

enum ViewMode {
  Hunk,
  Inline,
  Split
}

export interface PatchViewerProps { 
  repo: RepoState;
  patch: Git.ConvenientPatch;
  mode: PatchViewerMode;
  onEscapePressed: () => void;
}

export class PatchViewer extends React.PureComponent<PatchViewerProps, {}> {
  editor: any;
  viewMode: ViewMode;
  viewZoneIds: number[];
  oldBlob: string;
  newBlob: string;
  hunks: Git.ConvenientHunk[];
  loadingPromise: Promise<void>;

  constructor(props: PatchViewerProps) {
    super(props);
    this.editor = null;
    this.viewMode = ViewMode.Hunk;
    this.viewZoneIds = [];
    this.setUpEditor = this.setUpEditor.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  componentDidMount() {
    window.addEventListener('keyup', this.handleKeyUp);
  }

  componentWillUnmount() {
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  handleKeyUp(event: KeyboardEvent) {
    if (event.keyCode === 27) {
      this.props.onEscapePressed();
    }
  }

  handleViewModeChange(viewMode: ViewMode) {
    if (viewMode !== this.viewMode) {
      this.viewMode = viewMode;
      if (this.editor) {
        this.updateEditor();
      }
    }
  }

  loadData() {
    const repo = this.props.repo.repo;
    const patch = this.props.patch;
    // Load old blob
    let oldPromise: Promise<string>;
    if (this.props.patch.isAdded()) {
      oldPromise = Promise.resolve('');
    } else {
      oldPromise = getBlob(repo, patch.oldFile());
    }
    // Load new blob
    let newPromise: Promise<string>;
    if (this.props.patch.isDeleted()) {
      newPromise = Promise.resolve('');
    } else {
      newPromise = getBlob(repo, patch.newFile());
    }
    // Load hunks
    this.loadingPromise = Promise.all([oldPromise, newPromise, this.props.patch.hunks()])
      .then(([oldBlob, newBlob, hunks]) => {
        this.oldBlob = oldBlob;
        this.newBlob = newBlob;
        this.hunks = hunks;
      });
  }

  setUpEditor(element: HTMLDivElement) {
    // Get a DOM ref on the div that will contain monaco
    if (element) {
      const options = {
        //theme: 'vs-dark',
        automaticLayout: true,
        renderSideBySide: false,
        readOnly: true
      }
      this.editor = monaco.editor.createDiffEditor(element, options)
      this.loadingPromise.then(() => this.updateEditor());
    }
  }

  updateEditor() {
    // Update editor options
    this.editor.updateOptions({
      renderSideBySide: this.viewMode === ViewMode.Split
    });
    // Reset view zones
    this.editor.getModifiedEditor().changeViewZones((changeAccessor: any) => {
      for (let viewZoneId of this.viewZoneIds) {
        changeAccessor.removeZone(viewZoneId);
      }
    });
    // Reset line numbers
    this.setLineNumbers((i: number) => i, (i: number) => i); 
    // Update models
    if (this.viewMode === ViewMode.Hunk) {
      this.setHunkModels(); 
    } else {
      this.setBlobModels();
    }
  }

  setHunkModels()
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
    const oldLines = this.oldBlob.split('\n');
    const oldHunks: string[] = [];
    const oldOffsets: number[] = [];
    const oldStarts = [1];
    const newLines = this.newBlob.split('\n');
    const newHunks: string[] = [];
    const newOffsets: number[] = [];
    const newStarts = [1];
    for (let hunk of this.hunks) {
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
    this.setModels(oldHunks.join('\n'), newHunks.join('\n'));
    // Set line numbers
    this.setLineNumbers(generateLineNumbers(oldStarts, oldOffsets), 
      generateLineNumbers(newStarts, newOffsets));
    // Add view zones
    const editor = this.editor.getModifiedEditor();
    editor.changeViewZones((changeAccessor: any) => {
        for (let i = 0; i < this.hunks.length; ++i) {
          const hunk = this.hunks[i];
          const domNode = document.createElement('div');
          domNode.innerHTML = `@@ -${hunk.oldStart()},${hunk.oldLines()} +${hunk.newStart()},${hunk.newLines()}`;
          this.viewZoneIds.push(changeAccessor.addZone({
                afterLineNumber: newStarts[i] - 1,
                heightInLines: 1,
                domNode: domNode
          }));
        }
    });
  }

  setBlobModels() {
    this.setModels(this.oldBlob, this.newBlob);
  }

  setModels(oldString: string, newString: string) {
    function updateOrCreateModel(prefix: string, path: string, value: string) {
      const uri = monaco.Uri.parse(`file://${prefix}/${path}`);
      let model = monaco.editor.getModel(uri);
      if (model) {
        model.setValue(value);
      } else {
        model = monaco.editor.createModel(value, undefined, uri);
      }
      return model;
    }
    
    const patch = this.props.patch;
    const originalModel = updateOrCreateModel('a', patch.oldFile().path(), oldString);
    const modifiedModel = updateOrCreateModel('b', patch.newFile().path(), newString);
    this.editor.setModel({
      original: originalModel, 
      modified: modifiedModel
    });
  }

  setLineNumbers(oldLineNumbers: (i: number) => number, newLineNumbers: (i: number) => number) {
    this.editor.getOriginalEditor().updateOptions({
      lineNumbers: oldLineNumbers
    });
    this.editor.getModifiedEditor().updateOptions({
      lineNumbers: newLineNumbers
    });
  }

  render() {
    // Set up editor
    this.oldBlob = '';
    this.newBlob = '';
    this.hunks = [];
    this.loadData();

    // Update the models if the editor is already created
    if (this.editor) {
      this.loadingPromise.then(() => this.updateEditor());
    }

    return (
      <div className='patch-viewer'>
        <div className='patch-header'>
          <h2>{this.props.patch.newFile().path()}</h2>
        </div>
        <div className="view-mode-selector">
          <input type="radio" id="hunk-mode" name="view-mode-selector" 
            defaultChecked={this.viewMode === ViewMode.Hunk}
            onInput={this.handleViewModeChange.bind(this, ViewMode.Hunk)} />
          <label htmlFor="hunk-mode">Hunk</label >
          <input type="radio" id="inline-mode" name="view-mode-selector" 
            defaultChecked={this.viewMode === ViewMode.Inline}
            onInput={this.handleViewModeChange.bind(this, ViewMode.Inline)} />
          <label htmlFor="inline-mode">Inline</label>
          <input type="radio" id="split-mode" name="view-mode-selector"
            defaultChecked={this.viewMode === ViewMode.Split}
            onInput={this.handleViewModeChange.bind(this, ViewMode.Split)} />
          <label htmlFor="split-mode">Split</label>
        </div>
        <div className='patch-editor' ref={this.setUpEditor} />
      </div>
    );
  }
}