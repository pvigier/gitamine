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

    this.update(path, onReady);
  }

  async update(path: string, onReady: () => void) {
    try {
      this.repo = await Git.Repository.open(path);
      const names = await this.repo.getReferenceNames(Git.Reference.TYPE.OID);
      const referencesToUpdate = await this.getReferenceCommits(names);
      console.log(referencesToUpdate);
      const newCommits = await this.getNewCommits(referencesToUpdate);
      console.log(newCommits);
      await this.getParents(newCommits);
      this.removeUnreachableCommits();
      this.sortCommits();
      await this.getHead();
      this.graph = new CommitGraph(this);
      onReady();
    } catch (e) {
      console.error(e);
    }
  }

  async getReferenceCommits(names: string[]) {
    // Get reference commits
    const referenceCommits = await Promise.all(names.map(async (name) => {
      try {
        return [name, await this.repo.getReferenceCommit(name)] as [string, Git.Commit];
      } catch (e) {
        console.error(e);
        return [name, null] as [string, null];
      }
    }));
    // Update references and shaToReferences
    const referencesToUpdate: string[] = [];
    const newReferences = new Map<string, Git.Commit>();
    this.shaToReferences.clear();
    for (let [name, commit] of referenceCommits) {
      if (commit) {
        if (this.references.get(name) !== commit) {
          referencesToUpdate.push(name);
        }
        newReferences.set(name, commit);
        if (!this.shaToReferences.has(commit.sha())) {
          this.shaToReferences.set(commit.sha(), []);
        }
        this.shaToReferences.get(commit.sha())!.push(name);
      }
    }
    this.references = newReferences;
    return referencesToUpdate;
  }

  async getNewCommits(references: string[]) {
    const walker = Git.Revwalk.create(this.repo);
    for (let name of references) {
      walker.pushRef(name); 
    }
    // TODO: find a way to stop earlier the exploration
    const commits = await walker.getCommitsUntil(() => true);
    const newCommits: Git.Commit[] = [];
    for (let commit of commits) {
      const sha = commit.sha();
      if (!this.shaToCommit.has(sha)) {
        this.commits.push(commit);
        this.shaToCommit.set(sha, commit);
        newCommits.push(commit);
      }
    }
    return newCommits;
  }

  getParents(commits: Git.Commit[]) {
    for (let commit of commits) {
      this.children.set(commit.sha(), []);
    }
    return Promise.all(commits.map(async (commit) => {
      const commitSha = commit.sha();
      const parentShas = (await commit.getParents(Infinity)).map(commit => commit.sha());
      this.parents.set(commitSha, parentShas);
      // Update children
      for (let i = 0; i < parentShas.length; ++i) {
        if (i === 0) {
          this.children.get(parentShas[i])!.push([commitSha, ChildrenType.Commit]);
        } else {
          this.children.get(parentShas[i])!.push([commitSha, ChildrenType.Merge]);
        }
      }
    }));
  }

  removeUnreachableCommits() {
    // Find unreach commits
    const alreadyAdded = new Map<string, boolean>();
    const frontier = [...this.references.values()];
    for (let commit of frontier) {
      alreadyAdded.set(commit.sha(), true);
    }
    while (frontier.length !== 0) {
      const commit = frontier.pop()!;
      const commitSha = commit.sha();
      for (let parentSha of this.parents.get(commitSha)!) {
        if (!alreadyAdded.get(commitSha)) {
          alreadyAdded.set(parentSha, true);
          frontier.push(this.shaToCommit.get(parentSha)!);
        }
      }
    }

    // Remove them
    for (let [commitSha, seen] of alreadyAdded.entries()) {
      if (!seen) {
        this.removeCommit(this.shaToCommit.get(commitSha)!);
      }
    }
  }

  removeCommit(commit: Git.Commit) {
    console.log('remove commit', commit.sha());
    this.commits.splice(this.commits.indexOf(commit), 1);
    const commitSha = commit.sha();
    this.shaToCommit.delete(commitSha);
    for (let parentSha of this.parents.get(commitSha)!) {
      const parentChildren = this.children.get(parentSha)!;
      parentChildren.splice(parentChildren.findIndex((x) => x[0] === commitSha), 1);
    }
    this.parents.delete(commitSha);
    for (let [childSha, type] of this.children.get(commitSha)!) {
      const childParents = this.parents.get(childSha)!;
      childParents.splice(childParents.indexOf(commitSha), 1);
    }
    this.children.delete(commitSha);
  }

  sortCommits() {
    // TODO: code the dfs with a stack
    const dfs = (commit: Git.Commit) => {
      const commitSha = commit.sha();
      if (alreadySeen.get(commitSha)) {
        return;
      }
      alreadySeen.set(commitSha, true);
      for (let [childSha, type] of this.children.get(commitSha)!) {
        dfs(this.shaToCommit.get(childSha)!);
      }
      sortedCommits.push(commit);
    }

    // Sort the commits by date (from newer to older)
    this.commits.sort((lhs, rhs) => rhs.date().valueOf() - lhs.date().valueOf());
    // Topological sort (from parent to children)
    const sortedCommits: Git.Commit[] = [];
    const alreadySeen = new Map<string, boolean>();
    for (let commit of this.commits) {
      dfs(commit);
    }
    this.commits = sortedCommits;
  }

  async getHead() {
    this.head = this.references.get((await this.repo.head()).name())!.sha();
  }
}