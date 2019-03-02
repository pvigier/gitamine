import * as Path from 'path';
import * as fs from 'fs';
import * as React from 'react';
import { makeModal } from './make-modal';
import { PatchViewerOptions } from './patch-viewer';
import { Settings, Field } from '../../shared/settings';
import { CancellablePromise, makeCancellable } from '../helpers/make-cancellable';

enum Section {
  Profile,
  Authentication,
  UIPreferences,
  EditorPreferences
}

export class PreferencesProps {
  onClose: () => void;
  onThemeUpdate: (theme: string) => void;
  onEditorPreferencesUpdate: (options: PatchViewerOptions) => void;
}

export class PreferencesState {
  section: Section;
  themes: string[];
  name: string;
  email: string;
  theme: string;
  fontSize: number;
}

class Preferences extends React.PureComponent<PreferencesProps, PreferencesState> {
  themesPromise: CancellablePromise<string[]>;

  constructor(props: PreferencesProps) {
    super(props);
    const settings = Settings.exists() ? Settings.getAll() : {};
    this.state = {
      section: Section.Profile,
      themes: [],
      name: settings[Field.Name] || '',
      email: settings[Field.Email] || '',
      theme: settings[Field.Theme] || 'light',
      fontSize: settings[Field.FontSize] || 14
    }
    // Maybe we should refactor that when there will be more fields
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.handleThemeChange = this.handleThemeChange.bind(this);
    this.handleFontSizeChange = this.handleFontSizeChange.bind(this);
    this.handleEditorPreferencesChange = this.handleEditorPreferencesChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.loadThemes();
  }

  componentWillUnmount() {
    this.saveSettings();
    if (this.themesPromise) {
      this.themesPromise.cancel();
    }
  }

  handleTabClick(section: Section) {
    this.setState({
      section: section
    });
  }

  handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({name: event.target.value});
  }

  handleEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({email: event.target.value});
  }

  handleThemeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const theme = event.target.selectedOptions[0].text;
    this.setState({theme: theme});
    this.props.onThemeUpdate(event.target.selectedOptions[0].text);
  }

  handleFontSizeChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({fontSize: Number(event.target.value)});
  }

  handleEditorPreferencesChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.props.onEditorPreferencesUpdate({
      fontSize: Number(event.target.value)
    });
  }

  handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  async loadThemes() {
    const path = Path.join(__dirname, '../../../assets/themes/');
    this.themesPromise = makeCancellable(new Promise<string[]>((resolve, reject) => {
      fs.readdir(path, {withFileTypes: true}, (error, files) => {
        if (files) {
          const themes = files.filter((file) => file.name.endsWith('.json'))
            .map((file) => file.name.substr(0, file.name.length - 5));
          resolve(themes);
        } else {
          reject(error);
        }
      });
    }));
    try {
      this.setState({
        themes: await this.themesPromise.promise
      });
    } catch (e) {
    }
  }

  saveSettings() {
    Settings.set(Field.Name, this.state.name);
    Settings.set(Field.Email, this.state.email);
    Settings.set(Field.Theme, this.state.theme);
    Settings.set(Field.FontSize, this.state.fontSize);
  }

  render() {
    const themeOptions = this.state.themes.map((theme) => (
      <option value={theme} key={theme}>
        {theme}
      </option>
    ));
    return (
      <div className='preferences'>
        <nav>
          <ul>
            <li className={this.state.section === Section.Profile ? 'selected' : undefined}
              onClick={() => this.handleTabClick(Section.Profile)}>
              Profile
            </li>
            <li className={this.state.section === Section.Authentication ? 'selected' : undefined}
              onClick={() => this.handleTabClick(Section.Authentication)}>
              Authentication
            </li>
            <li className={this.state.section === Section.UIPreferences ? 'selected' : undefined}
              onClick={() => this.handleTabClick(Section.UIPreferences)}>
              UI Preferences
            </li>
            <li className={this.state.section === Section.EditorPreferences ? 'selected' : undefined}
              onClick={() => this.handleTabClick(Section.EditorPreferences)}>
              Editor Preferences
            </li>
          </ul>
        </nav>
        <main>
          <section className={this.state.section === Section.Profile ? 'shown' : undefined}>
            <h1>Profile</h1>
            <form onSubmit={this.handleSubmit}>
              <div>
                <label htmlFor="name">Name:</label>
                <input type="text" 
                  id="name" 
                  name="profile-name" 
                  autoFocus={true} 
                  value={this.state.name}
                  onChange={this.handleNameChange} />
              </div>
              <div>
                <label htmlFor="path">Email:</label>
                <input type="text" 
                  id="email" 
                  name="profile-email" 
                  value={this.state.email} 
                  onChange={this.handleEmailChange} />
              </div>
            </form>
          </section>
          <section className={this.state.section === Section.Authentication ? 'shown' : undefined}>
            <h1>Authentication</h1>
            <p>The authentication uses your local SSH agent.</p>
          </section>
          <section className={this.state.section === Section.UIPreferences ? 'shown' : undefined}>
            <h1>UI Preferences</h1>
            <form onSubmit={this.handleSubmit}>
              <div>
                <label htmlFor="theme">Theme:</label>
                <select id="theme" value={this.state.theme} onChange={this.handleThemeChange}>
                  {themeOptions}
                </select>
              </div>
            </form>
          </section>
          <section className={this.state.section === Section.EditorPreferences ? 'shown' : undefined}>
            <h1>Editor Preferences</h1>
            <form onSubmit={this.handleSubmit}>
              <div>
                <label htmlFor="font-size">Font size:</label>
                <input type="number" 
                  id="font-size" 
                  name="font-size" 
                  value={this.state.fontSize}
                  onChange={this.handleFontSizeChange}/>
              </div>
            </form>
          </section>
        </main>
      </div>
    );
  }
}

export const PreferencesDialog = makeModal(Preferences);