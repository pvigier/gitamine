import { clipboard } from 'electron';
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

  async updatePatches() {
    const diffs = await this.props.commit.getDiff();
    if (diffs.length > 0) {
      const diff = diffs[0];
      diff.findSimilar({})
      this.setState({
        patches: await diff.patches()
      })
    }
  }

  static createShaButton(sha: string) {
    function handleHover(event: React.MouseEvent<HTMLDivElement>) {
      const element = event.target as HTMLDivElement;
      const tooltipSpan = element.getElementsByClassName('tooltip-text')[0];
      tooltipSpan.textContent = 'Copy';
    }
    function handleClick(event: React.MouseEvent<HTMLDivElement>) {
      clipboard.writeText(sha);
      const element = event.target as HTMLDivElement;
      const tooltipSpan = element.getElementsByClassName('tooltip-text')[0];
      tooltipSpan.textContent = 'Copied';
    }
    return (
      <span className='tooltip-bottom' key={sha} onMouseEnter={handleHover} onClick={handleClick}>
        {shortenSha(sha)}
        <span className='tooltip-text'>Copy</span>
      </span>
    );
  }

  static createShaButtons(shas: Git.Oid[]) {
    const buttons = [];
    for (let i = 0; i < shas.length; ++i) {
      buttons.push(CommitViewer.createShaButton(shas[i].tostrS()))
      if (i < shas.length - 1) {
        buttons.push(', ');
      }
    }
    return buttons;
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
        <h3>Commit: {CommitViewer.createShaButton(this.commit.sha())}</h3>
        <h2>{this.commit.message()}</h2>
        <p>By {author.name()} &lt;<a href={`mailto:${author.email()}`}>{author.email()}</a>&gt;</p>
        <p>Authored {formatDate(authoredDate)}</p>
        <p>Last modified {formatDate(this.commit.date())}</p>
        <p>Parents: {CommitViewer.createShaButtons(this.commit.parents())}</p>
        <PatchList patches={this.state.patches}
          selectedPatch={this.props.selectedPatch}
          onPatchSelect={this.handlePatchSelect} />
      </div>
    );
  }
}