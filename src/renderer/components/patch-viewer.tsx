import * as Path from 'path';
import * as fs from 'fs';
import * as React from 'react';
import * as Git from 'nodegit';
import { isBinaryFile } from 'isbinaryfile';
import { RepoState, PatchType } from '../helpers/repo-state'
import { CancellablePromise, makeCancellable } from '../helpers/make-cancellable';
import { TextPatchViewer, TextPatchViewerOptions } from './text-patch-viewer';

interface Blob {
  data: string;
  isBinary: boolean;
}

// Util

async function getBlob(repo: Git.Repository, file: Git.DiffFile) {
  try {
    const blob = await repo.getBlob(file.id());
    return {
      data: blob.toString(), 
      isBinary: blob.isBinary() === 1
    } as Blob;
  } catch (e) {
    return new Promise<Blob>((resolve, reject) => {
      fs.readFile(Path.join(Path.dirname(repo.path()), file.path()), (error, data) => {
        if (!error) {
          isBinaryFile(data).then((binary) => {
            resolve({
              data: data.toString(),
              isBinary: binary
            });
          });
        } else {
          reject(error);
        }
      });
    })
  }
}

function arePatchesEqual(lhs: Git.ConvenientPatch, rhs: Git.ConvenientPatch) {
  return lhs.oldFile().id().equal(rhs.oldFile().id()) &&
    lhs.newFile().id().equal(rhs.newFile().id()) &&
    lhs.status() === rhs.status() &&
    lhs.size() === rhs.size();
}

// PatchViewer

export interface PatchViewerProps { 
  repo: RepoState;
  patch: Git.ConvenientPatch;
  type: PatchType;
  editorTheme: string;
  options: TextPatchViewerOptions;
  onClose: () => void;
}

export interface PatchViewerState {
  oldBlob: Blob | null;
  newBlob: Blob | null;
}

export class PatchViewer extends React.PureComponent<PatchViewerProps, PatchViewerState> {
  loadingPromise: CancellablePromise<[Blob, Blob]>;

  constructor(props: PatchViewerProps) {
    super(props);
    this.state = {
      oldBlob: null,
      newBlob: null
    };
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  componentDidMount() {
    window.addEventListener('keyup', this.handleKeyUp);
    this.loadData();
  }

  componentWillUnmount() {
    if (this.loadingPromise) {
      this.loadingPromise
    }
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  componentDidUpdate(prevProps: PatchViewerProps) {
    if (this.props.patch !== prevProps.patch && 
      (this.props.patch.isUntracked() || !arePatchesEqual(this.props.patch, prevProps.patch))) {
      //const scrollTop = arePatchesSimilar(prevProps.patch, this.props.patch) ? this.editor.getModifiedEditor().getScrollTop() : 0;
      if (this.loadingPromise) {
        this.loadingPromise.cancel();
      }
      this.loadData();
    } 
  }

  handleKeyUp(event: KeyboardEvent) {
    if (event.keyCode === 27) {
      this.props.onClose();
    }
  }

  async loadData() {
    const repo = this.props.repo.repo;
    const patch = this.props.patch;
    // Reset the blobs
    this.setState({
      oldBlob: null,
      newBlob: null
    });
    // Load old blob
    let oldPromise: Promise<Blob>;
    if (this.props.patch.isAdded()) {
      oldPromise = new Promise((resolve) => resolve({
        data: '',
        isBinary: false
      }));
    } else {
      oldPromise = getBlob(repo, patch.oldFile());
    }
    // Load new blob
    let newPromise: Promise<Blob>;
    if (this.props.patch.isDeleted()) {
      newPromise = new Promise((resolve) => resolve({
        data: '',
        isBinary: false
      }));
    } else {
      newPromise = getBlob(repo, patch.newFile());
    }
    this.loadingPromise = makeCancellable(Promise.all([oldPromise, newPromise]));
    try {
      const [oldBlob, newBlob] = await this.loadingPromise.promise;
      this.setState({
        oldBlob: oldBlob,
        newBlob: newBlob
      });
    } catch (e) {
    }
  }

  render() {
    const path = this.props.patch.newFile().path();
    const i = Math.max(path.lastIndexOf('/'), 0);
    let viewer: JSX.Element | null = null;
    if (this.state.oldBlob && this.state.newBlob) {
      if (!this.state.oldBlob.isBinary && !this.state.newBlob.isBinary) {
        console.log('patch viewer update');
        console.log(this.state.oldBlob.data);
        viewer = <TextPatchViewer repo={this.props.repo}
          patch={this.props.patch}
          oldString={this.state.oldBlob.data}
          newString={this.state.newBlob.data}
          type={this.props.type}
          editorTheme={this.props.editorTheme}
          options={this.props.options} />
      } else {
        viewer = <p>Binary patch</p>
      }
    }
    return (
      <div className='patch-viewer'>
        <div className='patch-header'>
          <h2>
            <div className='ellipsis-middle'>
              <div className='left'>{path.substr(0, i)}</div>
              <div className='right'>{path.substr(i)}</div>
            </div>
          </h2>
          <button onClick={this.props.onClose}>Close</button>
        </div>
        {viewer}
      </div>
    );
  }
}