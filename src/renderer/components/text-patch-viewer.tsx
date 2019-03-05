import * as React from 'react';
import * as Git from 'nodegit';
import { RepoState, PatchType } from '../helpers/repo-state'
import { openInEditor } from '../helpers/open-in-editor';
import { makeCancellable, CancellablePromise } from '../helpers/make-cancellable';

// Load Monaco

const loadMonaco = require('monaco-loader')
let monaco: any;
loadMonaco().then((m: any) => {
  monaco = m;
});

// Util

function arePatchesSimilar(lhs: Git.ConvenientPatch, rhs: Git.ConvenientPatch) {
  return lhs.oldFile().path() === rhs.oldFile().path() &&
    lhs.newFile().path() === rhs.newFile().path() &&
    lhs.status() === rhs.status()
}

// TextPatchViewer

const LINE_HEIGHT = 19; // To improve

enum ViewMode {
  Hunk,
  Inline,
  Split
}

enum Editor {
  Original,
  Modified,
  Count
}

export interface TextPatchViewerOptions {
  fontSize: number;
}

export interface TextPatchViewerProps { 
  repo: RepoState;
  patch: Git.ConvenientPatch;
  oldString: string;
  newString: string;
  type: PatchType;
  editorTheme: string;
  options: TextPatchViewerOptions;
}

export class TextPatchViewer extends React.PureComponent<TextPatchViewerProps, {}> {
  divEditor: React.RefObject<HTMLDivElement>;
  editor: any;
  viewMode: ViewMode;
  viewZoneIds: number[][];
  overlayWidgets: any[][];
  actionDisposables: any[];
  hunks: Git.ConvenientHunk[];
  lines: Git.DiffLine[];
  loadingPromise: CancellablePromise<[Git.ConvenientHunk[], Git.DiffLine[]]>; // Should change to CancellablePromise
  marginButtonsDirty: boolean;

  constructor(props: TextPatchViewerProps) {
    super(props);
    this.divEditor = React.createRef();
    this.editor = null;
    this.viewMode = ViewMode.Hunk;
    this.viewZoneIds = [[], []];
    this.overlayWidgets = [[], []];
    this.actionDisposables = [];
    this.marginButtonsDirty = false;
    this.setUpEditor = this.setUpEditor.bind(this);
    this.handleSelectedLinesDiscard = this.handleSelectedLinesDiscard.bind(this);
    this.handleSelectedLinesStage = this.handleSelectedLinesStage.bind(this);
    this.handleSelectedLinesUnstage = this.handleSelectedLinesUnstage.bind(this);
    this.handleFileDiscard = this.handleFileDiscard.bind(this);
    this.handleFileStage = this.handleFileStage.bind(this);
    this.handleFileUnstage = this.handleFileUnstage.bind(this);
    this.handleOpenInEditor = this.handleOpenInEditor.bind(this);
  }

  componentDidMount() {
    this.setUpEditor();
  }

  componentDidUpdate(prevProps: TextPatchViewerProps) {
    // Only load if the patch has changed
    if (this.props.patch !== prevProps.patch) {
      const scrollTop = arePatchesSimilar(prevProps.patch, this.props.patch) ? 
        this.editor.getModifiedEditor().getScrollTop() :
        0;
      this.loadAndUpdate(scrollTop);
    } else if (this.props.type !== prevProps.type) {
      this.updateEditor(this.editor.getModifiedEditor().getScrollTop());
    }
    if (this.props.editorTheme !== prevProps.editorTheme) {
      monaco.editor.setTheme(this.props.editorTheme); 
    }
    if (this.props.options !== prevProps.options) {
      this.editor.updateOptions(this.props.options);
    }
  }

  componentWillUnmount() {
    if (this.loadingPromise) {
      this.loadingPromise.cancel();
    }
    this.editor.dispose();
  }

  handleViewModeChange(viewMode: ViewMode) {
    if (viewMode !== this.viewMode) {
      this.viewMode = viewMode;
      if (this.editor) {
        this.updateEditor(0);
      }
    }
  }

  async handleSelectedLinesDiscard(editor: any) {
    this.props.repo.discardLines(this.props.patch, await this.getSelectedLines(editor));
  }

  async handleSelectedLinesStage(editor: any) {
    this.props.repo.stageLines(this.props.patch, await this.getSelectedLines(editor));
  }

  async handleSelectedLinesUnstage(editor: any) {
    this.props.repo.unstageLines(this.props.patch, await this.getSelectedLines(editor));
  }

  handleFileDiscard() {
    this.props.repo.discardPatch(this.props.patch);
  }

  handleFileStage() {
    this.props.repo.stagePatch(this.props.patch);
  }

  handleFileUnstage() {
    this.props.repo.unstagePatch(this.props.patch);
  }

  handleOpenInEditor() {
    openInEditor(this.props.patch.newFile().path());
  }

  handleMarginButtonClick(i: number, editor: Editor) {
    let line: Git.DiffLine | undefined;
    if (editor === Editor.Original) {
      line = this.lines.find((line) => line.oldLineno() === i);
    } else if (editor === Editor.Modified) {
      line = this.lines.find((line) => line.newLineno() === i);
    }
    if (line) {
      if (this.props.type === PatchType.Unstaged) {
        this.props.repo.stageLines(this.props.patch, [line]);
      } else if (this.props.type === PatchType.Staged) {
        this.props.repo.unstageLines(this.props.patch, [line]);
      }
    }
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
        renderSideBySide: false,
        readOnly: true,
        ...this.props.options
      }
      this.editor = monaco.editor.createDiffEditor(this.divEditor.current, options)
      this.editor.onDidUpdateDiff(() => this.updateMarginButtons());
      this.loadAndUpdate(0);
    }
  }

  async loadAndUpdate(scrollTop: number) {
    this.hide();
    await this.loadData();
    try {
      const [hunks, lines] = await this.loadingPromise.promise;
      this.hunks = hunks;
      this.lines = lines;
      if (this.editor) {
        await this.updateEditor(scrollTop);
      }
    } catch (e) {
    }
  }

  loadData() {
    if (this.loadingPromise) {
      this.loadingPromise.cancel();
    }
    this.loadingPromise = makeCancellable((async () => {
      // Load hunks
      const hunks = await this.props.patch.hunks();
      // Load lines
      const lines = (await Promise.all(hunks.map((hunk) => hunk.lines())))
        .reduce((acc, value) => acc.concat(value), []);
      return [hunks, lines] as [Git.ConvenientHunk[], Git.DiffLine[]];
    })());
  }

  async updateEditor(scrollTop: number) {
    // Hide
    this.hide();
    // Update editor options
    this.editor.updateOptions({
      renderSideBySide: this.viewMode === ViewMode.Split
    });
    // Reset editor
    this.resetEditor();
    // Update models
    this.setModels();
    if (this.viewMode === ViewMode.Hunk && this.hunks.length > 0) {
      await this.customizeHunkView(); 
    }
    // Scroll
    this.editor.getModifiedEditor().setScrollTop(scrollTop);
    // Show
    this.show();
  }

  resetEditor() {
    // Reset view zones
    const editors = [this.editor.getOriginalEditor(), this.editor.getModifiedEditor()];
    for (let i = 0; i < Editor.Count; ++i) {
      const editor = editors[i];
      editor.changeViewZones((changeAccessor: any) => {
        for (let viewZoneId of this.viewZoneIds[i]) {
          changeAccessor.removeZone(viewZoneId);
        }
      });
      this.viewZoneIds[i] = [];
      // Reset overlay widgets
      for (let overlayWidget of this.overlayWidgets[i]) {
        editor.removeOverlayWidget(overlayWidget);
      }
      this.overlayWidgets[i] = [];
    }
    // Reset context menu
    for (let actionDisposable of this.actionDisposables) {
      actionDisposable.dispose();
    }
    this.actionDisposables = [];
    // Reset margin buttons
    this.marginButtonsDirty = true;
  }

  setModels() {
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
    
    const patch = this.props.patch;
    console.log(this.props.oldString);
    const originalModel = updateOrCreateModel('a', patch.oldFile().path(), this.props.oldString);
    const modifiedModel = updateOrCreateModel('b', patch.newFile().path(), this.props.newString);
    this.editor.setModel({
      original: originalModel, 
      modified: modifiedModel
    });
  }

  customizeHunkView() {
    return new Promise<void>((resolve) => {
      // We must wait the the editor has finished to add the hunk widgets
      // before hiding areas otherwise there are problems with line numbers.
      // However there are no simple ways to know that the editor has finished
      // updating. Here, we hide areas when the editor has not updated since 200ms.
      let isSetHiddenAreasScheduled = false;
      let lastUpdate: number;

      const startScheduling = () => {
        lastUpdate = Date.now();
        if (!isSetHiddenAreasScheduled) {
          isSetHiddenAreasScheduled = true;
          scheduleSetHiddenAreas();
        }
      }
      const scheduleSetHiddenAreas = () => {
        if (Date.now() - lastUpdate < 200) {
          setTimeout(scheduleSetHiddenAreas, 50);
        } else {
          // Remove listeners
          listenerDisposables.forEach((listenerDisposable) => listenerDisposable.dispose());
          // Set hidden areas
          this.setHiddenAreas();
          resolve();
        }
      }

      // Listen to onDidChangeModelDecorations events
      // Apparently, the original editor is always updated first
      // so one listener should be sufficient
      const listenerDisposables = [
        this.editor.getOriginalEditor().onDidChangeModelDecorations(startScheduling),
        this.editor.getModifiedEditor().onDidChangeModelDecorations(startScheduling),
      ];
      // Add hunk widgets
      this.createHunkWidgets();
      // Customize context menu
      this.setContextMenu(this.editor.getModifiedEditor());
    });
  }

  createHunkWidgets() {
    // Create widgets
    const overlayWidgets: any[] = [];
    for (let i = 0; i < this.hunks.length; ++i) { 
      const hunk = this.hunks[i];
      const id = `hunk.${this.overlayWidgets[Editor.Modified].length}`;
      const repo = this.props.repo;
      const patch = this.props.patch;

      const overlayNode = document.createElement('div');
      overlayNode.classList.add('hunk-widget');

      const contentNode = document.createElement('div');
      const textNode = document.createElement('p');
      textNode.textContent = `@@ -${hunk.oldStart()},${hunk.oldLines()} +${hunk.newStart()},${hunk.newLines()}`;
      contentNode.appendChild(textNode);
      if (this.props.type === PatchType.Unstaged) {
        const buttonsNode = document.createElement('div');
        // Discard button
        const discardButton = document.createElement('button');
        discardButton.textContent = 'Discard';
        discardButton.className = 'red-button';
        discardButton.addEventListener('click', repo.discardHunk.bind(repo, patch, hunk));
        buttonsNode.appendChild(discardButton);
        // Stage button
        const stageButton = document.createElement('button');
        stageButton.className = 'green-button';
        stageButton.textContent = 'Stage';
        stageButton.addEventListener('click', repo.stageHunk.bind(repo, patch, hunk));
        buttonsNode.appendChild(stageButton);
        contentNode.appendChild(buttonsNode);
      } else if (this.props.type === PatchType.Staged) {
        const buttonsNode = document.createElement('div');
        // Unstage button
        const unstageButton = document.createElement('button');
        unstageButton.className = 'red-button';
        unstageButton.textContent = 'Unstage';
        unstageButton.addEventListener('click', repo.unstageHunk.bind(repo, patch, hunk));
        buttonsNode.appendChild(unstageButton);
        contentNode.appendChild(buttonsNode);
      }
      overlayNode.appendChild(contentNode);

      overlayWidgets.push({
        getId: () => id,
        getDomNode: () => overlayNode,
        getPosition: () => null
      });
      this.overlayWidgets[Editor.Modified].push(overlayWidgets[overlayWidgets.length - 1]);
    }
    // Add the widgets (we batch the calls)
    const editors = [this.editor.getOriginalEditor(), this.editor.getModifiedEditor()];
    editors[Editor.Modified].changeViewZones((changeAccessor: any) => {
      for (let i = 0; i < this.hunks.length; ++i) {
        const overlayWidget = overlayWidgets[i];
        editors[Editor.Modified].addOverlayWidget(overlayWidget);

        // Used only to compute the position.
        this.viewZoneIds[Editor.Modified].push(changeAccessor.addZone({
          afterLineNumber: i === 0 ? 0 : this.hunks[i].newStart() - 1,
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

  setHiddenAreas() {
    function createRange(start: number, end: number) {
      return {
        startLineNumber: start,
        endLineNumber: end 
      }
    }

    // Compute hidden areas
    let oldStart = 1;
    const oldHiddenAreas = [];
    let newStart = 1;
    const newHiddenAreas = [];
    for (let hunk of this.hunks) {
      if (hunk.oldStart() - 1 >= oldStart) {
        oldHiddenAreas.push(createRange(oldStart, hunk.oldStart() - 1));
      }
      oldStart = hunk.oldStart() + hunk.oldLines();
      if (hunk.newStart() - 1 >= newStart) {
        newHiddenAreas.push(createRange(newStart, hunk.newStart() - 1));
      }
      newStart = hunk.newStart() + hunk.newLines();
    }
    if (oldStart <= this.props.oldString.split('\n').length) {
      oldHiddenAreas.push(createRange(oldStart, Infinity));
    }
    if (newStart <= this.props.newString.split('\n').length) {
      newHiddenAreas.push(createRange(newStart, Infinity));
    }
    // Hide areas
    this.editor.getOriginalEditor().setHiddenAreas(oldHiddenAreas);
    this.editor.getModifiedEditor().setHiddenAreas(newHiddenAreas);
  }

  setContextMenu(editor: any) {
    if (this.props.type === PatchType.Unstaged) {
      this.actionDisposables.push(
        editor.addAction({
          id: 'discard-selected-lines',
          label: 'Discard selected lines',
          contextMenuGroupId: '1_modification',
          run: this.handleSelectedLinesDiscard
        }),
        editor.addAction({
          id: 'stage-selected-lines',
          label: 'Stage selected lines',
          contextMenuGroupId: '1_modification',
          run: this.handleSelectedLinesStage
        })
      );
    }
    else if (this.props.type === PatchType.Staged) {
      this.actionDisposables.push(editor.addAction({
        id: 'unstage-selected-lines',
        label: 'Unstage selected lines',
        contextMenuGroupId: '1_modification',
        run: this.handleSelectedLinesUnstage
      }));
    }
  } 

  updateMarginButtons() {
    if (this.marginButtonsDirty && this.props.type !== PatchType.Committed && this.viewMode === ViewMode.Hunk) {
      this.createMarginButtons()
      this.marginButtonsDirty = false;
    }
  }
  
  createMarginButtons() {
    const className = this.props.type === PatchType.Unstaged ? 'stage-line-button' : 'unstage-line-button';
    const editors = [this.editor.getOriginalEditor(), this.editor.getModifiedEditor()];

    const createMarginButton = (iEditor: Editor, i: number, prefix: string) => {
      // Create an overlay widget
      const overlayNode = document.createElement('div');
      overlayNode.addEventListener('mousedown', this.handleMarginButtonClick.bind(this, i, iEditor));
      overlayNode.classList.add(className, 'tooltip-right');
      const tooltipNode = document.createElement('span');
      tooltipNode.classList.add('tooltip-text');
      tooltipNode.textContent = this.props.type === PatchType.Unstaged ? 'Stage this line' : 'Unstage this line';
      overlayNode.appendChild(tooltipNode);
      const overlayWidget = {
        getId: () => `${prefix}-${i}`,
        getDomNode: () => overlayNode,
        getPosition: () => null
      };
      editors[Editor.Modified].addOverlayWidget(overlayWidget);
      this.overlayWidgets[Editor.Modified].push(overlayWidget);
      // Create a view zone to compute the position
      editors[iEditor].changeViewZones((changeAccessor: any) => {
        this.viewZoneIds[iEditor].push(changeAccessor.addZone({
          afterLineNumber: i,
          heightInLines: 0,
          domNode: document.createElement('div'),
          onDomNodeTop: (top: number) => {
            overlayNode.style.top = top - LINE_HEIGHT + "px";
          }
        }));
      });
    }

    for (let line of this.editor.getLineChanges()) {
      for (let i = line.originalStartLineNumber; i <= line.originalEndLineNumber; ++i) {
        createMarginButton(Editor.Original, i, 'old');
      }
      for (let i = line.modifiedStartLineNumber; i <= line.modifiedEndLineNumber; ++i) {
        createMarginButton(Editor.Modified, i, 'new');
      }
    }
  }

  async getSelectedLines(editor: any) {
    const selection = editor.getSelection();
    const start = this.lines.findIndex((line) => line.newLineno() === selection.startLineNumber);
    const end = this.lines.findIndex((line) => line.newLineno() === selection.endLineNumber);
    const selectedLines = this.lines.slice(start, end + 1);
    return selectedLines;
  }

  render() {
    const rightButtons = [];
    if (this.props.type === PatchType.Unstaged) {
      rightButtons.push(
        <button className='red-button' onClick={this.handleFileDiscard} key='discard'>Discard file</button>,
        <button className='green-button' onClick={this.handleFileStage} key='stage'>Stage file</button>
      );
    } else if (this.props.type === PatchType.Staged) {
      rightButtons.push(
        <button className='red-button' onClick={this.handleFileUnstage} key='unstage'>Unstage file</button>
      );
    }
    return (
      <>
        <div className="patch-toolbar">
          <div>
            <button onClick={this.handleOpenInEditor}>Open in editor</button>
          </div>
          <div className="view-mode-selector">
            <input type="radio" id="hunk-mode" name="view-mode-selector" 
              defaultChecked={this.viewMode === ViewMode.Hunk}
              onInput={this.handleViewModeChange.bind(this, ViewMode.Hunk)} />
            <label htmlFor="hunk-mode">Hunk</label >
            <input type="radio" id="inline-mode" name="view-mode-selector" 
              defaultChecked={this.viewMode === ViewMode.Inline}
              onInput={this.handleViewModeChange.bind(this, ViewMode.Inline)} />
            <label htmlFor="inline-mode">Inline</label>
            <input type="radio" id="split-mode" name="view-mode-selector"
              defaultChecked={this.viewMode === ViewMode.Split}
              onInput={this.handleViewModeChange.bind(this, ViewMode.Split)} />
            <label htmlFor="split-mode">Split</label>
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