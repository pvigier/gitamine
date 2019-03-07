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
  }

  componentDidMount() {
    this.conflicts = findConflictHunks(this.props.content.toString());
    console.log(this.conflicts);
    this.setUpEditor();
  }

  componentDidUpdate(prevProps: ConflictViewerProps) {
    // Only load if the patch has changed
    if (this.props.patch !== prevProps.patch) {
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

  async updateEditor(scrollTop: number) {
    // Hide
    this.hide();
    // Reset editor
    this.resetEditor();
    // Update models
    this.setModel();
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

  setModel() {
    // Can be shared
    function updateOrCreateModel(prefix: string, path: string, value: string) {
      const uri = monaco.Uri.parse(`file://${prefix}/${path}`);
      let model = monaco.editor.getModel(uri);
      if (model) {
        model.setValue(value);
      } else {
        model = monaco.editor.createModel(value, undefined, uri);
      }
      return model;
    }
    
    const model = updateOrCreateModel('b', this.props.patch.newFile().path(), this.props.content);
    this.editor.setModel(model);
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
      currentChangeButton.addEventListener('click', () => console.log('current'));
      buttonsNode.appendChild(currentChangeButton);
      // Incoming change button
      const incomingChangeButton = document.createElement('button');
      incomingChangeButton.textContent = 'Accept incoming change';
      incomingChangeButton.addEventListener('click', () => console.log('incoming'));
      buttonsNode.appendChild(incomingChangeButton);
      // Incoming change button
      const bothChangesButton = document.createElement('button');
      bothChangesButton.textContent = 'Accept both changes';
      bothChangesButton.addEventListener('click', () => console.log('both'));
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

  render() {
    const rightButtons = [
      <button className='red-button' onClick={() => console.log('current')} key='current'>Keep current version</button>,
      <button className='green-button' onClick={() => console.log('incoming')} key='incoming'>Take incoming version</button>,
      <button className='yellow-button' onClick={() => console.log('incoming')} key='resolve'>Mark as resolved</button>
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