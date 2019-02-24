import * as React from 'react';
import { makeModal } from './make-modal';

export type InputDialogHandler = (label: string, button: string, onSubmit: (value: string) => void, defaultValue?: string) => void;

export class InputFormProps {
  defaultValue?: string;
  label: string;
  button: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}

export class InputFormState {
  value: string;
}

class InputForm extends React.PureComponent<InputFormProps, InputFormState> {
  constructor(props: InputFormProps) {
    super(props);
    this.state = {
      value: this.props.defaultValue || '',
    }
    this.handleValueChange = this.handleValueChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleValueChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({value: event.target.value});
  }

  async handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (this.state.value) {
      this.props.onSubmit(this.state.value);
      this.props.onClose(); 
    }
  }

  render() {
    return (
      <form className='modal-form' onSubmit={this.handleSubmit}>
        <div className='field-container'>
          <label htmlFor='value'>{this.props.label}:</label>
          <input type='text' 
            id='value' 
            value={this.state.value} 
            autoFocus={true}
            onChange={this.handleValueChange} />
        </div>
        <div className='button-container'>
          <button className='green-button' 
            type='submit' 
            disabled={!this.state.value}>
            {this.props.button}
          </button>
        </div>
      </form>
    );
  }
}

export const InputDialog = makeModal(InputForm);