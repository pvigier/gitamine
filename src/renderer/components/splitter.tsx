import * as React from 'react';

export interface SplitterProps { 
  onDrag: (offset: number) => void;
}

export class Splitter extends React.PureComponent<SplitterProps, {}> {
  dragging: boolean; 
  div: React.RefObject<HTMLDivElement>;

  constructor(props: SplitterProps) {
    super(props);
    this.dragging = false;
    this.div = React.createRef();
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
    document.documentElement.style.cursor = 'col-resize';
    document.documentElement.style.userSelect = 'none';
  }

  handleMouseMove(event: MouseEvent) {
    if (this.dragging && this.div.current) {
      const mouseX = event.clientX;
      const rect = this.div.current.getBoundingClientRect();
      this.props.onDrag(mouseX - rect.left);
    }
  }

  endDragging() {
    this.dragging = false;
    document.documentElement.style.removeProperty('cursor')
    document.documentElement.style.removeProperty('user-select');
  }

  render() {
    return (
      <div className='splitter' onMouseDown={this.startDragging} ref={this.div}/>
    );
  }
}