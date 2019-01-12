import * as Path from 'path';
import * as Git from 'nodegit';
import { CommitGraph } from './commit-graph';

export enum ChildrenType {
  Commit,
  Merge
}

export class RepoState {
  path: string;
  name: string;
  repo: Git.Repository;
  commits: Git.Commit[];
  shaToCommit: Map<string, Git.Commit>;
  references: Map<string, Git.Commit>;
  shaToReferences: Map<string, string[]>;
  parents: Map<string, string[]>;
  children: Map<string, [string, ChildrenType][]>;
  head: string;
  graph: CommitGraph;

  constructor(path: string, onReady: () => void) {
    this.path = path;
    this.name = Path.parse(path).name;
    this.commits = [];
    this.shaToCommit = new Map<string, Git.Commit>();
    this.references = new Map<string, Git.Commit>();
    this.shaToReferences = new Map<string, string[]>();
    this.parents = new Map<string, string[]>();
    this.children = new Map<string, [string, ChildrenType][]>();

    this.load(path, onReady);
  }

  load(path: string, onReady: () => void) {
    // Load the repository
    Git.Repository.open(path)
      .then((repo) => { this.repo = repo; })
      .then(() => this.repo.getReferenceNames(Git.Reference.TYPE.OID))
      .then((names) => this.getReferenceCommits(names))
      .then(() => this.getAllCommits())
      .then(() => this.getHead())
      .then(() => this.getParents())
      .then(() => {
        this.updateChildren();
        this.topologicalSort();
        this.graph = new CommitGraph(this);
        onReady();
      });
  }

  getReferenceCommits(names: string[]) {
    return Promise.all(names.map((name) => {
      return this.repo.getReferenceCommit(name)
        .then((commit) => { 
          this.references.set(name, commit);
          if (!this.shaToReferences.has(commit.sha())) {
            this.shaToReferences.set(commit.sha(), []);
          }
          this.shaToReferences.get(commit.sha())!.push(name);
        }, () => { console.log('failed'); });
    }))
  }

  getAllCommits() {
    const walker = Git.Revwalk.create(this.repo);
    walker.sorting(Git.Revwalk.SORT.TIME);
    for (let name of this.references.keys()) {
      walker.pushRef(name); 
    }
    return walker.getCommitsUntil(() => true)
      .then((commits) => {
        this.commits = commits;
        for (let commit of commits) {
          this.shaToCommit.set(commit.sha(), commit);
        }
      });
  }

  getHead() {
    return this.repo.head().then((head: Git.Reference) => 
      this.head = this.references.get(head.name())!.sha());
  }

  getParents() {
    const promises = this.commits.map((commit) => {
      return commit.getParents(Infinity).then((parents) => {
        this.parents.set(commit.sha(), parents.map(commit => commit.sha()));
      })
    });
    return Promise.all(promises)
  }

  updateChildren() {
    for (let commit of this.commits) {
      this.children.set(commit.sha(), []);
    }
    for (let [child, parents] of this.parents) {
      for (let parent of parents) {
        if (parents.length == 1) {
          this.children.get(parent)!.push([child, ChildrenType.Commit]);
        } else {
          this.children.get(parent)!.push([child, ChildrenType.Merge]);
        }
      }
    }
  }

  topologicalSort() {
    const dfs = (commit: Git.Commit) => {
      if (alreadySeen.get(commit.sha())) {
        return;
      }
      alreadySeen.set(commit.sha(), true);
      for (let [childSha, type] of this.children.get(commit.sha())!) {
        dfs(this.shaToCommit.get(childSha)!);
      }
      sortedCommits.push(commit);
    }

    const sortedCommits: Git.Commit[] = [];
    const alreadySeen = new Map<string, boolean>();
    for (let commit of this.commits) {
      dfs(commit);
    }
    this.commits = sortedCommits;
  }
}