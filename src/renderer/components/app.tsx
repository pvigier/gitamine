import * as React from 'react';
import * as Git from 'nodegit';
import { RepoDashboard } from './repo-dashboard';
import { RepoState } from '../helpers/repo-state';
import { NotificationQueue } from './notification-queue';
import { WelcomeDashboard } from './welcome-dashboard';
import { NotificationType } from './notification-item';
import { CreateBranchDialog } from './create-branch-dialog';
import { Field, Settings } from '../../shared/settings';
import { ThemeManager } from '../../shared/theme-manager';

export interface AppState {
  repos: RepoState[]; 
  editorTheme: string;
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
      modalWindow: null
    };
    this.openRepo = this.openRepo.bind(this);
    this.openCreateBranchWindow = this.openCreateBranchWindow.bind(this);
    this.showNotification = this.showNotification.bind(this);
    this.closeModalWindow = this.closeModalWindow.bind(this);
  }

  componentDidMount() {
    this.updateTheme();
  }

  async updateTheme(name?: string) {
    await this.themeManager.loadTheme(name);
    this.themeManager.updateCssVariables();
    this.setState({
      editorTheme: this.themeManager.getEditorTheme()
    });
  }

  async cloneRepo(url: string, path: string) {
    try {
      const repo = await Git.Clone.clone(url, path);
      this.addRepo(repo);
    } catch (e) {
      this.showNotification(e.message, NotificationType.Error);
    }
  }

  async initRepo(path: string) {
    try {
      const repo = await Git.Repository.init(path, 0);
      this.addRepo(repo);
    } catch (e) {
      this.showNotification(e.message, NotificationType.Error);
    }
  }

  async openRepo(path: string) {
    try {
      const repo = await Git.Repository.open(path);
      this.addRepo(repo);
    } catch (e) {
      this.showNotification(e.message, NotificationType.Error);
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

  openCreateBranchWindow(commit: Git.Commit) {
    const element = <CreateBranchDialog repo={this.getCurrentRepo()} commit={commit} onClose={this.closeModalWindow} />;
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
      <WelcomeDashboard onRecentlyOpenedRepoClick={this.openRepo} /> :
      this.state.repos.map((repo, i) => <RepoDashboard 
        repo={repo} 
        editorTheme={this.state.editorTheme}
        onRepoClose={() => this.closeRepo(i)}
        onCreateBranch={this.openCreateBranchWindow}
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
