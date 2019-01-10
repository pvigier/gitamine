import * as React from 'react';

export interface IndexViewerProps { 
}

export interface IndexViewerState {
}

export class IndexViewer extends React.PureComponent<IndexViewerProps, IndexViewerState> {
  div: React.RefObject<HTMLDivElement>;

  constructor(props: IndexViewerProps) {
    super(props);
    this.div = React.createRef<HTMLDivElement>();
  }

  resize(offset: number) {
    if (this.div.current) {
      this.div.current.style.width = `${this.div.current.clientWidth + offset}px`;
    }
  }

  render() {
    return (
      <div className='commit-viewer' ref={this.div}>
        <h2>Index</h2>
      </div>
    );
  }
}