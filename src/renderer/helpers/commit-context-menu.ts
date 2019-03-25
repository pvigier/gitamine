import * as Git from 'nodegit';
import { remote, clipboard } from 'electron';
import { RepoWrapper, removeReferencePrefix } from './repo-wrapper';
import { InputDialogHandler } from '../components/input-dialog';

export function createCommitContextMenu(repo: RepoWrapper, 
  commit: Git.Commit, 
  onCreateBranch: (commit: Git.Commit) => void,
  onOpenInputDialog: InputDialogHandler) {
  function openCreateTagDialog() {
    onOpenInputDialog('Create tag', 'Name', 'Create tag', (value) => repo.createTag(value, commit));
  }

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Create branch here',
      click: () => onCreateBranch(commit)
    },
    {
      label: 'Cherrypick commit',
      click: () => repo.cherrypick(commit)
    },
  ];
  if (repo.head) {
    template.push(
      {
        label: `Reset ${removeReferencePrefix(repo.head.name())} to this commit`,
        submenu: [
          {
            label: 'Soft',
            click: () => repo.reset(commit, Git.Reset.TYPE.SOFT)
          },
          {
            label: 'Mixed',
            click: () => repo.reset(commit, Git.Reset.TYPE.MIXED)
          },
          {
            label: 'Hard',
            click: () => repo.reset(commit, Git.Reset.TYPE.HARD)
          }
        ]
      }
    );
  }
  template.push(
    {
      label: 'Revert commit',
      click: () => repo.revert(commit)
    },
    {
      type: 'separator'
    },
    {
      label: 'Copy commit sha to clipboard',
      click: () => clipboard.writeText(commit.sha())
    },
    {
      type: 'separator'
    },
    {
      label: 'Create tag here',
      click: openCreateTagDialog
    }
  );
  return remote.Menu.buildFromTemplate(template);
}