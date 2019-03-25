import * as React from 'react';

interface WrappedComponentProps {
  onClose: () => void;
}

type ModalComponentProps<P> = P & {title: string};

interface ComponentConstructor<P, S> {
  new(props: P): React.PureComponent<P, S>;
}

export function makeModal<P extends WrappedComponentProps, S>(Component: ComponentConstructor<P, S>) {
  return class extends React.PureComponent<ModalComponentProps<P>, S> {
    constructor(props: ModalComponentProps<P>) {
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
        <div className='modal-container' onKeyUp={this.handleKeyUp} tabIndex={-1}>
          <div className='modal-background'>
            <div className='modal-header'>
              <h2>{this.props.title}</h2>
              <button onClick={this.props.onClose}>
                X
              </button>
            </div>
            <Component {...this.props} />
          </div>
        </div>
      );
    }
  };
}