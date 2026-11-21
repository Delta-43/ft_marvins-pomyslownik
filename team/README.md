# Team progress

Each person has one file in this folder. Update your own file as you work. Edit **only your own file**, so we never get merge conflicts.

| Person | File | Area |
|---|---|---|
| Delta | `delta.md` | Backend and platform |
| Karrie | `karrie.md` | Research and verification |
| Przemek | `przemek.md` | Frontend A |
| Philip | `philip.md` | Frontend B |
| Andrei | `andrei.md` | To be assigned |
| Alban | `alban.md` | To be assigned |

## How to update

1. Pull the latest `main`.
2. Change the status marker of your tasks: `[ ]` to do, `[~]` in progress, `[x]` done, `[!]` blocked.
3. Keep **Doing now** to one line. Add a line to **Blockers** the moment you are stuck, and say who can help.
4. Add a short entry to the **Log** with the time.
5. Commit with a message like `team: przemek F1 done` and push. Small, frequent commits are fine.

## See the overall status

```bash
python3 team/status.py
```

It counts the markers in every file and lists all blockers.

## Rules of thumb

- If a task changes the API, change `docs/api/openapi.yaml` first (see `TASKS.md`, working rules).
- If you take a task from someone else, tell them, and move it to your file.
- Never put secrets (keys, tokens, passwords) in these files or anywhere in the repository.
