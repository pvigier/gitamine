import * as React from 'react';

interface ModalComponentProps {
  onClose: () => void
};

interface ComponentConstructor<P, S> {
  new(props: P): React.PureComponent<P, S>;
}

export function makeModal<P extends ModalComponentProps, S>(Component: ComponentConstructor<P, S>) {
  return class extends React.PureComponent<P, S> {
    constructor(props: P) {
      super(props);
      this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    handleKeyUp(event: React.KeyboardEvent<HTMLDivElement>) {
      if (event.keyCode === 27) {
        this.props.onClose();
      }
      event.nativeEvent.stopPropagation();
    }

    render() {
      return (
        <div className='modal-container' onKeyUp={this.handleKeyUp} tabIndex={-1} ref={div => div && div.focus()}>
          <button className='modal-close-button' onClick={this.props.onClose}>
            Close
          </button>
          <div className='modal-background'>
            <Component {...this.props} />
          </div>
        </div>
      );
    }
  };
}