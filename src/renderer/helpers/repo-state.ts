import * as Path from 'path';
import * as fs from 'fs'
import * as Git from 'nodegit';
import ignore from 'ignore'
import { CommitGraph } from './commit-graph';
import { Field, Settings } from '../../shared/settings';
import { NotificationType } from '../components/notification-item';

export function getRepoName(path: string) {
  return Path.parse(Path.dirname(path)).name;
}

export function shortenSha(sha: string) {
  return sha.substr(0, 6);
}

export function removeReferencePrefix(name: string) {
  return name.substr(name.indexOf('/', name.indexOf('/') + 1) + 1);
}

const diffOptions = {
  flags: Git.Diff.OPTION.INCLUDE_UNTRACKED | 
  Git.Diff.OPTION.RECURSE_UNTRACKED_DIRS
}

const findSimilarOptions = {
  flags: Git.Diff.FIND.ALL
}

export enum PatchType {
  Unstaged,
  Staged,
  Committed
}

export class Stash {
  index: number;
  commit: Git.Commit;

  constructor(index: number, commit: Git.Commit) {
    this.index = index;
    this.commit = commit;
  }
}

export class RepoState {
  repo: Git.Repository;
  path: string;
  name: string;
  commits: Git.Commit[];
  shaToCommit: Map<string, Git.Commit>;
  shaToIndex: Map<string, number>;
  references: Map<string, Git.Commit>;
  shaToReferences: Map<string, string[]>;
  stashes: Map<string, Stash>; // Use a dictionary?
  parents: Map<string, string[]>;
  children: Map<string, string[]>;
  head: string | null;
  headCommit: Git.Commit | null;
  graph: CommitGraph;
  onNotification: (message: string, type: NotificationType) => void;
  updatePromise: Promise<void>; // Used to queue updates
  ig: any;

  constructor(repo: Git.Repository, onNotification: (message: string, type: NotificationType) => void) {
    this.repo = repo;
    this.path = this.repo.path(); 
    this.name = getRepoName(this.path);
    this.commits = [];
    this.shaToCommit = new Map<string, Git.Commit>();
    this.shaToIndex = new Map<string, number>();
    this.references = new Map<string, Git.Commit>();
    this.shaToReferences = new Map<string, string[]>();
    this.stashes = new Map<string, Stash>();
    this.parents = new Map<string, string[]>();
    this.children = new Map<string, string[]>();
    this.graph = new CommitGraph();
    this.onNotification = onNotification;
    this.updatePromise = new Promise<void>((resolve) => resolve());
    this.ig = ignore();
  }

  async init() {
    await this.updateCommits();
    await this.updateHead();
    await this.updateGraph();
    this.updateIgnore();
  }

  async requestUpdateCommits() {
    // Start an update only if the previous ones have finished
    this.updatePromise = this.updatePromise.then(() => this.updateCommits());
    await this.updatePromise;
  }

  async updateCommits() {
    const referencesToUpdate = await this.updateReferences();
    const stashesToUpdate = await this.updateStashes();
    const newCommits = await this.getNewCommits(referencesToUpdate, stashesToUpdate);
    this.getParents(newCommits);
    this.removeUnreachableCommits();
    await this.hideStashSecondParents(stashesToUpdate);
    this.sortCommits();
  }

  async updateReferences() {
    const referenceCommits = await this.getReferenceCommits();
    const referencesToUpdate: string[] = [];
    const newReferences = new Map<string, Git.Commit>();
    this.shaToReferences.clear();
    for (let [name, commit] of referenceCommits) {
      const commitSha = commit.sha();
      if (!this.references.has(name) || this.references.get(name)!.sha() !== commitSha) {
        referencesToUpdate.push(name);
      }
      newReferences.set(name, commit);
      if (!this.shaToReferences.has(commitSha)) {
        this.shaToReferences.set(commitSha, []);
      }
      this.shaToReferences.get(commitSha)!.push(name);
    }
    this.references = newReferences;
    return referencesToUpdate;
  }

  async updateStashes() {
    const stashes = await this.getStashes();
    const stashesToUpdate: Stash[] = [];
    for (let [sha, stash] of stashes) {
      if (!this.stashes.has(sha)) {
        stashesToUpdate.push(stash);
      }
    }
    this.stashes = stashes;
    return stashesToUpdate;
  }

  async getNewCommits(references: string[], stashes: Stash[]) {
    const walker = Git.Revwalk.create(this.repo);
    // Set the reference commits as start of the walk
    for (let name of references) {
      walker.pushRef(name); 
    }
    // Set the stash commits as start of the walk
    for (let stash of stashes) {
      walker.push(stash.commit.id());
    }
    // Prevent from retrieving a commit already loaded
    for (let commit of this.commits) {
      walker.hide(commit.id());
    }
    // Retrieve new commits
    const newCommits = await walker.getCommitsUntil(() => true);
    for (let commit of newCommits) {
      this.commits.push(commit);
      this.shaToCommit.set(commit.sha(), commit);
    }
    return newCommits;
  }

  getParents(commits: Git.Commit[]) {
    for (let commit of commits) {
      this.children.set(commit.sha(), []);
    }
    for (let commit of commits) {
      const commitSha = commit.sha();
      const parentShas = commit.parents().map(oid => oid.tostrS());
      this.parents.set(commitSha, parentShas);
      // Update children
      for (let parentSha of parentShas) {
        this.children.get(parentSha)!.push(commitSha);
      }
    }
  }

  removeUnreachableCommits() {
    // Find unreachable commits by doing a DFS
    const alreadyAdded = new Map<string, boolean>();
    const frontier: Git.Commit[] = [
      ...this.references.values(), 
      ...Array.from(this.stashes.values(), (stash: Stash) => stash.commit)
    ];
    for (let commit of frontier) {
      alreadyAdded.set(commit.sha(), true);
    }
    while (frontier.length > 0) {
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

  async hideStashSecondParents(stashes: Stash[]) {
    // Hide the second parent of stash commits
    const parents = await Promise.all(Array.from(stashes.values(), (stash) => stash.commit.parent(1)));
    parents.map((parent) => this.removeCommit(parent));
  }

  removeCommit(commit: Git.Commit) {
    const commitSha = commit.sha();
    this.commits.splice(this.commits.indexOf(this.shaToCommit.get(commitSha)!), 1); // TODO: batch removal or update shaToIndex before removal
    this.shaToCommit.delete(commitSha);
    for (let parentSha of this.parents.get(commitSha)!) {
      const parentChildren = this.children.get(parentSha)!;
      parentChildren.splice(parentChildren.indexOf(commitSha), 1);
    }
    this.parents.delete(commitSha);
    for (let childSha of this.children.get(commitSha)!) {
      const childParents = this.parents.get(childSha)!;
      childParents.splice(childParents.indexOf(commitSha), 1);
    }
    this.children.delete(commitSha);
  }

  sortCommits() {
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
    const commitsWithTime = this.commits.map((commit) => [commit.date().valueOf(), commit] as [number, Git.Commit]);
    commitsWithTime.sort((lhs, rhs) => rhs[0] - lhs[0]);
    this.commits = commitsWithTime.map(([time, commit]) => commit);
    // Topological sort (from parent to children)
    const sortedCommits: Git.Commit[] = [];
    const alreadySeen = new Map<string, boolean>();
    for (let commit of this.commits) {
      dfs(commit);
    }
    this.commits = sortedCommits;
    // Update shaToIndex
    this.shaToIndex = new Map(this.commits.map((commit, i) => [commit.sha(), i] as [string, number]));
  }

  async updateHead() {
    try  {
      this.head = (await this.repo.head()).name();
    } catch (e) {
      this.head = null;
    }
    this.headCommit = await this.repo.getHeadCommit();
  }

  updateGraph() {
    this.graph.computePositions(this);
  }

  // Repo creation

  static async clone(url: string, path: string) {
    const options = { 
      fetchOpts: RepoState.getCredentialsCallback()
    };
    return await Git.Clone.clone(url, path, options);
  }

  static async init(path: string) {
    return await Git.Repository.init(path, 0);
  }

  static async open(path: string) {
    return await Git.Repository.open(path);
  }

  // Head operations

  async checkoutReference(name: string) {
    try {
      const reference = await this.repo.getReference(name);
      await this.repo.checkoutRef(reference);
      this.onNotification(`Checkout successfully to ${name}`, NotificationType.Information);
    } catch(e) {
      this.onNotification(`Unable to checkout to ${name}: ${e.message}`, NotificationType.Error);
    }
  }

  async reset(target: Git.Commit, resetType: Git.Reset.TYPE) {
    Git.Reset.reset(this.repo, target, resetType, {});
  }

  // Index operations

  async getUnstagedPatches() {
    const unstagedDiff = await Git.Diff.indexToWorkdir(this.repo, null, diffOptions);
    await unstagedDiff.findSimilar(findSimilarOptions);
    return await unstagedDiff.patches();
  }

  async getStagedPatches() {
    const oldTree = this.headCommit ? await this.headCommit.getTree() : null;
    const stagedDiff = await Git.Diff.treeToIndex(this.repo, oldTree, null, diffOptions);
    await stagedDiff.findSimilar(findSimilarOptions);
    return await stagedDiff.patches();
  }

  async stageLines(patch: Git.ConvenientPatch, lines: Git.DiffLine[]) {
    // Does not work if the lines are from different hunks
    const path = patch.newFile().path();
    await this.repo.stageLines(path, lines, false);
  }

  async stageHunk(patch: Git.ConvenientPatch, hunk: Git.ConvenientHunk) {
    const lines = await hunk.lines();
    await this.stageLines(patch, lines);
  }

  async stagePatch(patch: Git.ConvenientPatch) {
    const index = await this.repo.index();
    if (patch.isDeleted()) {
      await index.removeByPath(patch.newFile().path())
      await index.write();
    } else if (patch.isRenamed()) {
      await index.removeByPath(patch.oldFile().path())
      await index.addByPath(patch.newFile().path())
      await index.write();
    } else {
      await index.addByPath(patch.newFile().path())
      await index.write();
    }
  }

  async stageAll(patches: Git.ConvenientPatch[]) {
    const index = await this.repo.index();
    const paths = patches.map((patch) => patch.newFile().path());
    await index.addAll(paths, Git.Index.ADD_OPTION.ADD_DEFAULT);
    await index.write();
  }

  async unstageLines(patch: Git.ConvenientPatch, lines: Git.DiffLine[]) {
    // Does not work if the lines are from different hunks
    const path = patch.newFile().path();
    await this.repo.stageLines(path, lines, true);
  }

  async unstageHunk(patch: Git.ConvenientPatch, hunk: Git.ConvenientHunk) {
    const lines = await hunk.lines();
    await this.unstageLines(patch, lines);
  }

  async unstagePatch(patch: Git.ConvenientPatch) {
    await Git.Reset.default(this.repo, this.headCommit, patch.newFile().path());
    if (patch.isRenamed()) {
      await Git.Reset.default(this.repo, this.headCommit, patch.oldFile().path());
    }
  }

  async unstageAll(patches: Git.ConvenientPatch[]) {
    const paths = patches.map((patch) => patch.newFile().path());
    await Git.Reset.default(this.repo, this.headCommit, paths);
  }

  async discardLines(patch: Git.ConvenientPatch, lines: Git.DiffLine[]) {
    const path = patch.newFile().path();
    await this.repo.discardLines(path, lines);
  }

  async discardHunk(patch: Git.ConvenientPatch, hunk: Git.ConvenientHunk) {
    const lines = await hunk.lines();
    await this.discardLines(patch, lines);
  }

  async discardPatch(patch: Git.ConvenientPatch) {
    if (patch.isUntracked()) {
      // Remove the file
      fs.unlink(Path.join(this.repo.workdir(), patch.newFile().path()), () => {});
    } else if (this.headCommit) {
      const path = patch.newFile().path();
      await Git.Checkout.head(this.repo, {
        baseline: await this.headCommit.getTree(),
        checkoutStrategy: Git.Checkout.STRATEGY.FORCE,
        paths: path
      });
    }
  }

  async commit(message: string) {
    try {
      const author = this.getSignature();
      const index = await this.repo.index();
      const oid = await index.writeTree();
      const parent = this.headCommit ? [this.headCommit] : []; // The first commit has no parent
      await this.repo.createCommit('HEAD', author, author, message, oid, parent);
    } catch (e) {
      this.onNotification(`Unable to commit: ${e.message}`, NotificationType.Error);
    }
  }

  async amend(message: string) {
    try {
      if (this.headCommit) {
        const index = await this.repo.index();
        const oid = await index.writeTree();
        this.headCommit.amend('HEAD', this.headCommit.author(), this.getSignature(), this.headCommit.messageEncoding(), message, oid);
      } else {
        throw Error('There is no commit to amend');
      }
    } catch (e) {
      this.onNotification(`Unable to amend: ${e.message}`, NotificationType.Error);
    }
  }

  async cherrypick(commit: Git.Commit) {
    try {
      await Git.Cherrypick.cherrypick(this.repo, commit, new Git.CheckoutOptions());
      await this.commit(commit.message());
    } catch (e) {
      this.onNotification(`Unable to cherrypick: ${e.message}`, NotificationType.Error);
    }
  }

  async revert(commit: Git.Commit) {
    try {
      await Git.Revert.revert(this.repo, commit, null);
      await this.commit(`Revert "${commit.message()}"`);
    } catch (e) {
      this.onNotification(`Unable to cherrypick: ${e.message}`, NotificationType.Error);
    }
  }

  // Reference operations

  async getReferenceCommits() {
    const names = await this.repo.getReferenceNames(Git.Reference.TYPE.OID);
    const commits = await Promise.all(names.map(async (name) => {
      try {
        // Filter stash
        if (name === 'refs/stash') {
          return [name, null] as [string, null];
        } else {
          return [name, await this.repo.getReferenceCommit(name)] as [string, Git.Commit];
        }
      } catch (e) {
        return [name, null] as [string, null];
      }
    }));
    return commits.filter(([name, commit]) => commit !== null) as [string, Git.Commit][];
  }

  async createBranch(name: string, commit: Git.Commit)  {
    try {
      await this.repo.createBranch(name, commit, false);
    } catch (e) {
      this.onNotification(`Unable to create branch ${name}: ${e.message}`, NotificationType.Error);
    }
  }

  async createTag(name: string, commit: Git.Commit, message = '') {
    try {
      const object = await Git.Object.lookup(this.repo, commit.id(), Git.Object.TYPE.COMMIT);
      await Git.Tag.createLightweight(this.repo, name, object, 0);
    } catch (e) {
      this.onNotification(`Unable to create tag ${name}: ${e.message}`, NotificationType.Error);
    }
  }

  async removeReference(name: string) {
    try {
      await Git.Reference.remove(this.repo, name);
    } catch (e) {
      this.onNotification(`Unable to remove reference ${name}: ${e.message}`, NotificationType.Error);
    }
  }

  async renameReference(oldName: string, newName: string) {
    try {
      const reference = await this.repo.getReference(oldName);
      await reference.rename(newName, 0, `Rename ${oldName} to ${newName}`);
    } catch (e) {
      this.onNotification(`Unable to rename reference ${oldName} to ${newName}: ${e.message}`, NotificationType.Error);
    }
  }

  async merge(from: string, to: string) {
    try {
      await this.repo.mergeBranches(from, to);
      this.onNotification('Merge successfully', NotificationType.Information);
    } catch (e) {
      this.onNotification(`Unable to merge ${from} into ${to}: ${e.message}`, NotificationType.Error);
    }
  }

  async fetchAll() {
    try {
      await this.repo.fetchAll(RepoState.getCredentialsCallback());
    } catch (e) {
      this.onNotification(`Unable to fetch all: ${e.message}`, NotificationType.Error);
    }
  }

  async pull(name: string) {
    await this.merge(name, `origin/${name}`);
  }

  async push() {
    try {
      const remote = await this.repo.getRemote('origin');
      await remote.push([`${this.head}:${this.head}`], RepoState.getCredentialsCallback())
      this.onNotification('Pushed successfully', NotificationType.Information);
    } catch (e) {
      this.onNotification(`Unable to push: ${e.message}`, NotificationType.Error);
    }
  }

  // Credentials

  getSignature() {
    try {
      const name = Settings.get(Field.Name);
      const email = Settings.get(Field.Email);
      return Git.Signature.now(name, email);
    } catch (e) {
      this.onNotification('Unable to set an author for this commit. Please check you configure correctly your account in "Preferences".', NotificationType.Error);
      throw e;
    }
  }

  static getCredentialsCallback() {
    return {
      callbacks: {
        credentials: (url: string, userName: string) => {
          return Git.Cred.sshKeyFromAgent(userName);
        }
      }
    }
  }

  // Stash

  async getStashes() {
    const oids: Git.Oid[] = [];
    await Git.Stash.foreach(this.repo, (index: Git.Index, message: string, oid: Git.Oid) => {
      oids.push(oid);
    });
    let commits = await Promise.all(oids.map((oid) => this.repo.getCommit(oid)));
    return new Map<string, Stash>(commits.map((commit, index) => 
      [commit.sha(), new Stash(index, commit)] as [string, Stash]));
  }

  async stash() {
    try {
      const stasher = this.getSignature();
      const message = this.headCommit ? `${shortenSha(this.headCommit.sha())} ${this.headCommit.summary()}` : '';
      await Git.Stash.save(this.repo, stasher, message, Git.Stash.FLAGS.DEFAULT);
    } catch(e) {
      this.onNotification(`Unable to stash: ${e.message}`, NotificationType.Error);
    }
  }

  async applyStash(index: number) {
    try {
      await Git.Stash.apply(this.repo, index);
    } catch(e) {
      this.onNotification(`Unable to apply stash: ${e.message}`, NotificationType.Error);
    }
  }

  async popStash(index = 0) {
    try {
      await Git.Stash.pop(this.repo, index);
    } catch(e) {
      this.onNotification(`Unable to pop stash: ${e.message}`, NotificationType.Error);
    }
  }

  async dropStash(index: number) {
    try {
      await Git.Stash.drop(this.repo, index);
    } catch(e) {
      this.onNotification(`Unable to drop stash: ${e.message}`, NotificationType.Error);
    }
  }

  // Ignore

  updateIgnore() {
    const path = Path.join(this.path, '../.gitignore');
    if (fs.existsSync(path)) {
      this.ig = ignore().add(fs.readFileSync(path).toString())
    }
  }

  isIgnored(path: string) {
    // .gitignore is never ignored
    return path && path !== '.gitignore' && this.ig.ignores(path);
  }
}