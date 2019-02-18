import * as settings from 'electron-settings';

const NAMESPACE = 'gitamine';

export enum Field {
  Name = 'name',
  Email = 'email',
  RecentlyOpened = 'recentlyOpened',
  Theme = 'theme',
  FontSize = 'fontSize'
}

function getKey(field: Field) {
  return `${NAMESPACE}.${field}`;
}

export class Settings {
  static exists() {
    return settings.has(NAMESPACE);
  }
  
  static getAll() {
    return settings.get(NAMESPACE);
  }

  static setAll(values: any) {
    settings.set(NAMESPACE, values);
  }

  static get(field: Field, defaultValue?: any) {
    return settings.get(getKey(field), defaultValue);
  }

  static set(field: Field, value: any) {
    settings.set(getKey(field), value);
  }
}