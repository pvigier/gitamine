import * as React from 'react';
import * as Git from 'nodegit';
import { PatchItem } from './patch-item';

export interface CommitViewerProps { 
  commit: Git.Commit | null;
  onPatchSelect: (patch: Git.ConvenientPatch) => void;
}

export interface CommitViewerState { patches: Git.ConvenientPatch[]; }

export class CommitViewer extends React.PureComponent<CommitViewerProps, CommitViewerState> {
  commit: Git.Commit | null;
  constructor(props: CommitViewerProps) {
    super(props);
    this.commit = this.props.commit;
    this.state = {
      patches: []
    }
  }

  updatePatches(commit: Git.Commit) {
    commit.getDiff()
      .then((diffs) => diffs.length > 0 ? diffs[0].patches() : [])
      .then((patches) => {
        this.setState({
          patches: patches
        })
      });
  }

  render() {
    let patchesDirty = false;
    if (this.commit !== this.props.commit) {
      this.commit = this.props.commit; 
      patchesDirty = true;
    }
    const commit = this.commit;
    if (commit) {
      // Patches
      const patches = this.state.patches;
      let patchesItems: JSX.Element[] = [];
      if (patchesDirty) {
        this.updatePatches(commit);
      } else {
        patchesItems = patches.map((patch) => {
          const path = patch.newFile().path();
          return <PatchItem onPatchSelect={this.props.onPatchSelect} patch={patch} key={path} />
        })
      }

      const authoredDate = new Date(commit.author().when().time() * 1000);
      return (
        <div className='commit-viewer'>
          <h2>{commit.message()}</h2>
          <p>{commit.sha()}</p>
          <p>Authored {authoredDate.toString()} by {commit.author().name()}</p>
          <p>Last modified {commit.date().toString()}</p>
          <p>Parents: {commit.parents().map((sha) => sha.tostrS().substr(0, 8)).toString()}</p>
          <div className='patch-list'>
            <ul>
              {patchesItems}
            </ul>
          </div>
        </div>
      );
    } else {
      return <div className='commit-viewer'></div>;
    }
  }
}