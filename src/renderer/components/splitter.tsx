import * as React from 'react';

export interface SplitterProps { onPanelResize: (offset: number) => void; }

export class Splitter extends React.PureComponent<SplitterProps, {}> {
  dragging: boolean; 
  anchorX: number;

  constructor(props: {}) {
    super(props);
    this.dragging = false;
    this.startDragging = this.startDragging.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.endDragging = this.endDragging.bind(this);
  }

  componentDidMount() {
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.endDragging);
  }

  componentWillUnmount() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.endDragging);
  }

  startDragging(event: React.MouseEvent<HTMLDivElement>) {
    this.dragging = true;
    this.anchorX = event.clientX;
  }

  handleMouseMove(event: MouseEvent) {
    if (this.dragging) {
      const mouseX = event.clientX;
      this.props.onPanelResize(this.anchorX - mouseX);
      this.anchorX = mouseX;
    }
  }

  endDragging() {
    this.dragging = false;
  }

  render() {
    return (
      <div className='splitter' onMouseDown={this.startDragging} />
    );
  }
}