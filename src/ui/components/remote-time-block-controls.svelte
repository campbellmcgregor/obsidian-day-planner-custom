<script lang="ts">
  import { type Snippet } from "svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { type RemoteTask } from "../../task-types";
  import { createRemoteTimeBlockMenu } from "../remote-time-block-menu";

  import Selectable from "./selectable.svelte";

  const {
    task,
    children,
  }: {
    task: RemoteTask;
    children: Snippet;
  } = $props();

  const {
    editContext: { editOperation },
    workspaceFacade,
  } = getObsidianContext();
</script>

<Selectable
  onSecondarySelect={(event) =>
    createRemoteTimeBlockMenu({ event, task, workspaceFacade })}
  selectionBlocked={Boolean($editOperation)}
>
  {#snippet children(selectable)}
    <div
      use:selectable.use
      onpointerup={selectable.onpointerup}
    >
      {@render children()}
    </div>
  {/snippet}
</Selectable>