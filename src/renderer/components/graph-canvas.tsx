import * as React from 'react';
import * as Git from 'nodegit';

enum ChildrenType {Commit, Merge}
const RADIUS = 11;
const OFFSET_X = 2 * RADIUS;
const OFFSET_Y = 28;

export interface GraphCanvasProps { commits: Git.Commit[]; }

export class GraphCanvas extends React.Component<GraphCanvasProps, {}> {
  canvas: HTMLCanvasElement | null;
  parents: Map<string, string[]>;
  children: Map<string, [string, ChildrenType][]>;
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
    this.children = new Map<string, [string, ChildrenType][]>();
    this.positions = new Map<string, [number, number]>();
    this.getParents()
      .then(() => {
        this.updateChildren();
        this.computePositions();
        this.drawGraph();
      });
  }

  getParents() {
    const promises = this.props.commits.map((commit) => {
      return commit.getParents(Infinity).then((parents) => {
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
        if (parents.length == 1) {
          this.children.get(parent)!.push([child, ChildrenType.Commit]);
        } else {
          this.children.get(parent)!.push([child, ChildrenType.Merge]);
        }
      }
    }
  }

  computePositions() {
    function insertCommit(commit: string) {
      // Try to insert next to an active branch
      for (let i = 0; i < branches.length; ++i) {
        if (branches[i] === null &&
          ((i > 0 && branches[i - 1] !== null) ||
          (i < branches.length - 1 && branches[i + 1] !== null))) {
            branches[i] = commit;
            return i;
          }
      }
      // If it is not possible, make the graph wider
      branches.push(commit);
      return branches.length - 1;
    }

    let i = 0;
    const branches: (string | null)[] = [];
    for (let commit of this.props.commits) {
      let j = -1;
      const commitSha = commit.sha();
      //console.log('commit: ', commitSha);
      const children = this.children.get(commit.sha()) as [string, ChildrenType][];
      //console.log('children: ', children);
      // Find a commit to replace
      let commitToReplace: string | null = null;
      for (let [childSha, type] of children) {
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
      for (let [childSha, type] of children) {
        if (childSha != commitToReplace && this.parents.get(childSha)![0] === commitSha) {
          branches[branches.indexOf(childSha)] = null;
        }
      }
      // TO DO: remove extra nulls at the end of the list
      this.positions.set(commit.sha(), [i, j]);
      //console.log('j: ', j);
      //console.log('branches: ', branches);
      ++i;
    }
    this.width = branches.length * OFFSET_X;
    this.height = this.props.commits.length * OFFSET_Y;
  }

  computeNodeCenterCoordinates(i: number, j: number) {
    return [j * OFFSET_X + RADIUS, 3 + i * OFFSET_Y + RADIUS]
  }

  drawNodes(ctx: CanvasRenderingContext2D) {
    for (let [commitSha, [i, j]] of this.positions) {
      const [x, y] = this.computeNodeCenterCoordinates(i, j);
      ctx.fillStyle = 'green';
      ctx.beginPath();
      ctx.arc(x, y, RADIUS, 0, 2 * Math.PI, true);
      ctx.fill();
    }
  }

  drawEdges(ctx: CanvasRenderingContext2D) {
    for (let [commitSha, [i0, j0]] of this.positions) {
      const [x0, y0] = this.computeNodeCenterCoordinates(i0, j0);
      ctx.beginPath();
      for (let [childSha, type] of this.children.get(commitSha) as [string, ChildrenType][]) {
        const [i1, j1] = this.positions.get(childSha) as [number, number];
        const [x1, y1] = this.computeNodeCenterCoordinates(i1, j1);
        ctx.moveTo(x0, y0);
        if (type === ChildrenType.Commit) {
          if (x0 < x1) {
            ctx.lineTo(x1 - RADIUS, y0);
            ctx.quadraticCurveTo(x1, y0, x1, y0 - RADIUS);
          } else {
            ctx.lineTo(x1 + RADIUS, y0);
            ctx.quadraticCurveTo(x1, y0, x1, y0 - RADIUS);
          }
        } else {
          if (x0 < x1) {
            ctx.lineTo(x0, y1 + RADIUS);
            ctx.quadraticCurveTo(x0, y1, x0 + RADIUS, y1);
          } else {
            ctx.lineTo(x0, y1 + RADIUS);
            ctx.quadraticCurveTo(x0, y1, x0 - RADIUS, y1);
          }
        }
        ctx.lineTo(x1, y1);
      }
      ctx.stroke();
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