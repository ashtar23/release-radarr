# Codex Prompt Playbook

These prompts are reusable workflows when working with Codex on this repo.

---

## Repo Audit

Goal:
Audit this repository and compare it against the documented architecture.

Context:
Use AGENTS.md and docs/ as the intended source of truth.

Constraints:

- do not implement features
- do not add dependencies
- inspect current structure and scripts only

Output:

1. current repo map
2. mismatches with docs
3. smallest structural improvements
4. recommended next milestone

---

## Feature Vertical Slice

Goal:
Implement the smallest useful vertical slice for this feature.

Context:
[describe feature]

Constraints:

- keep implementation minimal
- preserve architecture boundaries
- prefer shared contracts
- explain plan first

Output:

1. vertical slice plan
2. implementation
3. changed files
4. verification
5. follow-ups
