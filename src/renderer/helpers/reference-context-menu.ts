import { remote, clipboard } from 'electron';
import * as Git from 'nodegit';
import { RepoState } from './repo-state';
import { InputDialogHandler } from '../components/input-dialog';

export function createReferenceContextMenu(repo: RepoState, 
  reference: Git.Reference, 
  currentBranch: boolean, 
  onOpenInputDialog: InputDialogHandler) {
  const template: Electron.MenuItemConstructorOptions[] = [];
  const shortName = reference.shorthand();

  function openRenameBranchDialog() {
    onOpenInputDialog('Name', 'Rename', (value) => repo.renameReference(reference, value), shortName);
  }

  if (!currentBranch) {
    template.push(
      {
        label: `Checkout to ${shortName}`,
        click: () => repo.checkoutReference(reference)
      },
      {
        label: `Rename ${shortName}`,
        click: openRenameBranchDialog
      },
      {
        label: `Remove ${shortName}`,
        click: () => repo.removeReference(reference)
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
      click: () => clipboard.writeText(reference.name())
    }
  );
  return remote.Menu.buildFromTemplate(template);
}