import * as Path from 'path';
import * as fs from 'fs';
import * as React from 'react';
import { makeModal } from './make-modal';
import { PatchViewerOptions } from './patch-viewer';
import { Settings, Field } from '../../shared/settings';

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
}

class Preferences extends React.PureComponent<PreferencesProps, PreferencesState> {
  settings: any;

  constructor(props: PreferencesProps) {
    super(props);
    this.settings = Settings.exists() ? Settings.getAll() : {};
    this.state = {
      section: Section.Profile,
      themes: []
    }
    this.handleThemeChange = this.handleThemeChange.bind(this);
    this.handleEditorPreferencesChange = this.handleEditorPreferencesChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.loadSettings();
    this.loadThemes();
  }

  componentWillUnmount() {
    this.saveSettings();
  }

  handleTabClick(section: Section) {
    this.setState({
      section: section
    });
  }

  handleThemeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    this.props.onThemeUpdate(event.target.selectedOptions[0].text);
  }

  handleEditorPreferencesChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.props.onEditorPreferencesUpdate({
      fontSize: Number(event.target.value)
    });
  }

  handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  loadSettings() {
    // This does not conform to React's style
    const setInputValuesFromStore = (ids: string[], keys: string[]) => {
      for (let i = 0; i < ids.length; ++i) {
        if (this.settings[keys[i]]) {
          const element = document.getElementById(ids[i]) as HTMLInputElement;
          element.value = this.settings[keys[i]];
        }
      }
    }

    setInputValuesFromStore(['name', 'email', 'font-size'], 
      [Field.Name, Field.Email, Field.FontSize]);
  }

  loadThemes() {
    const path = Path.join(__dirname, '../../../assets/themes/');
    fs.readdir(path, {withFileTypes: true}, (error, files) => {
      if (files) {
        const themes = files.filter((file) => file.endsWith('.json'))
          .map((file) => file.substr(0, file.length - 5));
        this.setState({
          themes: themes
        });
      }
    });
  }

  saveSettings() {
    // This does not conform to React's style
    function saveInputValuesInStore(ids: string[], keys: string[]) {
      const values = {};
      for (let i = 0; i < ids.length; ++i) {
        const element = document.getElementById(ids[i]) as HTMLInputElement;
        values[keys[i]] = element.value;
      }
      Settings.setAll(values);
    }

    saveInputValuesInStore(['name', 'email', 'font-size'], 
      [Field.Name, Field.Email, Field.FontSize]);
    
    const themeSelect = document.getElementById('theme') as HTMLSelectElement;
    Settings.set(Field.Theme, themeSelect.selectedOptions[0].text);
  }

  render() {
    const selectedTheme = this.settings[Field.Theme];
    const fontSize = this.settings[Field.FontSize];
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
                <input type="text" id="name" name="profile-name" autoFocus={true} />
              </div>
              <div>
                <label htmlFor="path">Email:</label>
                <input type="text" id="email" name="profile-email" />
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
                <select id="theme" defaultValue={selectedTheme} onChange={this.handleThemeChange}>
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
                <input type="number" id="font-size" name="font-size" defaultValue={fontSize} onChange={this.handleEditorPreferencesChange}/>
              </div>
            </form>
          </section>
        </main>
      </div>
    );
  }
}

export const PreferencesDialog = makeModal(Preferences);