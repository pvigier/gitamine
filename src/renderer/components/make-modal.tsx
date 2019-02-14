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

    componentDidMount() {
      window.addEventListener('keyup', this.handleKeyUp);
    }

    componentWillUnmount() {
      window.removeEventListener('keyup', this.handleKeyUp);
    }

    handleKeyUp(event: KeyboardEvent) {
      if (event.keyCode === 27) {
        this.props.onClose();
      }
    }

    render() {
      return (
        <div className='modal-container'>
          <div className='modal-background'>
            <Component {...this.props} />
          </div>
        </div>
      );
    }
  };
}