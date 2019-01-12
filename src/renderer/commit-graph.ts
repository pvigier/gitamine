import { RepoState, ChildrenType } from './repo-state'

const BRANCH_COLORS = [
  'DarkBlue', 
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

export class CommitGraph {
  positions: Map<string, [number, number]>
  width: number;

  constructor(repo: RepoState) {
    this.positions = new Map<string, [number, number]>();
    this.computePositions(repo);
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

    let i = 1;
    const branches: (string | null)[] = ['index'];
    for (let commit of repo.commits) {
      let j = -1;
      const commitSha = commit.sha();
      const children = repo.children.get(commit.sha()) as [string, ChildrenType][];
      // Find a commit to replace
      let commitToReplace: string | null = null;
      if (commitSha === repo.head) {
        commitToReplace = 'index';
      } else {
        for (let [childSha, type] of children) {
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
          const childSha = children[0][0];
          const jChild = this.positions.get(childSha)![1];
          j = insertCommit(commitSha, jChild);
        } else {
          // TODO: Find a better value for i
          j = insertCommit(commitSha, 0);
        }
      }
      // Remove children from active branches
      for (let [childSha, type] of children) {
        if (childSha != commitToReplace && repo.parents.get(childSha)![0] === commitSha) {
          branches[branches.indexOf(childSha)] = null;
        }
      }
      this.positions.set(commit.sha(), [i, j]);
      ++i;
    }
    this.width = branches.length;
  }
}