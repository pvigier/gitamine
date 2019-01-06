import * as React from 'react';

export interface SplitterProps { onPanelResize: (offset: number) => void; }

export class Splitter extends React.PureComponent<SplitterProps, {}> {
  dragging: boolean; 
  anchorX: number;

  constructor(props: SplitterProps) {
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
    document.documentElement.style.cursor = 'col-resize';
    document.documentElement.style.userSelect = 'none';
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
    document.documentElement.style.removeProperty('cursor')
    document.documentElement.style.removeProperty('user-select');
  }

  render() {
    return (
      <div className='splitter' onMouseDown={this.startDragging} />
    );
  }
}