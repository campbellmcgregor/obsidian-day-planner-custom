import { Menu } from "obsidian";

import type { RemoteTask } from "../task-types";

import type { WorkspaceFacade } from "src/service/workspace-facade";

export function createRemoteTimeBlockMenu(props: {
  event: MouseEvent | TouchEvent;
  task: RemoteTask;
  workspaceFacade: WorkspaceFacade;
}) {
  const { event, task, workspaceFacade } = props;

  const menu = new Menu();

  menu.addItem((item) => {
    item
      .setTitle("Create note")
      .setIcon("file-plus")
      .onClick(async () => {
        await workspaceFacade.createNoteForRemoteEvent(task);
      });
  });

  // Obsidian works fine with touch events, but its TypeScript definitions don't reflect that.
  // @ts-expect-error
  menu.showAtMouseEvent(event);
}