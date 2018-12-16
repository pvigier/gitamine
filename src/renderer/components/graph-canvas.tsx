import * as React from 'react';
import * as Git from 'nodegit';

export interface GraphCanvasProps { commits: Git.Commit[]; }

export class GraphCanvas extends React.Component<GraphCanvasProps, {}> {
  canvas: HTMLCanvasElement | null;
  parents: Map<string, string[]>;
  children: Map<string, string[]>;
  positions: Map<string, [number, number]>
  width: number;
  height: number;
  setCanvasRef: (element: HTMLCanvasElement) => void;

  constructor(props: GraphCanvasProps) {
    super(props);
    this.canvas = null;
    this.width = 0;
    this.height = 0;

    this.setCanvasRef = (element: HTMLCanvasElement) => {
      this.canvas = element;
    }
  }

  componentDidUpdate() {
    this.parents = new Map<string, string[]>();
    this.children = new Map<string, string[]>();
    this.positions = new Map<string, [number, number]>();
    this.getParents()
      .then(() => {
        console.log(this.parents);
        this.updateChildren();
        console.log(this.children);
        this.computePositions();
        this.drawGraph();
      });
  }

  getParents() {
    const promises = this.props.commits.map((commit) => {
      return commit.getParents(Infinity).then((parents) => {
        console.log(commit, parents);
        this.parents.set(commit.sha(), parents.map(commit => commit.sha()));
      })
    });
    return Promise.all(promises)
  }

  updateChildren() {
    for (let commit of this.props.commits) {
      this.children.set(commit.sha(), []);
    }
    for (let [child, parents] of this.parents) {
      for (let parent of parents) {
        this.children.get(parent)!.push(child);
      }
    }
  }

  computePositions() {
    function insertCommit(commit: string) {
      for (let i = 0; i < branches.length; ++i) {
        if (branches[i] === null) {
          branches[i] = commit;
          return i;
        }
      }
      branches.push(commit);
      return branches.length - 1;
    }

    let i = 0;
    const branches: (string | null)[] = [];
    for (let commit of this.props.commits) {
      let j = -1;
      const commitSha = commit.sha();
      //console.log('commit: ', commitSha);
      const children = this.children.get(commit.sha()) as string[];
      //console.log('children: ', children);
      // Find a commit to replace
      let commitToReplace: string | null = null;
      for (let childSha of children) {
        if (this.parents.get(childSha)![0] === commitSha) {
          commitToReplace = childSha;
          break;
        }
      }
      // Insert the commit in the active branches
      if (commitToReplace) {
        j = branches.indexOf(commitToReplace);
        branches[j] = commitSha;
      } else {
        j = insertCommit(commitSha);
      }
      // Remove children from active branches
      for (let childSha of children) {
        if (childSha != commitToReplace && this.parents.get(childSha)![0] === commitSha) {
          branches[branches.indexOf(childSha)] = null;
        }
      }
      // TO DO: remove extra nulls at the end of the list
      this.positions.set(commit.sha(), [i, j]);
      //console.log('j: ', j);
      //console.log('branches: ', branches);
      this.width = Math.max(this.width, j);
      ++i;
    }
    this.width = (this.width + 1) * 22;
    this.height = this.props.commits.length * 28;
  }

  drawNodes(ctx: CanvasRenderingContext2D) {
    for (let [commitSha, [i, j]] of this.positions) {
      ctx.fillStyle = 'green';
      ctx.beginPath();
      ctx.arc(j * 22 + 11, 3 + i * 28 + 11, 11, 0, Math.PI * 2, true);
      ctx.fill();
    }
  }

  drawEdges(ctx: CanvasRenderingContext2D) {
    for (let [commitSha, [i0, j0]] of this.positions) {
      const x0 = j0 * 22 + 11;
      const y0 = 3 + i0 * 28 + 11;
      for (let childSha of this.children.get(commitSha) as string[]) {
        const [i1, j1] = this.positions.get(childSha) as [number, number];
        const x1 = j1 * 22 + 11;
        const y1 = 3 + i1 * 28 + 11;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }
  }

  drawGraph() {
    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        this.drawEdges(ctx);
        this.drawNodes(ctx);
      }
    }
  }

  render() {
    return (
      <canvas ref={this.setCanvasRef} />
    );
  }
}