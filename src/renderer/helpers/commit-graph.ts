import { RepoState } from './repo-state'
import IntervalTree from 'node-interval-tree';
import * as FastPriorityQueue from 'fastpriorityqueue';

const BRANCH_COLORS = [
  'dodgerblue', 
  'DarkCyan', 
  'DarkGoldenRod', 
  'DarkGrey', 
  'DarkGreen', 
  'DarkKhaki', 
  'DarkMagenta', 
  'DarkOliveGreen', 
  'DarkOrange', 
  'DarkOrchid', 
  'DarkRed', 
  'DarkSalmon', 
  'DarkSeaGreen', 
  'DarkSlateBlue', 
  'DarkSlateGrey', 
  'DarkTurquoise', 
  'DarkViolet', 
]

export function getBranchColor(j: number) {
  return BRANCH_COLORS[j % BRANCH_COLORS.length];
}

export enum NodeType {
  Commit,
  Stash
}

export type Node = [number, number, NodeType];

export enum EdgeType {
  Normal,
  Merge
}

export type Edge = [[number, number], [number, number], EdgeType];

export class CommitGraph {
  positions: Map<string, Node>
  width: number;
  edges: IntervalTree<Edge>;

  constructor() {
    this.positions = new Map<string, Node>();
    this.width = 0;
    this.edges = new IntervalTree<Edge>();
  }

  computePositions(repo: RepoState) {
    function mergeSets(sets: Set<number>[]) {
      return new Set<number>(function*() { 
        for (let set of sets) {
          yield* set;
        }
      }());
    }

    function insertCommit(commitSha: string, j: number, forbiddenIndices: Set<number>) {
      // Try to insert as close as possible to i 
      // replace i by j
      let dj = 1;
      while (j - dj >= 0 || j + dj < branches.length) {
        if (j + dj < branches.length && branches[j + dj] === null && !forbiddenIndices.has(j + dj)) {
          branches[j + dj] = commitSha;
          return j + dj;
        } else if (j - dj >= 0 && branches[j - dj] === null && !forbiddenIndices.has(j - dj)) {
          branches[j - dj] = commitSha;
          return j - dj;
        }
        ++dj;
      }
      // If it is not possible to find an available position, insert at the end
      branches.push(commitSha);
      return branches.length - 1;
    }

    this.positions.clear();
    const headSha = repo.headCommit ? repo.headCommit.sha() : null;
    let i = 1;
    const branches: (string | null)[] = ['index'];
    const activeNodes = new Map<string, Set<number>>();
    const activeNodesQueue = new FastPriorityQueue<[number, string]>((lhs, rhs) => lhs[0] < rhs[0]);
    activeNodes.set('index', new Set<number>());
    if (headSha) {
      activeNodesQueue.add([repo.shaToIndex.get(headSha)!, 'index']);
    }
    for (let commit of repo.commits) {
      let j = -1;
      const commitSha = commit.sha();
      const children = repo.children.get(commit.sha())!;
      // Compute forbidden indices
      const forbiddenIndices = mergeSets(children.filter((childSha) => repo.parents.get(childSha)![0] !== commitSha).map((childSha) => activeNodes.get(childSha)!));
      //console.log(i, activeNodes.size, commitSha, forbiddenIndices, children, children.map((childSha) => [...activeNodes.get(childSha)!]));
      // Find a commit to replace
      let commitToReplace: string | null = null;
      let jCommitToReplace = Infinity;
      if (commitSha === headSha) {
        commitToReplace = 'index';
        jCommitToReplace = 0;
      } else {
        for (let childSha of children) {
          const jChild = this.positions.get(childSha)![1]!;
          // Do we want commit to be the first parent of child?
          if (repo.parents.get(childSha)![0] === commitSha && !forbiddenIndices.has(jChild) && jChild < jCommitToReplace) {
            commitToReplace = childSha;
            jCommitToReplace = jChild;
          }
        }
      }
      // Insert the commit in the active branches
      if (commitToReplace) {
        j = jCommitToReplace;
        branches[j] = commitSha;
      } else {
        if (children.length > 0) {
          const childSha = children[0];
          const jChild = this.positions.get(childSha)![1];
          // Try to insert near a child
          // We could try to insert near any child instead of arbitrarily chosing the first one
          j = insertCommit(commitSha, jChild, forbiddenIndices);
        } else {
          // TODO: Find a better value for j
          j = insertCommit(commitSha, 0, new Set());
        }
      }
      // Remove useless active nodes
      while (!activeNodesQueue.isEmpty() && activeNodesQueue.peek()[0] < i) {
        const sha = activeNodesQueue.poll()[1];
        activeNodes.delete(sha);
      }
      // Upddate the active nodes
      const jToAdd = [j, ...children.filter((childSha) => repo.parents.get(childSha)![0] === commitSha).map((childSha) => this.positions.get(childSha)![1])];
      for (let activeNode of activeNodes.values()) {
        jToAdd.forEach((j) => activeNode.add(j));
      }
      activeNodes.set(commitSha, new Set<number>());
      const iRemove = Math.max(...repo.parents.get(commitSha)!.map((parentSha) => repo.shaToIndex.get(parentSha)!));
      activeNodesQueue.add([iRemove, commitSha]);
      // Remove children from active branches
      for (let childSha of children) {
        if (childSha != commitToReplace && repo.parents.get(childSha)![0] === commitSha) {
          branches[branches.indexOf(childSha)] = null; // Use positions
        }
      }
      // Finally set the position
      this.positions.set(commitSha, [i, j, repo.stashes.has(commitSha) ? NodeType.Stash : NodeType.Commit]);
      ++i;
    }
    this.width = branches.length;
    this.updateIntervalTree(repo);
  }

  updateIntervalTree(repo: RepoState) {
    this.edges = new IntervalTree<Edge>();
    for (let [commitSha, [i0, j0]] of this.positions) {
      const parents = repo.parents.get(commitSha)!;
      for (let [i, parentSha] of parents.entries()) {
        const [i1, j1] = this.positions.get(parentSha)!;
        this.edges.insert(i0, i1, [[i0, j0], [i1, j1], i > 0 ? EdgeType.Merge : EdgeType.Normal]);
      }
    }
  }
}