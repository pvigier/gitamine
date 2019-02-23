import { remote } from 'electron';
import { RepoState, removeReferencePrefix } from './repo-state';

export function createReferenceContextMenu(repo: RepoState, name: string, currentBranch: boolean) {
  const template: Electron.MenuItemConstructorOptions[] = [];
  const shortName = removeReferencePrefix(name);
  if (!currentBranch) {
    template.push(
      {
        label: `Checkout to ${shortName}`,
        click: () => repo.checkoutReference(name)
      },
      {
        label: `Remove ${shortName}`,
        click: () => repo.removeReference(name)
      }
    );
  }
  return remote.Menu.buildFromTemplate(template);
}