# Repository Integrity Fix Plan

Fix for the CONFIRMED CRITICAL issue in `repository_integrity_audit.md`:
`brain/artifacts/` (a source package imported by committed code) is gitignored
by the unanchored `.gitignore` line `artifacts/` and is untracked, so a fresh
Executive Brain clone fails to import. **Not implemented — plan only.**

## Goal
Track the `brain/artifacts/` **source package** while keeping the top-level
**runtime-output** `artifacts/` directory ignored. Make a fresh clone import and
run cleanly, with a guard so it can't regress.

## Safest fix (recommended) — anchor the ignore + track the package

### Change 1 — anchor the gitignore pattern to the repo root
`.gitignore` line 29:
```diff
-artifacts/
+/artifacts/
```
`/artifacts/` matches **only** the repo-root `artifacts/` (the runtime output),
not `brain/artifacts/` (source). Verified safe: the *only* nested `artifacts`
directory in the repo is the `brain/artifacts/` source package; there is no other
nested `artifacts/` that must stay ignored. (`memory/artifacts/...` has its own
separate ignore rules and is unaffected.)

### Change 2 — track the source package
```
git add brain/artifacts/*.py brain/artifacts/__init__.py
```
Track only source (`*.py`); `__pycache__/` stays ignored by the existing rule.

### Change 3 — regression guard (prevent recurrence)
Add a tiny tracked test, e.g. `tests/test_repo_integrity.py`:
```python
import subprocess, pathlib
def test_brain_artifacts_is_tracked():
    out = subprocess.run(["git", "ls-files", "brain/artifacts"],
                         capture_output=True, text=True, cwd=pathlib.Path(__file__).resolve().parents[1])
    assert "brain/artifacts/__init__.py" in out.stdout, "brain/artifacts source package must be tracked"
def test_brain_artifacts_not_ignored():
    out = subprocess.run(["git", "check-ignore", "brain/artifacts"], capture_output=True, text=True,
                         cwd=pathlib.Path(__file__).resolve().parents[1])
    assert out.returncode != 0, "brain/artifacts must not be gitignored"
```
This fails fast if the package is ever re-ignored or untracked.

## Why not the alternatives
| Alt | What | Why not |
|---|---|---|
| `git add -f brain/artifacts/` only (no gitignore change) | Force-track despite ignore | Footgun: the dir stays ignored, so **new** files in it won't be tracked automatically; silent recurrence. Reject. |
| Rename `brain/artifacts/` → `brain/artifact_registry/` | Remove the name collision | Touches every import site (`cli.py`, runner, inspect routes, loop, delegation, execution reports) — larger blast radius, higher risk, more review. Keep as fallback, not first choice. |
| Negation rule `!brain/artifacts/` after `artifacts/` | Un-ignore the nested path | Works but less obvious than anchoring; anchoring `/artifacts/` is the clearer, standard idiom. |

## Risks
- **Low overall; reversible.**
- *Accidentally un-ignoring the top-level `artifacts/`*: mitigated — `/artifacts/`
  still ignores root; verify with `git check-ignore /artifacts/x` and `git status`
  shows no flood of `artifacts/` files.
- *Pulling in non-source files from brain/artifacts*: mitigated — add only `*.py`;
  `__pycache__/` already ignored.
- *Line-ending churn* (CRLF warnings on Windows) — cosmetic.
- *Other machines with the same untracked dir*: after the fix they reconcile to
  the tracked version on pull (identical source, no conflict expected).

## Migration steps (when authorized)
1. Branch (don't work on a shared default branch): `git switch -c fix/track-brain-artifacts`.
2. Edit `.gitignore`: `artifacts/` → `/artifacts/`.
3. `git add brain/artifacts/__init__.py brain/artifacts/*.py`.
4. Add `tests/test_repo_integrity.py` (guard).
5. `git add .gitignore tests/test_repo_integrity.py`.
6. Commit: `fix(repo): track brain/artifacts source package; anchor artifacts/ ignore to root`.
7. Run the full test suite (expect 436 + 2 new = 438 green).
8. **Clean-clone verification** (the real proof):
   ```
   git clone . /tmp/eb_clean   # or: git archive HEAD | tar -x -C /tmp/eb_clean
   cd /tmp/eb_clean && python -c "from brain.artifacts.registry import register_file_artifact; import brain.cli; print('clone imports OK')"
   ```
   Must print OK (today it raises ModuleNotFoundError).

## Test strategy
- **Unit guard:** the two `test_repo_integrity.py` assertions (tracked + not-ignored).
- **Import proof:** `python -c "import brain.cli"` from a clean checkout succeeds.
- **Ignore-still-correct:** `git check-ignore artifacts/anything` → matched (root output still ignored); `git check-ignore brain/artifacts` → no match.
- **Full suite:** 436 pre-existing tests remain green.
- **No stray tracking:** `git status` after `git add` shows only the intended
  `brain/artifacts/*.py` (+ .gitignore + the new test), no top-level `artifacts/` files.

## Sequencing
This is CRITICAL and gates a reproducible repo. Recommended order: **fix repo
integrity → restore acceptance green (Acceptance Recovery Sprint) → resume
Phase 1.1.** Awaiting go-ahead to implement (this document is verify-only).
