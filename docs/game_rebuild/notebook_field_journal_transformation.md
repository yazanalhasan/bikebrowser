# Notebook Field-Journal Transformation

Date: 2026-05-27

## Goal

The notebook should feel like Zuzu's field journal: a place where discoveries become clues, not a developer list of unlocked state.

## Implemented In Phase 9

- Notebook panel now uses a journal-like page surface with a spine and tabs.
- Header reads `Zuzu's Field Notebook`.
- Entries are presented as recent clue cards with star markers for new clues.
- Category summary only shows unlocked categories instead of every empty category.
- Full notebook state remains data-driven in `NotebookSystem`.
- Opening/closing still uses `N` and preserves existing save/load behavior.
- Playwright verifies child-facing notebook text and new-clue marker behavior.

## Current Design

Normal notebook view:

- shows the latest two clue cards
- keeps text short enough to fit the page
- uses `★` for new entries
- keeps full entry history in runtime state

The full history is still available through `window.__GAME__.getNotebookState()` for tests/debugging.

## Still Missing

- Final Aseprite notebook frame/card art.
- Sketch icons for clue categories.
- Interactive tabs/categories.
- Dedicated pages for material comparison, bridge plan, ecology, chemistry, and language notes.
- Page-turn or new-entry animation.

## Acceptance For This Phase

This phase closes the first UX gap: the notebook no longer reads as a raw checklist panel in normal play. It does not yet close the production-art gap.
