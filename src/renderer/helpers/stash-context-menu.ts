import { remote } from 'electron';
import { RepoWrapper } from './repo-wrapper';

export function createStashContextMenu(repo: RepoWrapper, stashIndex: number) {
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