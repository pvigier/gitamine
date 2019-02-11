import * as launch from 'launch-editor';

export function openInEditor(path: string) {
  // TODO: manage the case where no editor is available
  launch(path);
}