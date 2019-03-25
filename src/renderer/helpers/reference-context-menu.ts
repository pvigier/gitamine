import { remote, clipboard } from 'electron';
import * as Git from 'nodegit';
import { RepoWrapper, removeReferencePrefix } from './repo-wrapper';
import { InputDialogHandler } from '../components/input-dialog';

function createBranchContextMenu(repo: RepoWrapper, 
  reference: Git.Reference, 
  currentBranch: boolean, 
  onOpenInputDialog: InputDialogHandler) {
  function openRenameBranchDialog() {
    onOpenInputDialog('Rename branch', 'Name', 'Rename', (value) => repo.renameReference(reference, value), shortName);
  }

  const shortName = reference.shorthand();
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: `Checkout to ${shortName}`,
      click: () => repo.checkoutReference(reference),
      enabled: reference.isBranch() === 1 && !currentBranch
    },
    {
      label: `Rename ${shortName}`,
      click: openRenameBranchDialog,
      enabled: reference.isBranch() === 1 && !currentBranch
    },
    {
      label: `Remove ${shortName}`,
      click: () => repo.removeReference(reference),
      enabled: reference.isBranch() === 1 && !currentBranch
    },
    {
      type: 'separator'
    },
    {
      label: `Merge ${shortName} into ${removeReferencePrefix(repo.head!.name())}`,
      click: () => repo.merge(repo.head!.name(), reference.name()),
      enabled: reference.isBranch() === 1 && !currentBranch && repo.head !== null
    },
    {
      type: 'separator'
    },
    {
      label: 'Copy branch name to clipboard',
      click: () => clipboard.writeText(shortName)
    }
  ];
  return remote.Menu.buildFromTemplate(template);
}

function createTagContextMenu(repo: RepoWrapper, 
  reference: Git.Reference, 
  onOpenInputDialog: InputDialogHandler) {
  function openRenameTagDialog() {
    onOpenInputDialog('Rename tag', 'Name', 'Rename', (value) => repo.renameReference(reference, value), shortName);
  }

  const shortName = reference.shorthand();
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: `Rename ${shortName}`,
      click: openRenameTagDialog,
    },
    {
      label: `Remove ${shortName}`,
      click: () => repo.removeReference(reference),
    },
    {
      type: 'separator'
    },
    {
      label: 'Copy tag name to clipboard',
      click: () => clipboard.writeText(shortName)
    }
  ];
  return remote.Menu.buildFromTemplate(template);
}

export function createReferenceContextMenu(repo: RepoWrapper, 
  reference: Git.Reference, 
  currentBranch: boolean, 
  onOpenInputDialog: InputDialogHandler) {
  if (reference.isTag()) {
    return createTagContextMenu(repo, reference, onOpenInputDialog);
  } else {
    return createBranchContextMenu(repo, reference, currentBranch, onOpenInputDialog);
  }
}