import { RepoState } from './repo-state'
import IntervalTree from 'node-interval-tree';

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
    function insertCommit(commit: string, i: number) {
      // Try to insert as close as possible to i
      let di = 1;
      while (i - di >= 0 || i + di < branches.length) {
        if (i + di < branches.length && branches[i + di] === null) {
          branches[i + di] = commit;
          return i + di;
        } else if (i - di >= 0 && branches[i - di] === null) {
          branches[i - di] = commit;
          return i - di;
        }
        ++di;
      }
      // If it is not possible to find an available position, insert at the end
      branches.push(commit);
      return branches.length - 1;
    }

    this.positions.clear();
    const headSha = repo.headCommit.sha();
    let i = 1;
    const branches: (string | null)[] = ['index'];
    for (let commit of repo.commits) {
      let j = -1;
      const commitSha = commit.sha();
      const children = repo.children.get(commit.sha())!;
      // Find a commit to replace
      let commitToReplace: string | null = null;
      if (commitSha === headSha) {
        commitToReplace = 'index';
      } else {
        for (let childSha of children) {
          if (repo.parents.get(childSha)![0] === commitSha) {
            commitToReplace = childSha;
            break;
          }
        }
      }
      // Insert the commit in the active branches
      if (commitToReplace) {
        j = branches.indexOf(commitToReplace);
        branches[j] = commitSha;
      } else {
        if (children.length > 0) {
          const childSha = children[0];
          const jChild = this.positions.get(childSha)![1];
          j = insertCommit(commitSha, jChild);
        } else {
          // TODO: Find a better value for i
          j = insertCommit(commitSha, 0);
        }
      }
      // Remove children from active branches
      for (let childSha of children) {
        if (childSha != commitToReplace && repo.parents.get(childSha)![0] === commitSha) {
          branches[branches.indexOf(childSha)] = null;
        }
      }
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
      const type = parents.length > 1 ? EdgeType.Merge : EdgeType.Normal;
      for (let parentSha of parents) {
        const [i1, j1] = this.positions.get(parentSha)!;
        this.edges.insert(i0, i1, [[i0, j0], [i1, j1], type]);
      }
    }
  }
}