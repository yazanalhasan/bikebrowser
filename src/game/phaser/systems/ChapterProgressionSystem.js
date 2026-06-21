// ChapterProgressionSystem — runtime state over the canonical spine (progression.js).
//
// Pure logic, no Phaser. Given a snapshot of player progress it answers: which
// chapter are we in, which are unlocked/locked/complete, and what is the next
// rung. The spine itself is data (progression.js, §3); this system never
// hard-codes chapter facts — it only layers PROGRESS on top of them.
//
// Unlock rule (carry-forward, §3): a chapter unlocks when the chapter before it
// is complete. Chapter 1 is always unlocked. A chapter whose authored content is
// still SCAFFOLD/LOCKED can be unlocked-but-not-yet-playable: the UI shows it as
// a navigable preview rather than a soft-lock.

import { ACTS, CHAPTERS, chaptersOfAct } from '../../data/progression.js';

export class ChapterProgressionSystem {
  // progress: optional { chaptersComplete: number[] } — defaults to none.
  constructor(progress = {}) {
    this.completed = new Set(progress.chaptersComplete || []);
  }

  markComplete(num) {
    this.completed.add(num);
    return this;
  }

  isComplete(num) {
    return this.completed.has(num);
  }

  // A chapter is unlocked if it is Chapter 1, or the previous chapter is complete.
  isUnlocked(num) {
    if (num <= 1) return true;
    return this.completed.has(num - 1);
  }

  // The runtime status a UI should render for a chapter, fusing its AUTHORED
  // status (shipped/scaffold/locked) with the player's PROGRESS.
  //   'complete'   — finished.
  //   'playable'   — unlocked and has shipped content (enter it now).
  //   'preview'    — unlocked but content is still scaffolded (navigable preview).
  //   'locked'     — gated behind an earlier, incomplete chapter.
  runtimeStatus(num) {
    const ch = CHAPTERS.find((c) => c.num === num);
    if (!ch) return 'locked';
    if (this.completed.has(num)) return 'complete';
    if (!this.isUnlocked(num)) return 'locked';
    return ch.status === 'shipped' ? 'playable' : 'preview';
  }

  // The current chapter = lowest-numbered unlocked-and-incomplete chapter.
  currentChapter() {
    const next = CHAPTERS.find((c) => this.isUnlocked(c.num) && !this.completed.has(c.num));
    return next || CHAPTERS[CHAPTERS.length - 1];
  }

  currentAct() {
    const cur = this.currentChapter();
    return ACTS.find((a) => a.id === cur.actId) || ACTS[0];
  }

  // Full spine projected with per-chapter runtime status — what the chapter map
  // renders. Grouped by act, in canonical order.
  spine() {
    return ACTS.map((a) => ({
      ...a,
      chapters: chaptersOfAct(a.id).map((c) => ({
        ...c,
        runtimeStatus: this.runtimeStatus(c.num),
        unlocked: this.isUnlocked(c.num),
      })),
    }));
  }

  snapshot() {
    return { chaptersComplete: [...this.completed].sort((x, y) => x - y) };
  }
}

export default ChapterProgressionSystem;
