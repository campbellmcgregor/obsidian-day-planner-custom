import type { Moment } from "moment/moment";
import {
  FileView,
  MarkdownView,
  normalizePath,
  TFile,
  Workspace,
  WorkspaceLeaf,
} from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
} from "obsidian-daily-notes-interface";
import { isInstanceOf, isNotVoid } from "typed-assert";

import type { RemoteTask } from "../task-types";
import type { VaultFacade } from "./vault-facade";

function doesLeafContainFile(leaf: WorkspaceLeaf, file: TFile) {
  const { view } = leaf;

  return view instanceof FileView && view.file === file;
}

export class WorkspaceFacade {
  constructor(
    private readonly workspace: Workspace,
    private readonly vaultFacade: VaultFacade,
  ) {}

  async openFileInEditor(file: TFile) {
    const leafWithThisFile = this.workspace
      .getLeavesOfType("markdown")
      .find((leaf) => doesLeafContainFile(leaf, file));

    if (leafWithThisFile) {
      this.workspace.setActiveLeaf(leafWithThisFile, { focus: true });

      if (leafWithThisFile.view instanceof MarkdownView) {
        return leafWithThisFile.view.editor;
      }
    } else {
      const newLeaf = this.workspace.getLeaf(false);

      await newLeaf.openFile(file);

      if (newLeaf.view instanceof MarkdownView) {
        return newLeaf.view.editor;
      }
    }
  }

  getLastCaretLocation = () => {
    const view = this.getActiveMarkdownView();

    const file = view.file;

    isNotVoid(file, "There is no file in view");

    const path = file.path;
    const line = view.editor.getCursor().line;

    return { path, line };
  };

  async openFileForDay(moment: Moment) {
    const dailyNote =
      getDailyNote(moment, getAllDailyNotes()) ||
      (await createDailyNote(moment));

    return this.openFileInEditor(dailyNote);
  }

  getActiveMarkdownView = () => {
    const view = this.workspace.getMostRecentLeaf()?.view;

    isInstanceOf(view, MarkdownView, "No markdown editor is active");

    return view;
  };

  async revealLineInFile(path: string, line: number) {
    const file = this.vaultFacade.getFileByPath(path);

    const editor = await this.openFileInEditor(file);

    if (!editor) {
      return;
    }

    this.workspace
      .getActiveViewOfType(MarkdownView)
      ?.setEphemeralState({ line });

    editor.setCursor({ line, ch: editor.getLine(line).length });
  }

  private sanitizeFileName(name: string): string {
    // Remove or replace invalid filesystem characters
    return name
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
      .replace(/\.$/, "")
      .trim();
  }

  private async generateUniqueFileName(baseName: string): Promise<string> {
    const sanitized = this.sanitizeFileName(baseName);
    let fileName = `${sanitized}.md`;
    let counter = 1;

    while (this.vaultFacade.checkFileExists(fileName)) {
      fileName = `${sanitized} ${counter}.md`;
      counter++;
    }

    return fileName;
  }

  async createNoteForRemoteEvent(task: RemoteTask) {
    const fileName = await this.generateUniqueFileName(task.summary);
    const normalizedPath = normalizePath(fileName);

    // Create an empty note with the event title as the filename
    const file = await this.workspace.vault.create(normalizedPath, "");
    
    // Open the note in the editor
    await this.openFileInEditor(file);
  }
}
