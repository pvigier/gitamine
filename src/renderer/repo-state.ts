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

  async load(path: string, onReady: () => void) {
    try {
      this.repo = await Git.Repository.open(path);
      const names = await this.repo.getReferenceNames(Git.Reference.TYPE.OID);
      await this.getReferenceCommits(names);
      await this.getAllCommits();
      await this.getHead();
      await this.getParents();
      this.updateChildren();
      this.topologicalSort();
      this.graph = new CommitGraph(this);
      onReady();
    } catch (e) {
      console.error(e);
    }
  }

  getReferenceCommits(names: string[]) {
    return Promise.all(names.map(async (name) => {
      try {
        const commit = await this.repo.getReferenceCommit(name);
        this.references.set(name, commit);
        if (!this.shaToReferences.has(commit.sha())) {
          this.shaToReferences.set(commit.sha(), []);
        }
        this.shaToReferences.get(commit.sha())!.push(name);
      } catch (e) {
        console.error(e);
      }
    }))
  }

  async getAllCommits() {
    const walker = Git.Revwalk.create(this.repo);
    walker.sorting(Git.Revwalk.SORT.TIME);
    for (let name of this.references.keys()) {
      walker.pushRef(name); 
    }
    this.commits = await walker.getCommitsUntil(() => true);
    for (let commit of this.commits) {
      this.shaToCommit.set(commit.sha(), commit);
    }
  }

  async getHead() {
    this.head = this.references.get((await this.repo.head()).name())!.sha();
  }

  getParents() {
    return Promise.all(this.commits.map(async (commit) => {
      const parents = await commit.getParents(Infinity);
      this.parents.set(commit.sha(), parents.map(commit => commit.sha()));
    }));
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