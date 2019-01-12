import * as React from 'react';
import { RepoState, ChildrenType } from '../repo-state';
import { getBranchColor } from '../commit-graph';

const RADIUS = 11;
const OFFSET_X = 2 * RADIUS;
const OFFSET_Y = 28;

export interface GraphCanvasProps { repo: RepoState; }

export class GraphCanvas extends React.PureComponent<GraphCanvasProps, {}> {
  canvas: React.RefObject<HTMLCanvasElement>;
  offset: number;
  start: number;
  end: number;

  constructor(props: GraphCanvasProps) {
    super(props);
    this.canvas = React.createRef<HTMLCanvasElement>();
    this.offset = 0;
  }

  handleScroll(offset: number, start: number, end: number) {
    this.offset = offset;
    this.start = start;
    this.end = end;
    this.drawGraph();
  }

  handleResize(height: number, start: number, end: number) {
    if (this.canvas.current) {
      const canvas = this.canvas.current;
      if (canvas.height != height) {
        canvas.height = height;
        this.start = start;
        this.end = end;
        this.drawGraph();
      }
    } 
  }

  drawGraph() {
    if (this.canvas.current) {
      this.canvas.current.width = this.props.repo.graph.width * OFFSET_X;
      const ctx = this.canvas.current.getContext('2d');
      if (ctx) {
        this.drawEdges(ctx);
        this.drawNodes(ctx);
      }
    }
  }

  drawNodes(ctx: CanvasRenderingContext2D) {
    // Draw only visible nodes
    const positions = this.props.repo.commits.slice(Math.max(this.start, 0), this.end).map((commit) => 
      this.props.repo.graph.positions.get(commit.sha())!
    );
    for (let [i, j] of positions) {
      const [x, y] = this.computeNodeCenterCoordinates(i, j);
      ctx.fillStyle = getBranchColor(j);
      ctx.beginPath();
      ctx.arc(x, y, RADIUS, 0, 2 * Math.PI, true);
      ctx.fill();
    }
  }

  drawEdges(ctx: CanvasRenderingContext2D) {
    const repo = this.props.repo;
    const positions = repo.graph.positions;
    ctx.lineWidth = 2;
    for (let [commitSha, [i0, j0]] of positions) {
      const [x0, y0] = this.computeNodeCenterCoordinates(i0, j0);
      for (let [childSha, type] of repo.children.get(commitSha)!) {
        const [i1, j1] = positions.get(childSha)!;
        const [x1, y1] = this.computeNodeCenterCoordinates(i1, j1);
        ctx.beginPath();
        if (j0 !== j1 && type === ChildrenType.Commit) {
          ctx.strokeStyle = getBranchColor(j1);
        } else {
          ctx.strokeStyle = getBranchColor(j0);
        }
        ctx.moveTo(x0, y0);
        if (j0 !== j1) {
          if (type === ChildrenType.Commit) {
            if (x0 < x1) {
              ctx.lineTo(x1 - RADIUS, y0);
              ctx.quadraticCurveTo(x1, y0, x1, y0 - RADIUS);
            } else {
              ctx.lineTo(x1 + RADIUS, y0);
              ctx.quadraticCurveTo(x1, y0, x1, y0 - RADIUS);
            }
          } else if (type === ChildrenType.Merge) {
            if (x0 < x1) {
              ctx.lineTo(x0, y1 + RADIUS);
              ctx.quadraticCurveTo(x0, y1, x0 + RADIUS, y1);
            } else {
              ctx.lineTo(x0, y1 + RADIUS);
              ctx.quadraticCurveTo(x0, y1, x0 - RADIUS, y1);
            }
          }
        }
        //console.log(i0, i1, j0, j1, ctx.strokeStyle);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }
  }

  computeNodeCenterCoordinates(i: number, j: number) {
    return [j * OFFSET_X + RADIUS, 3 + i * OFFSET_Y + RADIUS - this.offset]
  }

  render() {
    return (
      <canvas ref={this.canvas} />
    );
  }
}