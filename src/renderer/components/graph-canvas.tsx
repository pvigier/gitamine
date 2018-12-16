import * as React from 'react';
import * as Git from 'nodegit';

export interface GraphCanvasProps { commits: Git.Commit[]; }

export class GraphCanvas extends React.Component<GraphCanvasProps, {}> {
  canvas: HTMLCanvasElement | null;
  positions: Map<Git.Commit, [number, number]>
  width: number;
  height: number;
  setCanvasRef: (element: HTMLCanvasElement) => void;

  constructor(props: GraphCanvasProps) {
    super(props);
    this.canvas = null;
    this.positions = new Map<Git.Commit, [number, number]>();
    this.width = 0;
    this.height = 0;

    this.setCanvasRef = (element: HTMLCanvasElement) => {
      this.canvas = element;
    }
  }

  componentDidUpdate() {
    this.computePositions();
    this.drawGraph();
  }

  computePositions() {
    let i = 0;
    for (let commit of this.props.commits) {
      this.positions.set(commit, [i, 0]);
      ++i;
    }
    this.width = 22;
    this.height = this.props.commits.length * 28;
  }

  drawGraph() {
    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        this.drawNodes(ctx);
      }
    }
  }

  drawNodes(ctx: CanvasRenderingContext2D) {
    for (let [commit, [i, j]] of this.positions) {
      ctx.fillStyle = 'green';
      ctx.beginPath();
      ctx.arc(j * 22 + 11, 3 + i * 28 + 11, 11, 0, Math.PI * 2, true);
      ctx.fill();
    }
  }

  render() {
    return (
      <canvas ref={this.setCanvasRef} />
    );
  }
}