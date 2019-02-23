import { remote } from 'electron';
import { RepoState } from './repo-state';

export function createStashContextMenu(repo: RepoState, stashIndex: number) {
  const template: Electron.MenuItemConstructorOptions[] = [];
  template.push(
    {
      label: 'Apply stash',
      click: () => repo.applyStash(stashIndex)
    },
    {
      label: 'Pop stash',
      click: () => repo.popStash(stashIndex)
    },
    {
      label: 'Drop stash',
      click: () => repo.dropStash(stashIndex)
    },
  );
  return remote.Menu.buildFromTemplate(template);
}