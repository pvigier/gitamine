import * as fs from 'fs';
import * as Path from 'path';
import { Settings, Field } from './settings';

export class ThemeManager {
  theme: any;

  async updateTheme() {
    await this.loadTheme(Settings.get(Field.Theme, 'dark'));
    this.updateCssVariables();
  }

  async loadTheme(name: string) {
    const path = Path.join(__dirname, `../../../assets/themes/${name}.json`);
    const json = await new Promise<string>((resolve, reject) => {
      fs.readFile(path, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data.toString());
        }
      });
    });
   this.theme = JSON.parse(json);
  }

  updateCssVariables() {
    for (let key in this.theme.css) {
      document.body.style.setProperty(`--${key}`, this.theme.css[key]);
    }
  }

  getEditorTheme() {
    return this.theme.monaco['theme'];
  }
}