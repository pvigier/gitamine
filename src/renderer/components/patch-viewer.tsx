import * as Path from 'path';
import * as fs from 'fs';
import * as React from 'react';
import * as Git from 'nodegit';
import fileType, { FileTypeResult }  from 'file-type';
import { isBinaryFile } from 'isbinaryfile';
import { RepoState, PatchType } from '../helpers/repo-state'
import { CancellablePromise, makeCancellable } from '../helpers/make-cancellable';
import { arePatchesEqual } from '../helpers/patch-comparison';
import { TextPatchViewer, TextPatchViewerOptions } from './text-patch-viewer';
import { BinaryPatchViewer } from './binary-patch-viewer';
import { ImagePatchViewer } from './image-patch-viewer';

enum BlobType {
  Void,
  Text,
  Binary,
  Image
}

type Blob = [Buffer, BlobType];

// Util

function isImage(type: FileTypeResult | null) {
  return type !== null && type.mime.startsWith('image');
}

async function getBlob(repo: Git.Repository, file: Git.DiffFile) {
  let buffer: Buffer;
  try {
    const blob = await repo.getBlob(file.id());
    buffer = blob.content();
  } catch (e) {
    buffer = await new Promise<Buffer>((resolve, reject) => {
      fs.readFile(Path.join(Path.dirname(repo.path()), file.path()), (error, data) => {
        if (!error) {
          resolve(data);
        } else {
          reject(error);
        }
      });
    });
  }
  let type = BlobType.Text;
  const flags = file.flags();
  const binary = (flags & Git.Diff.FLAG.VALID_ID) > 0 ? 
    (flags & Git.Diff.FLAG.BINARY) > 0  || (flags & Git.Diff.FLAG.NOT_BINARY) === 0:
    await isBinaryFile(buffer);
  if (binary) {
    type = isImage(fileType(buffer)) ? BlobType.Image : BlobType.Binary;
  }
  return [buffer, type] as Blob;
}

function getViewerType(oldType: BlobType, newType: BlobType) {
  switch (oldType) {
    case BlobType.Void:
      return newType;
    case BlobType.Image:
      return newType === BlobType.Image || newType === BlobType.Void ? BlobType.Image : BlobType.Binary;
    case BlobType.Text:
      return newType === BlobType.Text || newType === BlobType.Void ? BlobType.Text : BlobType.Binary;
    default:
      return BlobType.Binary;
  }
}

// PatchViewer

export interface PatchViewerProps { 
  repo: RepoState;
  patch: Git.ConvenientPatch;
  patchType: PatchType;
  editorTheme: string;
  options: TextPatchViewerOptions;
  onClose: () => void;
}

export interface PatchViewerState {
  loadedPatch: Git.ConvenientPatch | null;
  oldBlob: Buffer;
  newBlob: Buffer;
  viewerType: BlobType;
}

export class PatchViewer extends React.PureComponent<PatchViewerProps, PatchViewerState> {
  blobsPromise: CancellablePromise<[Blob, Blob]>;

  constructor(props: PatchViewerProps) {
    super(props);
    this.state = {
      loadedPatch: null,
      oldBlob: Buffer.from(''),
      newBlob: Buffer.from(''),
      viewerType: BlobType.Text
    };
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  componentDidMount() {
    window.addEventListener('keyup', this.handleKeyUp);
    this.loadData();
  }

  componentDidUpdate(prevProps: PatchViewerProps) {
    // If the patch objects are the same, we do not load a second time
    // If the pach is untracked or the patches are not exactly the same, we update
    if (this.props.patch !== prevProps.patch && 
      (this.props.patch.isUntracked() || !arePatchesEqual(this.props.patch, prevProps.patch))) {
      this.loadData();
    } 
  }

  componentWillUnmount() {
    if (this.blobsPromise) {
      this.blobsPromise.cancel();
    }
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  handleKeyUp(event: KeyboardEvent) {
    if (event.keyCode === 27) {
      this.props.onClose();
    }
  }

  async loadData() {
    const repo = this.props.repo.repo;
    const patch = this.props.patch;
    // Load old blob
    let oldPromise: Promise<Blob>;
    if (this.props.patch.isAdded() || this.props.patch.isUntracked()) {
      oldPromise = new Promise((resolve) => resolve([Buffer.from(''), BlobType.Void]));
    } else {
      oldPromise = getBlob(repo, patch.oldFile());
    }
    // Load new blob
    let newPromise: Promise<Blob>;
    if (this.props.patch.isDeleted()) {
      newPromise = new Promise((resolve) => resolve([Buffer.from(''), BlobType.Void]));
    } else {
      newPromise = getBlob(repo, patch.newFile());
    }
    // Create a cancellable promise
    if (this.blobsPromise) {
      this.blobsPromise.cancel();
    }
    this.blobsPromise = makeCancellable(Promise.all([oldPromise, newPromise]));
    try {
      const [[oldBlob, oldType], [newBlob, newType]] = await this.blobsPromise.promise;
      this.setState({
        loadedPatch: this.props.patch,
        oldBlob: oldBlob,
        newBlob: newBlob,
        viewerType: getViewerType(oldType, newType)
      });
    } catch (e) {
    }
  }

  render() {
    const path = this.props.patch.newFile().path();
    const i = Math.max(path.lastIndexOf('/'), 0);
    let viewer: JSX.Element | null = null;
    if (this.state.loadedPatch) {
      if (this.state.viewerType === BlobType.Text) {
        viewer = <TextPatchViewer repo={this.props.repo}
          patch={this.state.loadedPatch}
          oldString={this.state.oldBlob.toString()}
          newString={this.state.newBlob.toString()}
          type={this.props.patchType}
          editorTheme={this.props.editorTheme}
          options={this.props.options} />
      } else if (this.state.viewerType === BlobType.Image) {
        viewer = <ImagePatchViewer repo={this.props.repo} 
          patch={this.props.patch}
          oldBuffer={this.state.oldBlob}
          newBuffer={this.state.newBlob} />
      } else {
        viewer = <BinaryPatchViewer />;
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