import { remote, clipboard } from 'electron';
import { RepoState, removeReferencePrefix } from './repo-state';
import { InputDialogHandler } from '../components/input-dialog';

export function createReferenceContextMenu(repo: RepoState, 
  name: string, 
  currentBranch: boolean, 
  onOpenInputDialog: InputDialogHandler) {
  const template: Electron.MenuItemConstructorOptions[] = [];
  const shortName = removeReferencePrefix(name);

  function openRenameBranchDialog() {
    onOpenInputDialog('Name', 'Rename', (value) => repo.renameReference(name, `refs/heads/${value}`), shortName);
  }

  if (!currentBranch) {
    template.push(
      {
        label: `Checkout to ${shortName}`,
        click: () => repo.checkoutReference(name)
      },
      {
        label: `Rename ${shortName}`,
        click: openRenameBranchDialog
      },
      {
        label: `Remove ${shortName}`,
        click: () => repo.removeReference(name)
      },
    );
  } else {
    template.push(
      {
        label: `Rename ${shortName}`,
        click: openRenameBranchDialog
      }
    );
  }
  template.push(
    {
      type: 'separator'
    },
    {
      label: 'Copy branch name to clipboard',
      click: () => clipboard.writeText(name)
    }
  );
  return remote.Menu.buildFromTemplate(template);
}