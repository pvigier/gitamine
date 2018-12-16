import * as React from 'react';
import * as Git from 'nodegit';
import { CommitItem } from './commit-item';
import { GraphCanvas } from './graph-canvas';

export interface GraphViewerProps { repo: Git.Repository; }
export interface GraphViewerState { commits: Git.Commit[], references: Map<string, Git.Commit>; }

export class GraphViewer extends React.Component<GraphViewerProps, GraphViewerState> {
  constructor(props: GraphViewerProps) {
    super(props);
    this.state = {
      commits: [],
      references: new Map<string, Git.Commit>()
    };
    this.getGraph();
  }

  getAllCommits(references: Map<string, Git.Commit>) {
    const walker = Git.Revwalk.create(this.props.repo);
    //walker.sorting(Git.Revwalk.SORT.TIME);
    for (let name of references.keys()) {
      walker.pushRef(name); 
    }
    walker.getCommitsUntil(() => true).then((commits) => {
      this.setState({
        commits: commits,
        references: references
      });
    });
  }

  getGraph() {
    // Retrieve all the references
    const references = new Map<string, Git.Commit>();
    this.props.repo.getReferenceNames(Git.Reference.TYPE.OID)
      .then((names) => {
        const promises = names.map((name) => {
          return this.props.repo.getReferenceCommit(name)
            .then((commit) => {
              references.set(name, commit);
            });
        });
        Promise.all(promises)
          .then(() => {
            this.getAllCommits(references);
          });
      });
  }

  render() {
    const items = this.state.commits.map((commit: Git.Commit) => (
      <CommitItem commit={commit} key={commit.sha()} />
    ));
    return (
      <div className='graph-viewer'>
        <div className='commit-graph'>
          <GraphCanvas commits={this.state.commits} />
        </div>
        <div className='commit-list'>
          <ul>{items}</ul>
        </div>
      </div>
    );
  }
}