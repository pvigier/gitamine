import * as React from 'react';
import * as Git from 'nodegit';
import { PatchItem } from './patch-item';

function shortenSha(sha: string) {
  return sha.substr(0, 6);
}

function formatDate(date: Date) {
  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
}

export interface CommitViewerProps { 
  commit: Git.Commit | null;
  selectedPatch: Git.ConvenientPatch | null;
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
    // Update dirtiness
    let patchesDirty = false;
    if (this.commit !== this.props.commit) {
      this.commit = this.props.commit; 
      patchesDirty = true;
    }
    const commit = this.commit;

    if (commit) {
      // Patches
      const patches = this.state.patches;
      let patchItems: JSX.Element[] = [];
      if (patchesDirty) {
        this.updatePatches(commit);
      } else {
        patchItems = patches.map((patch) => {
          const path = patch.newFile().path();
          return <PatchItem patch={patch} 
            selected={patch === this.props.selectedPatch} 
            onPatchSelect={this.props.onPatchSelect} 
            key={path} />
        })
      }

      const author = commit.author();
      const authoredDate = new Date(author.when().time() * 1000);
      return (
        <div className='commit-viewer'>
          <h3>Commit: {shortenSha(commit.sha())}</h3>
          <h2>{commit.message()}</h2>
          <p>By {author.name()} &lt;<a href={`mailto:${author.email()}`}>{author.email()}</a>&gt;</p>
          <p>Authored {formatDate(authoredDate)}</p>
          <p>Last modified {formatDate(commit.date())}</p>
          <p>Parents: {commit.parents().map((sha) => shortenSha(sha.tostrS())).join(' ')}</p>
          <ul className='patch-list'>
            {patchItems}
          </ul>
        </div>
      );
    } else {
      return <div className='commit-viewer'></div>;
    }
  }
}