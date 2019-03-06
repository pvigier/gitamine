import { remote, clipboard } from 'electron';
import * as Git from 'nodegit';
import { RepoState } from './repo-state';
import { InputDialogHandler } from '../components/input-dialog';

function createBranchContextMenu(repo: RepoState, 
  reference: Git.Reference, 
  currentBranch: boolean, 
  onOpenInputDialog: InputDialogHandler) {
  function openRenameBranchDialog() {
    onOpenInputDialog('Name', 'Rename', (value) => repo.renameReference(reference, value), shortName);
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
      label: 'Copy branch name to clipboard',
      click: () => clipboard.writeText(shortName)
    }
  ];
  return remote.Menu.buildFromTemplate(template);
}

function createRemoteBranchContextMenu(repo: RepoState,
  reference: Git.Reference, 
  onOpenInputDialog: InputDialogHandler) {
  function openRenameBranchDialog() {
    onOpenInputDialog('Name', 'Rename', (value) => repo.renameReference(reference, value), shortName);
  }

  const shortName = reference.shorthand();
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: `Checkout to ${shortName}`,
      click: () => repo.checkoutReference(reference),
    },
    {
      label: `Rename ${shortName}`,
      click: openRenameBranchDialog,
    },
    {
      label: `Remove ${shortName}`,
      click: () => repo.removeRemoteReference(reference),
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

function createTagContextMenu(repo: RepoState, 
  reference: Git.Reference, 
  onOpenInputDialog: InputDialogHandler) {
  function openRenameTagDialog() {
    onOpenInputDialog('Name', 'Rename', (value) => repo.renameReference(reference, value), shortName);
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

export function createReferenceContextMenu(repo: RepoState, 
  reference: Git.Reference, 
  currentBranch: boolean, 
  onOpenInputDialog: InputDialogHandler) {
  if (reference.isTag()) {
    return createTagContextMenu(repo, reference, onOpenInputDialog);
  } else if (reference.isRemote()) {
    return createRemoteBranchContextMenu(repo, reference, onOpenInputDialog);
  } else {
    return createBranchContextMenu(repo, reference, currentBranch, onOpenInputDialog);
  }
}