import * as React from 'react';
import * as Git from 'nodegit';
import { RepoWrapper } from '../helpers/repo-wrapper';

export interface ImagePatchViewerProps { 
  repo: RepoWrapper;
  patch: Git.ConvenientPatch;
  oldBuffer: Buffer;
  newBuffer: Buffer;
}

export class ImagePatchViewer extends React.PureComponent<ImagePatchViewerProps, {}> {
  oldUrl: string;
  newUrl: string;

  render() {
    // Free urls
    if (this.oldUrl) {
      URL.revokeObjectURL(this.oldUrl);
    }
    if (this.newUrl) {
      URL.revokeObjectURL(this.newUrl);
    }
    // Create new urls
    this.oldUrl = URL.createObjectURL(new Blob([this.props.oldBuffer]));
    this.newUrl = URL.createObjectURL(new Blob([this.props.newBuffer]));
    return (
      <div className='image-viewer'>
        <p>Old file:</p>
        {this.props.patch.oldFile().flags() & Git.Diff.FLAG.EXISTS ?
        <img src={this.oldUrl} /> :
        null}
        <p>New file:</p>
        {this.props.patch.newFile().flags() & Git.Diff.FLAG.EXISTS ?
        <img src={this.newUrl} /> :
        null}
      </div>
    );
  }
}