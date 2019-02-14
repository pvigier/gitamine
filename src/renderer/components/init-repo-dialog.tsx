import * as Path from 'path';
import { remote } from 'electron';
import * as React from 'react';
import { makeModal } from './make-modal';

export class InitRepoFormProps {
  onClose: () => void;
  onInitRepo: (path: string) => void;
}

export class InitRepoFormState {
  repoName: string;
  repoPath: string;
  repoFolder: string;
}

class InitRepoForm extends React.PureComponent<InitRepoFormProps, InitRepoFormState> {
  constructor(props: InitRepoFormProps) {
    super(props);
    this.state = {
      repoName: '',
      repoPath: '',
      repoFolder: ''
    }
    this.handleRepoNameChange = this.handleRepoNameChange.bind(this);
    this.handleRepoPathChange = this.handleRepoPathChange.bind(this);
    this.handleBrowseClick = this.handleBrowseClick.bind(this);
    this.handleRepoFolderChange = this.handleRepoFolderChange.bind(this);
    this.handleInitRepo = this.handleInitRepo.bind(this);
  }

  handleRepoNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({repoName: event.target.value});
  }

  handleRepoPathChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({repoPath: event.target.value});
  }

  handleBrowseClick() {
    remote.dialog.showOpenDialog(remote.getCurrentWindow(), 
      {properties: ['openDirectory']}, 
      (paths) => {
        if (paths) {
          this.setState({repoPath: paths[0]});
        }
      }
    );
  }

  handleRepoFolderChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({repoFolder: event.target.value});
  }

  handleInitRepo() {
    if (this.isPathValid()) {
      const folderName = this.state.repoFolder || this.state.repoName;
      const fullPath = Path.join(this.state.repoPath, folderName);
      this.props.onInitRepo(fullPath);
      this.props.onClose();
    }
  }

  isPathValid() {
    const folderName = this.state.repoFolder || this.state.repoName;
    return this.state.repoPath.length > 0 && folderName.length > 0;
  }

  render() {
    return (
      <form className='modal-form'>
        <div className='field-container'>
          <label htmlFor='name'>Name:</label>
          <input type='text' 
            id='name' 
            name='repo-name' 
            value={this.state.repoName}
            onChange={this.handleRepoNameChange} />
        </div>
        <div className='field-container'>
          <label htmlFor='path'>Initialize in:</label>
          <input type='text' 
            id='path' 
            name='repo-path' 
            value={this.state.repoPath}
            onChange={this.handleRepoPathChange} />
          <button type='button'
            onClick={this.handleBrowseClick}>
            Browse
          </button>
        </div>
        <div className='field-container'>
          <label htmlFor='folder'>Full path:</label>
          <span id='prefix'>{this.state.repoPath}{Path.sep}</span>
          <input type='text' 
            id='folder' 
            name='repo-folder' 
            placeholder={this.state.repoName}
            value={this.state.repoFolder}
            onChange={this.handleRepoFolderChange} />
        </div>
        <div className='button-container'>
          <button className='green-button'
            type='button' 
            disabled={!this.isPathValid()}
            onClick={this.handleInitRepo}>
            Create repository
          </button>
        </div>
      </form>
    );
  }
}

export const InitRepoDialog = makeModal(InitRepoForm);