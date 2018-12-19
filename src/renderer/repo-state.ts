import * as Git from 'nodegit';

export enum ChildrenType {Commit, Merge}

export class RepoState {
  path: string;
  name: string;
  repo: Git.Repository;
  commits: Git.Commit[];
  shaToCommit: Map<string, Git.Commit>;
  references: Map<string, Git.Commit>;
  parents: Map<string, string[]>;
  children: Map<string, [string, ChildrenType][]>;

  constructor(path: string, onReady: () => void) {
    this.path = path;
    this.name = path.substr(path.lastIndexOf('/') + 1);
    this.commits = [];
    this.shaToCommit = new Map<string, Git.Commit>();
    this.references = new Map<string, Git.Commit>();
    this.parents = new Map<string, string[]>();
    this.children = new Map<string, [string, ChildrenType][]>();

    this.load(path, onReady);
  }

  load(path: string, onReady: () => void) {
    console.log(path);
    // Load the repository
    Git.Repository.open(path)
      .then((repo) => { this.repo = repo; })
      .then(() => this.repo.getReferenceNames(Git.Reference.TYPE.OID))
      .then((names) => this.getReferenceCommits(names))
      .then(() => this.getAllCommits())
      .then(() => this.getParents())
      .then(() => {
        this.updateChildren();
        this.topologicalSort();
        onReady();
      });
  }

  getReferenceCommits(names: string[]) {
    return Promise.all(names.map((name) => {
      return this.repo.getReferenceCommit(name)
        .then((commit) => { 
          this.references.set(name, commit) 
        });
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