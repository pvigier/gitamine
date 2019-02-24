import { remote } from 'electron';
import * as React from 'react';
import * as Git from 'nodegit';
import { RepoDashboard } from './repo-dashboard';
import { RepoState } from '../helpers/repo-state';
import { NotificationQueue } from './notification-queue';
import { WelcomeDashboard } from './welcome-dashboard';
import { NotificationType } from './notification-item';
import { CreateBranchDialog } from './create-branch-dialog';
import { CloneRepoDialog } from './clone-repo-dialog';
import { InitRepoDialog } from './init-repo-dialog';
import { PatchViewerOptions } from './patch-viewer';
import { PreferencesDialog } from './preferences-dialog';
import { Field, Settings } from '../../shared/settings';
import { ThemeManager } from '../../shared/theme-manager';
import { InputDialog } from './input-dialog';

export interface AppState {
  repos: RepoState[]; 
  editorTheme: string;
  patchViewerOptions: PatchViewerOptions;
  modalWindow: JSX.Element | null;
}

export class App extends React.PureComponent<{}, AppState> {
  notificationQueue: React.RefObject<NotificationQueue>;
  themeManager: ThemeManager;

  constructor(props: {}) {
    super(props);
    this.notificationQueue = React.createRef();
    this.themeManager = new ThemeManager();
    this.state = {
      repos: [],
      editorTheme: 'vs-light',
      patchViewerOptions: {
        fontSize: 14
      },
      modalWindow: null
    };
    this.updateTheme = this.updateTheme.bind(this);
    this.updatePatchViewer = this.updatePatchViewer.bind(this);
    this.cloneRepo = this.cloneRepo.bind(this);
    this.initRepo = this.initRepo.bind(this);
    this.openRepo = this.openRepo.bind(this);
    this.openCloneRepoDialog = this.openCloneRepoDialog.bind(this);
    this.openInitRepoDialog = this.openInitRepoDialog.bind(this);
    this.openOpenRepoDialog = this.openOpenRepoDialog.bind(this);
    this.openCreateBranchDialog = this.openCreateBranchDialog.bind(this);
    this.openInputDialog = this.openInputDialog.bind(this);
    this.showNotification = this.showNotification.bind(this);
    this.closeModalWindow = this.closeModalWindow.bind(this);
  }

  componentDidMount() {
    this.updateTheme();
    this.updatePatchViewer();
  }

  async updateTheme(name?: string) {
    await this.themeManager.loadTheme(name);
    this.themeManager.updateCssVariables();
    this.setState({
      editorTheme: this.themeManager.getEditorTheme()
    });
  }

  async updatePatchViewer(options?: PatchViewerOptions) {
    options = options || {fontSize: Settings.get(Field.FontSize)};
    this.setState({
      patchViewerOptions: options!
    });
  }

  async cloneRepo(url: string, path: string) {
    try {
      this.addRepo(await RepoState.clone(url, path));
    } catch (e) {
      this.showNotification(`Unable to clone repo: ${e.message}`, NotificationType.Error);
    }
  }

  async initRepo(path: string) {
    try {
      this.addRepo(await RepoState.init(path));
    } catch (e) {
      this.showNotification(`Unable to init repo: ${e.message}`, NotificationType.Error);
    }
  }

  async openRepo(path: string) {
    try {
      this.addRepo(await RepoState.open(path));
    } catch (e) {
      this.showNotification(`Unable to open repo: ${e.message}`, NotificationType.Error);
    }
  }

  addRepo(repo: Git.Repository) {
    const repoState = new RepoState(repo, this.showNotification);
    this.setState({
      repos: [repoState]
    });
    // Update settings
    const recentlyOpened: string[] = Settings.get(Field.RecentlyOpened, []);
    // Make sure that there is no duplicate
    const iPath = recentlyOpened.indexOf(repoState.path);
    if (iPath !== -1) {
      recentlyOpened.splice(iPath, 1);
    }
    Settings.set(Field.RecentlyOpened, [repoState.path, ...recentlyOpened.slice(0, 2)]);
  }

  closeRepo(i: number) {
    this.setState((prevState) => {
      const repos = prevState.repos.slice();
      repos.splice(i, 1);
      return {
        repos: repos
      };
    });
  }

  getCurrentRepo() {
    return this.state.repos[0];
  }

  showNotification(message: string, type: NotificationType) {
    if (this.notificationQueue.current) {
      this.notificationQueue.current.addNotification(message, type);
    }
  }

  // Modal components

  openCloneRepoDialog() {
    const element = <CloneRepoDialog onCloneRepo={this.cloneRepo} 
      onClose={this.closeModalWindow} />
    this.setState({
      modalWindow: element
    });
  }

  openInitRepoDialog() {
    const element = <InitRepoDialog onInitRepo={this.initRepo} 
      onClose={this.closeModalWindow} />
    this.setState({
      modalWindow: element
    });
  }

  openOpenRepoDialog() {
    remote.dialog.showOpenDialog(remote.getCurrentWindow(),
      {properties: ['openDirectory']}, 
      (paths) => {
        if (paths) {
          this.openRepo(paths[0]);
        }
      }
    );
  }

  openPreferencesDialog() {
    const element = <PreferencesDialog onClose={this.closeModalWindow} 
      onThemeUpdate={this.updateTheme}
      onEditorPreferencesUpdate={this.updatePatchViewer} />
    this.setState({
      modalWindow: element
    });
  }

  openCreateBranchDialog(commit: Git.Commit) {
    const element = <CreateBranchDialog repo={this.getCurrentRepo()}
      commit={commit}
      onClose={this.closeModalWindow} />;
    this.setState({
      modalWindow: element
    });
  }

  openInputDialog(label: string, button: string, onSubmit: (value: string) => void, defaultValue = '') {
    const element = <InputDialog label={label} 
      button={button} 
      defaultValue={defaultValue} 
      onSubmit={onSubmit}
      onClose={this.closeModalWindow} />
    this.setState({
      modalWindow: element
    });
  }

  closeModalWindow() {
    this.setState({
      modalWindow: null
    });
  }

  render() {
    const repoDashboards = this.state.repos.length === 0 ?
      <WelcomeDashboard onRecentlyOpenedRepoClick={this.openRepo} 
        onOpenRepo={this.openOpenRepoDialog}
        onInitRepo={this.openInitRepoDialog}
        onCloneRepo={this.openCloneRepoDialog} /> :
      this.state.repos.map((repo, i) => <RepoDashboard 
        repo={repo} 
        editorTheme={this.state.editorTheme}
        patchViewerOptions={this.state.patchViewerOptions}
        onRepoClose={() => this.closeRepo(i)}
        onCreateBranch={this.openCreateBranchDialog}
        onOpenInputDialog={this.openInputDialog}
        key={repo.path} />);
    return (
      <div id='app'>
        {repoDashboards}
        {this.state.modalWindow}
        <NotificationQueue ref={this.notificationQueue} />
      </div>
    );
  }
}
