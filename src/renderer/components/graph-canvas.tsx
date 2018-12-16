import * as React from 'react';
import * as Git from 'nodegit';

export interface GraphCanvasProps { commits: Git.Commit[]; }

export class GraphCanvas extends React.Component<GraphCanvasProps, {}> {
  canvas: HTMLCanvasElement | null;
  setCanvasRef: (element: HTMLCanvasElement) => void;

  constructor(props: GraphCanvasProps) {
    super(props);
    this.canvas = null;

    this.setCanvasRef = (element: HTMLCanvasElement) => {
      this.canvas = element;
    }
  }

  drawGraph() {

  }

  render() {
    return (
      <canvas ref={this.setCanvasRef} />
    );
  }
}