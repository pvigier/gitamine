import { clipboard } from 'electron';
import * as React from 'react';
import * as Git from 'nodegit';
import { PatchList } from './patch-list';
import { PatchType, RepoState } from '../helpers/repo-state';

function shortenSha(sha: string) {
  return sha.substr(0, 6);
}

function formatDate(date: Date) {
  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
}

export interface CommitViewerProps { 
  repo: RepoState;
  commit: Git.Commit;
  selectedPatch: Git.ConvenientPatch | null;
  onCommitSelect: (commit: Git.Commit) => void;
  onPatchSelect: (patch: Git.ConvenientPatch, type: PatchType) => void;
}

export interface CommitViewerState { 
  patches: Git.ConvenientPatch[];
}

export class CommitViewer extends React.PureComponent<CommitViewerProps, CommitViewerState> {
  div: React.RefObject<HTMLDivElement>;

  constructor(props: CommitViewerProps) {
    super(props);
    this.div = React.createRef<HTMLDivElement>();
    this.state = {
      patches: []
    }
    this.handlePatchSelect = this.handlePatchSelect.bind(this);
  }

  componentDidMount() {
    this.updatePatches();
  }

  componentDidUpdate(prevProps: CommitViewerProps) {
    if (this.props.commit !== prevProps.commit) {
      this.updatePatches();
    }
  }

  handlePatchSelect(patch: Git.ConvenientPatch) {
    this.props.onPatchSelect(patch, PatchType.Committed);
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
      <span className='tooltip-bottom sha-button' onMouseEnter={handleHover} onClick={handleClick}>
        {shortenSha(sha)}
        <span className='tooltip-text'>Copy</span>
      </span>
    );
  }

  createNavigationButton(commit: Git.Commit) {
    return (
      <span className='tooltip-bottom sha-button' key={commit.sha()} onClick={() => this.props.onCommitSelect(commit)}>
        {shortenSha(commit.sha())}
        <span className='tooltip-text'>Navigate</span>
      </span>
    );
  }

  createNavigationButtons(oids: Git.Oid[]) {
    const buttons = [];
    for (let i = 0; i < oids.length; ++i) {
      buttons.push(this.createNavigationButton(this.props.repo.shaToCommit.get(oids[i].tostrS())!));
      if (i < oids.length - 1) {
        buttons.push(', ');
      }
    }
    return buttons;
  }

  render() {
    const commit = this.props.commit;
    const author = commit.author();
    const authoredDate = new Date(author.when().time() * 1000);
    return (
      <div className='commit-viewer' ref={this.div}>
        <h3>Commit: {CommitViewer.createShaButton(commit.sha())}</h3>
        <h2>{commit.message()}</h2>
        <p>By {author.name()} &lt;<a href={`mailto:${author.email()}`}>{author.email()}</a>&gt;</p>
        <p>Authored {formatDate(authoredDate)}</p>
        <p>Last modified {formatDate(commit.date())}</p>
        <p>Parents: {this.createNavigationButtons(commit.parents())}</p>
        <PatchList patches={this.state.patches}
          type={PatchType.Committed}
          selectedPatch={this.props.selectedPatch}
          onPatchSelect={this.handlePatchSelect} />
      </div>
    );
  }
}