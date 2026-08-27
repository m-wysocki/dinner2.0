## Agent skills

### Issue tracker

Issues and specs live as Markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository with a root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.

### Branching

Work on a dedicated feature branch per task. Name it after the ticket: `NN-slug` (e.g. `04-user-registration`), branching from `main`. Merge back to `main` only when the task is finished and its work is committed.
