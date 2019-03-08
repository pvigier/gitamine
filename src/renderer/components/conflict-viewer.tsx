import * as fs from 'fs';
import * as Path from 'path';
import * as React from 'react';
import * as Git from 'nodegit';
import { RepoState } from '../helpers/repo-state'
import { openInEditor } from '../helpers/open-in-editor';
import { arePatchesSimilar } from '../helpers/patch-comparison';
import { ConflictHunk, findConflictHunks } from '../helpers/conflict-parser';

// Load Monaco

const loadMonaco = require('monaco-loader')
let monaco: any;
loadMonaco().then((m: any) => {
  monaco = m;
});

// ConflictViewer

enum Version {
  Current = 1,
  Incoming = 2,
  Both = 3
}
export interface ConflictViewerOptions {
  fontSize: number;
}

export interface ConflictViewerProps { 
  repo: RepoState;
  patch: Git.ConvenientPatch;
  content: string;
  editorTheme: string;
  options: ConflictViewerOptions;
}

export class ConflictViewer extends React.PureComponent<ConflictViewerProps, {}> {
  divEditor: React.RefObject<HTMLDivElement>;
  editor: any;
  viewZoneIds: number[];
  overlayWidgets: any[];
  decorations: string[];
  conflicts: ConflictHunk[];

  constructor(props: ConflictViewerProps) {
    super(props);
    this.divEditor = React.createRef();
    this.editor = null;
    this.viewZoneIds = [];
    this.overlayWidgets = [];
    this.decorations = [];
    this.setUpEditor = this.setUpEditor.bind(this);
    this.handleOpenInEditor = this.handleOpenInEditor.bind(this);
    this.handleResolve = this.handleResolve.bind(this);
  }

  componentDidMount() {
    this.conflicts = findConflictHunks(this.props.content.toString());
    console.log(this.conflicts);
    this.setUpEditor();
  }

  componentDidUpdate(prevProps: ConflictViewerProps) {
    // Only load if the patch has changed
    if (this.props.patch !== prevProps.patch || this.props.content !== prevProps.content) {
      const scrollTop = arePatchesSimilar(prevProps.patch, this.props.patch) ? this.editor.getScrollTop() : 0;
      this.conflicts = findConflictHunks(this.props.content.toString());
      console.log(this.conflicts);
      this.updateEditor(scrollTop);
    }
    if (this.props.editorTheme !== prevProps.editorTheme) {
      monaco.editor.setTheme(this.props.editorTheme); 
    }
    if (this.props.options !== prevProps.options) {
      this.editor.updateOptions(this.props.options);
    }
  }

  componentWillUnmount() {
    if (this.editor) {
      this.editor.dispose();
    }
  }

  handleOpenInEditor() {
    openInEditor(this.props.patch.newFile().path());
  }

  handleResolve() {
    this.props.repo.stagePatch(this.props.patch);
  }

  hide() {
    if (this.divEditor.current) {
      this.divEditor.current.classList.add('hidden');
    }
  }

  show() {
    if (this.divEditor.current) {
      this.divEditor.current.classList.remove('hidden');
    }
  }

  setUpEditor() {
    if (this.divEditor.current) {
      const options = {
        theme: this.props.editorTheme,
        automaticLayout: true,
        readOnly: true,
        minimap: {
          enabled: false
        },
        ...this.props.options
      }
      this.editor = monaco.editor.create(this.divEditor.current, options)
      this.updateEditor(0);
    }
  }

  updateEditor(scrollTop: number) {
    // Hide
    this.hide();
    // Reset editor
    this.resetEditor();
    // Update models
    this.editor.setValue(this.props.content);
    this.createConflictWidgets(); 
    // Scroll
    this.editor.setScrollTop(scrollTop);
    // Show
    this.show();
  }

  resetEditor() {
    // Reset view zones
    this.editor.changeViewZones((changeAccessor: any) => {
      for (let viewZoneId of this.viewZoneIds) {
        changeAccessor.removeZone(viewZoneId);
      }
    });
    this.viewZoneIds = [];
    // Reset overlay widgets
    for (let overlayWidget of this.overlayWidgets) {
      this.editor.removeOverlayWidget(overlayWidget);
    }
    this.overlayWidgets = [];
  }

  createConflictWidgets() {
    // Add decorations
    const decorations: any[] = [];
    for (let i = 0; i < this.conflicts.length; ++i) {
      const conflict = this.conflicts[i];
      decorations.push({
        range: new monaco.Range(conflict.start, 1, conflict.start, 1),
        options: {
          isWholeLine: true,
          className: 'conflict-start'
        }
      });
      const currentEnd = (conflict.ancestors.length > 0 ? conflict.ancestors[0] : conflict.separator) - 1;
      if (conflict.start + 1 <= currentEnd) {
        decorations.push({
          range: new monaco.Range(conflict.start + 1, 1, currentEnd, 1),
          options: {
            isWholeLine: true,
            className: 'conflict-current'
          }
        });
      }
      if (conflict.separator + 1 <= conflict.end - 1) {
        decorations.push({
          range: new monaco.Range(conflict.separator + 1, 1, conflict.end - 1, 1),
          options: {
            isWholeLine: true,
            className: 'conflict-incoming'
          }
        });
      }
      decorations.push({
        range: new monaco.Range(conflict.end, 1, conflict.end, 1),
        options: {
          isWholeLine: true,
          className: 'conflict-end'
        }
      });
    }
    this.decorations= this.editor.deltaDecorations(this.decorations, decorations);
    // Create widgets
    const overlayWidgets: any[] = [];
    for (let i = 0; i < this.conflicts.length; ++i) { 
      const id = `conflict.${this.overlayWidgets.length}`;
      const overlayNode = document.createElement('div');
      overlayNode.classList.add('conflict-widget');

      const contentNode = document.createElement('div');
      const textNode = document.createElement('p');
      textNode.textContent = `Conflict`;
      contentNode.appendChild(textNode);

      const buttonsNode = document.createElement('div');
      // Current change button
      const currentChangeButton = document.createElement('button');
      currentChangeButton.textContent = 'Accept current change';
      currentChangeButton.addEventListener('click', () => this.acceptChange(this.conflicts[i], Version.Current));
      buttonsNode.appendChild(currentChangeButton);
      // Incoming change button
      const incomingChangeButton = document.createElement('button');
      incomingChangeButton.textContent = 'Accept incoming change';
      incomingChangeButton.addEventListener('click', () => this.acceptChange(this.conflicts[i], Version.Incoming));
      buttonsNode.appendChild(incomingChangeButton);
      // Incoming change button
      const bothChangesButton = document.createElement('button');
      bothChangesButton.textContent = 'Accept both changes';
      bothChangesButton.addEventListener('click', () => this.acceptChange(this.conflicts[i], Version.Both));
      buttonsNode.appendChild(bothChangesButton);

      contentNode.appendChild(buttonsNode);
      overlayNode.appendChild(contentNode);
      overlayWidgets.push({
        getId: () => id,
        getDomNode: () => overlayNode,
        getPosition: () => null
      });
      this.overlayWidgets.push(overlayWidgets[overlayWidgets.length - 1]);
    }
    // Add the widgets (we batch the calls)
    this.editor.changeViewZones((changeAccessor: any) => {
      for (let i = 0; i < this.conflicts.length; ++i) {
        const overlayWidget = overlayWidgets[i];
        this.editor.addOverlayWidget(overlayWidget);

        // Used only to compute the position.
        this.viewZoneIds.push(changeAccessor.addZone({
          afterLineNumber: this.conflicts[i].start - 1,
          heightInLines: 2,
          domNode: document.createElement('div'),
          onDomNodeTop: (top: number) => {
            overlayWidget.getDomNode().style.top = top + "px";
          },
          onComputedHeight: (height: number) => {
            overlayWidget.getDomNode().style.height = height + "px";
          }
        }));
      }
    });
  }

  removeLines(linesToRemove: Set<number>) {
    const lines = this.props.content.split('\n');
    const value = lines.filter((line, i) => !linesToRemove.has(i + 1)).join('\n');
    const path = Path.join(this.props.repo.repo.workdir(), this.props.patch.newFile().path());
    return new Promise((resolve, reject) => {
      fs.writeFile(path, value, (error) => {
        if (!error) {
          resolve();
        } else {
          reject(error);
        }
      });
    });
  }

  addConflictChange(linesToRemove: Set<number>, conflict: ConflictHunk, version: Version) {
    function addRange(start: number, end: number) {
      for (let i = start; i < end; ++i) {
        linesToRemove.add(i);
      }
    }
    
    // Start line
    linesToRemove.add(conflict.start);
    // Incoming changes
    const currentEnd = conflict.ancestors.length > 0 ? conflict.ancestors[0] : conflict.separator;
    if ((version & Version.Current) === 0) {
      addRange(conflict.start + 1, currentEnd);
    }
    // Ancestors and separator
    addRange(currentEnd, conflict.separator + 1);
    // Current changes
    if ((version & Version.Incoming) === 0) {
      addRange(conflict.separator + 1, conflict.end);
    }
    // End line
    linesToRemove.add(conflict.end);
  }

  acceptChange(conflict: ConflictHunk, version: Version) {
    const linesToRemove = new Set<number>();
    this.addConflictChange(linesToRemove, conflict, version);
    this.removeLines(linesToRemove);
  }

  render() {
    const rightButtons = [
      <button className='red-button' onClick={() => console.log('current')} key='current'>Keep current version</button>,
      <button className='green-button' onClick={() => console.log('incoming')} key='incoming'>Take incoming version</button>,
      <button className='yellow-button' onClick={this.handleResolve} key='resolve'>Mark as resolved</button>
    ];
    return (
      <>
        <div className="patch-toolbar">
          <div>
            <button onClick={this.handleOpenInEditor}>Open in editor</button>
          </div>
          <div>
            {rightButtons}
          </div>
        </div>
        <div className='patch-editor' ref={this.divEditor} />
      </>
    );
  }
}