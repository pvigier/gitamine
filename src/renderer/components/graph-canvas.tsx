import * as React from 'react';
import { Repository, ChildrenType } from '../repository';

const RADIUS = 11;
const OFFSET_X = 2 * RADIUS;
const OFFSET_Y = 28;

export interface GraphCanvasProps { repo: Repository; }

export class GraphCanvas extends React.Component<GraphCanvasProps, {}> {
  canvas: HTMLCanvasElement | null;
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
      this.positions = new Map<string, [number, number]>();
      this.computePositions();
      this.drawGraph();
    }
  }

  computePositions() {
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

    const repo = this.props.repo;
    let i = 0;
    const branches: (string | null)[] = [];
    for (let commit of repo.commits) {
      let j = -1;
      const commitSha = commit.sha();
      //console.log('commit: ', commitSha, ' ', commit.date());
      const children = repo.children.get(commit.sha()) as [string, ChildrenType][];
      //console.log('children: ', children);
      // Find a commit to replace
      let commitToReplace: string | null = null;
      for (let [childSha, type] of children) {
        if (repo.parents.get(childSha)![0] === commitSha) {
          commitToReplace = childSha;
          break;
        }
      }
      // Insert the commit in the active branches
      if (commitToReplace) {
        j = branches.indexOf(commitToReplace);
        branches[j] = commitSha;
      } else {
        if (children.length > 0) {
          const [childSha, type] = children[0];
          const [iChild, jChild] = this.positions.get(childSha)!;
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
      //console.log('branches: ', branches);
      ++i;
    }
    this.width = branches.length * OFFSET_X;
    this.height = repo.commits.length * OFFSET_Y;
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
    const repo = this.props.repo;
    for (let [commitSha, [i0, j0]] of this.positions) {
      const [x0, y0] = this.computeNodeCenterCoordinates(i0, j0);
      ctx.beginPath();
      for (let [childSha, type] of repo.children.get(commitSha) as [string, ChildrenType][]) {
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