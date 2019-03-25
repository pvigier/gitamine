import * as React from 'react';

export interface SpinnerButtonProps { 
  value: string;
  onClick: () => Promise<void>;
}

export interface SpinnerButtonState {
  waiting: boolean;
}

export class SpinnerButton extends React.PureComponent<SpinnerButtonProps, SpinnerButtonState> {
  constructor(props: SpinnerButtonProps) {
    super(props);
    this.state = {
      waiting: false
    }
    this.handleClick = this.handleClick.bind(this);
  }

  async handleClick() {
    this.setState({waiting: true});
    await this.props.onClick();
    this.setState({waiting: false});
  }

  render() {
    return (
      <button onClick={this.handleClick}>
        {!this.state.waiting ? 
          this.props.value :
          <div className='spinner' />}
      </button>
    );
  }
}