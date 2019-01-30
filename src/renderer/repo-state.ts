import * as Path from 'path';
import * as Git from 'nodegit';
import { CommitGraph } from './commit-graph';
import { Field, Settings } from './settings';

const diffOptions = {
  flags: Git.Diff.OPTION.INCLUDE_UNTRACKED | 
  Git.Diff.OPTION.RECURSE_UNTRACKED_DIRS
}

export class RepoState {
  repo: Git.Repository;
  path: string;
  name: string;
  commits: Git.Commit[];
  shaToCommit: Map<string, Git.Commit>;
  references: Map<string, Git.Commit>;
  shaToReferences: Map<string, string[]>;
  parents: Map<string, string[]>;
  children: Map<string, string[]>;
  head: string;
  headCommit: Git.Commit;
  index: Git.Index;
  graph: CommitGraph;

  constructor(repo: Git.Repository, onReady: () => void) {
    this.repo = repo;
    this.path = this.repo.path(); 
    this.name = Path.parse(Path.dirname(this.path)).name;
    this.commits = [];
    this.shaToCommit = new Map<string, Git.Commit>();
    this.references = new Map<string, Git.Commit>();
    this.shaToReferences = new Map<string, string[]>();
    this.parents = new Map<string, string[]>();
    this.children = new Map<string, string[]>();
    this.graph = new CommitGraph();

    this.init().then(onReady);
  }

  async init() {
    await this.updateCommits();
    await this.updateHead();
    await this.updateIndex();
    await this.updateGraph();
  }

  async updateCommits() {
    const names = await this.repo.getReferenceNames(Git.Reference.TYPE.OID);
    const referencesToUpdate = await this.getReferenceCommits(names);
    const newCommits = await this.getNewCommits(referencesToUpdate);
    await this.getParents(newCommits);
    this.removeUnreachableCommits();
    this.sortCommits();
  }

  async getReferenceCommits(names: string[]) {
    // Get reference commits
    const referenceCommits = await Promise.all(names.map(async (name) => {
      try {
        return [name, await this.repo.getReferenceCommit(name)] as [string, Git.Commit];
      } catch (e) {
        console.log(e);
        return [name, null] as [string, null];
      }
    }));
    // Update references and shaToReferences
    const referencesToUpdate: string[] = [];
    const newReferences = new Map<string, Git.Commit>();
    this.shaToReferences.clear();
    for (let [name, commit] of referenceCommits) {
      if (commit) {
        if (!this.references.has(name) || this.references.get(name)!.sha() !== commit.sha()) {
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
      for (let parentSha of parentShas) {
        this.children.get(parentSha)!.push(commitSha);
      }
    }));
  }

  removeUnreachableCommits() {
    // Find unreachable commits by doing a DFS
    const alreadyAdded = new Map<string, boolean>();
    const frontier = [...this.references.values()];
    for (let commit of frontier) {
      alreadyAdded.set(commit.sha(), true);
    }
    while (frontier.length !== 0) {
      const commit = frontier.pop()!;
      const commitSha = commit.sha();
      for (let parentSha of this.parents.get(commitSha)!) {
        if (!alreadyAdded.get(parentSha)) {
          alreadyAdded.set(parentSha, true);
          frontier.push(this.shaToCommit.get(parentSha)!);
        }
      }
    }
    var commitsToRemove: Git.Commit[] = [];
    for (let commit of this.commits) {
      if (!alreadyAdded.has(commit.sha())) {
        commitsToRemove.push(commit);
      }
    }
    // Remove them
    for (let commit of commitsToRemove) {
      this.removeCommit(commit);
    }
  }

  removeCommit(commit: Git.Commit) {
    this.commits.splice(this.commits.indexOf(commit), 1); // TODO: batch removal
    const commitSha = commit.sha();
    this.shaToCommit.delete(commitSha);
    for (let parentSha of this.parents.get(commitSha)!) {
      const parentChildren = this.children.get(parentSha)!;
      parentChildren.splice(parentChildren.findIndex((x) => x[0] === commitSha), 1);
    }
    this.parents.delete(commitSha);
    for (let childSha of this.children.get(commitSha)!) {
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
      for (let childSha of this.children.get(commitSha)!) {
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

  async updateHead() {
    this.head = (await this.repo.head()).name();
    this.headCommit = await this.repo.getHeadCommit();
  }

  async updateIndex() {
    this.index = await this.repo.refreshIndex();
  }

  updateGraph() {
    this.graph.computePositions(this);
  }

  // Head operations

  async checkoutReference(name: string) {
    const reference = await this.repo.getReference(name);
    this.repo.checkoutRef(reference);
  }

  // Index operations

  async getUnstagedPatches() {
    const unstagedDiff = await Git.Diff.indexToWorkdir(this.repo, this.index, diffOptions);
    await unstagedDiff.findSimilar({});
    return await unstagedDiff.patches();
  }

  async getStagedPatches() {
    const stagedDiff = await Git.Diff.treeToIndex(this.repo, await this.headCommit.getTree(), this.index, diffOptions);
    await stagedDiff.findSimilar({});
    return await stagedDiff.patches();
  }

  async stageHunk(patch: Git.ConvenientPatch, hunk: Git.ConvenientHunk) {
    const lines = await hunk.lines();
    const path = patch.newFile().path();
    this.repo.stageLines(path, lines, false);
  }

  async stagePatch(patch: Git.ConvenientPatch) {
    if (patch.isDeleted()) {
      await this.index.removeByPath(patch.newFile().path())
      await this.index.write();
    } else {
      await this.index.addByPath(patch.newFile().path())
      await this.index.write();
    }
  }

  async stageAll(patches: Git.ConvenientPatch[]) {
    const paths = patches.map((patch) => patch.newFile().path());
    await this.index.addAll(paths, Git.Index.ADD_OPTION.ADD_DEFAULT);
    await this.index.write();
  }

  async unstageHunk(patch: Git.ConvenientPatch, hunk: Git.ConvenientHunk) {
    const lines = await hunk.lines();
    const path = patch.newFile().path();
    this.repo.stageLines(path, lines, true);
  }

  async unstagePatch(patch: Git.ConvenientPatch) {
    await Git.Reset.default(this.repo, this.headCommit, patch.newFile().path());
  }

  async unstageAll(patches: Git.ConvenientPatch[]) {
    const paths = patches.map((patch) => patch.newFile().path());
    await Git.Reset.default(this.repo, this.headCommit, paths);
  }

  async discardHunk(patch: Git.ConvenientPatch, hunk: Git.ConvenientHunk) {
    const lines = await hunk.lines();
    const path = patch.newFile().path();
    this.repo.discardLines(path, lines);
  }

  async discardPatch(patch: Git.ConvenientPatch) {
    // This a bit hacky
    const hunks = await patch.hunks();
    hunks.forEach((hunk) => this.discardHunk(patch, hunk));
  }

  async commit(message: string) {
    const name = Settings.get(Field.Name);
    const email = Settings.get(Field.Email);
    const author = Git.Signature.now(name, email);
    const oid = await this.index.writeTree();
    await this.repo.createCommit('HEAD', author, author, message, oid, [this.headCommit]);
  }
}