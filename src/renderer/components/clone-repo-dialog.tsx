import * as Path from 'path';
import { remote } from 'electron';
import * as React from 'react';
import { makeModal } from './make-modal';

export class CloneRepoFormProps {
  onClose: () => void;
  onCloneRepo: (url: string, path: string) => void;
}

export class CloneRepoFormState {
  repoPath: string;
  repoUrl: string;
  repoFolder: string;
}

class CloneRepoForm extends React.PureComponent<CloneRepoFormProps, CloneRepoFormState> {
  constructor(props: CloneRepoFormProps) {
    super(props);
    this.state = {
      repoPath: '',
      repoUrl: '',
      repoFolder: ''
    }
    this.handleRepoPathChange = this.handleRepoPathChange.bind(this);
    this.handleBrowseClick = this.handleBrowseClick.bind(this);
    this.handleRepoUrlChange = this.handleRepoUrlChange.bind(this);
    this.handleRepoFolderChange = this.handleRepoFolderChange.bind(this);
    this.handleCloneRepo = this.handleCloneRepo.bind(this);
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

  handleRepoUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({repoUrl: event.target.value});
  }

  handleRepoFolderChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({repoFolder: event.target.value});
  }

  handleCloneRepo() {
    if (this.isPathValid()) {
      const folderName = this.state.repoFolder || Path.parse(this.state.repoUrl).name;
      const fullPath = Path.join(this.state.repoPath, folderName);
      this.props.onCloneRepo(this.state.repoUrl, fullPath);
      this.props.onClose();
    }
  }

  isPathValid() {
    const folderName = this.state.repoFolder || Path.parse(this.state.repoUrl).name;
    return this.state.repoPath.length > 0 && this.state.repoUrl && folderName.length > 0;
  }

  render() {
    return (
      <form className='modal-form'>
        <div className='field-container'>
          <label htmlFor='path'>Where to clone to:</label>
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
          <label htmlFor='url'>URL:</label>
          <input type='text' 
            id='url' 
            name='repo-url' 
            value={this.state.repoUrl}
            onChange={this.handleRepoUrlChange} />
        </div>
        <div className='field-container'>
          <label htmlFor='folder'>Full path:</label>
          <span id='prefix'>{this.state.repoPath}{Path.sep}</span>
          <input type='text' 
            id='folder' 
            name='repo-folder' 
            placeholder={Path.parse(this.state.repoUrl).name}
            value={this.state.repoFolder}
            onChange={this.handleRepoFolderChange} />
        </div>
        <div className='button-container'>
          <button className='green-button'
            type='button' 
            disabled={!this.isPathValid()}
            onClick={this.handleCloneRepo}>
            Clone the repository
          </button>
        </div>
      </form>
    );
  }
}

export const CloneRepoDialog = makeModal(CloneRepoForm);