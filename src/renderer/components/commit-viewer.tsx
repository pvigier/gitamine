import * as React from 'react';
import * as Git from 'nodegit';
import { PatchList } from './patch-list';
import { PatchViewerMode } from './patch-viewer';

function shortenSha(sha: string) {
  return sha.substr(0, 6);
}

function formatDate(date: Date) {
  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
}

export interface CommitViewerProps { 
  commit: Git.Commit;
  selectedPatch: Git.ConvenientPatch | null;
  onPatchSelect: (patch: Git.ConvenientPatch, mode: PatchViewerMode) => void;
}

export interface CommitViewerState { 
  patches: Git.ConvenientPatch[];
}

export class CommitViewer extends React.PureComponent<CommitViewerProps, CommitViewerState> {
  commit: Git.Commit;
  div: React.RefObject<HTMLDivElement>;

  constructor(props: CommitViewerProps) {
    super(props);
    this.div = React.createRef<HTMLDivElement>();
    this.state = {
      patches: []
    }
    this.handlePatchSelect = this.handlePatchSelect.bind(this);
  }

  handlePatchSelect(patch: Git.ConvenientPatch) {
    this.props.onPatchSelect(patch, PatchViewerMode.ReadOnly);
  }

  resize(offset: number) {
    if (this.div.current) {
      this.div.current.style.width = `${this.div.current.clientWidth + offset}px`;
    }
  }

  updatePatches() {
    this.commit.getDiff()
      .then((diffs) => {
        if (diffs.length > 0) {
          const diff = diffs[0];
          return diff.findSimilar({})
            .then(() => diff.patches());
        } else {
          return [];
        }
      })
      .then((patches) => {
        this.setState({
          patches: patches
        })
      });
  }

  render() {
    // Update patches if necessary
    if (this.commit !== this.props.commit) {
      this.commit = this.props.commit; 
      this.updatePatches();
    }

    const author = this.commit.author();
    const authoredDate = new Date(author.when().time() * 1000);
    return (
      <div className='commit-viewer' ref={this.div}>
        <h3>Commit: {shortenSha(this.commit.sha())}</h3>
        <h2>{this.commit.message()}</h2>
        <p>By {author.name()} &lt;<a href={`mailto:${author.email()}`}>{author.email()}</a>&gt;</p>
        <p>Authored {formatDate(authoredDate)}</p>
        <p>Last modified {formatDate(this.commit.date())}</p>
        <p>Parents: {this.commit.parents().map((sha) => shortenSha(sha.tostrS())).join(' ')}</p>
        <PatchList patches={this.state.patches}
          selectedPatch={this.props.selectedPatch}
          onPatchSelect={this.handlePatchSelect} />
      </div>
    );
  }
}