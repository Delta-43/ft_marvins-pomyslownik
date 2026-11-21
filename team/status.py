#!/usr/bin/env python3
"""Summarise team/*.md: task markers per person and all blockers. Read-only."""
import pathlib, re

here = pathlib.Path(__file__).parent
total = {"todo": 0, "doing": 0, "done": 0, "blocked": 0}
print(f"{'Person':<10}{'todo':>6}{'doing':>7}{'done':>6}{'blocked':>9}")
blockers = []
for f in sorted(here.glob("*.md")):
    if f.name == "README.md":
        continue
    text = f.read_text(encoding="utf-8")
    mine = text.split("## Open tasks")[0]  # open tasks are not owned yet
    c = {
        "todo": len(re.findall(r"^- \[ \]", mine, re.M)),
        "doing": len(re.findall(r"^- \[~\]", mine, re.M)),
        "done": len(re.findall(r"^- \[x\]", mine, re.M | re.I)),
        "blocked": len(re.findall(r"^- \[!\]", mine, re.M)),
    }
    for k in total:
        total[k] += c[k]
    print(f"{f.stem:<10}{c['todo']:>6}{c['doing']:>7}{c['done']:>6}{c['blocked']:>9}")
    m = re.search(r"## Blockers\n(.*?)(\n## |\Z)", text, re.S)
    if m:
        lines = [l.strip() for l in m.group(1).splitlines() if l.strip() and not l.strip().startswith("_None")]
        blockers += [f"{f.stem}: {l}" for l in lines]
print(f"{'total':<10}{total['todo']:>6}{total['doing']:>7}{total['done']:>6}{total['blocked']:>9}")
print("\nBlockers:" if blockers else "\nNo blockers.")
for b in blockers:
    print(" -", b)
