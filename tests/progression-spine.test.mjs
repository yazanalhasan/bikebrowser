// progression-spine.test.mjs — locks the canonical game spine (arc.md §3) and the
// runtime unlock logic. The spine is the structure that makes "all acts and all
// chapters" real and navigable; this guards its shape and the carry-forward
// unlock rule against regressions.

import assert from 'node:assert/strict';
import test from 'node:test';

import { ACTS, CHAPTERS, chapter, chaptersOfAct, SAFETY_FACTOR_THREAD }
  from '../src/game/data/progression.js';
import { ChapterProgressionSystem }
  from '../src/game/phaser/systems/ChapterProgressionSystem.js';

test('spine has exactly three acts and seven chapters', () => {
  assert.equal(ACTS.length, 3);
  assert.equal(CHAPTERS.length, 7);
  assert.deepEqual(CHAPTERS.map((c) => c.num), [1, 2, 3, 4, 5, 6, 7]);
});

test('acts group the seven chapters by medium, in canonical order', () => {
  assert.deepEqual(chaptersOfAct('act1').map((c) => c.num), [1, 2, 3, 4]); // ground
  assert.deepEqual(chaptersOfAct('act2').map((c) => c.num), [5, 6]);       // sea & air
  assert.deepEqual(chaptersOfAct('act3').map((c) => c.num), [7]);          // space
  // every chapter belongs to exactly one declared act
  for (const c of CHAPTERS) assert.ok(ACTS.some((a) => a.id === c.actId));
});

test('the vehicle ladder matches arc.md §3', () => {
  assert.deepEqual(
    CHAPTERS.map((c) => c.vehicle),
    ['Bike', 'E-bike', 'Motorcycle', 'Car', 'Boat', 'Plane', 'Spacecraft'],
  );
});

test('the biological spine runs parallel and is fully populated', () => {
  assert.deepEqual(
    CHAPTERS.map((c) => c.bioDomain),
    ['Ecology', 'Ethnobotany', 'Phytochemistry', 'Cellular Biology',
      'Microbiology', 'Molecular Biology', 'Systems Biology & Life Engineering'],
  );
  for (const c of CHAPTERS) {
    assert.ok(c.bioQuestion && c.rig && c.engineeringDomain && c.reach && c.region);
  }
});

test('Chapter 1 ships; Chapters 2-7 are scaffold (each has a playable rig)', () => {
  assert.equal(chapter(1).status, 'shipped');
  // Every later chapter now has its signature engineering rig built, so all of
  // 2-7 are 'scaffold' (playable demo, not yet a full chapter) — none 'locked'.
  for (const c of CHAPTERS.slice(1)) {
    assert.equal(c.status, 'scaffold', `Ch${c.num} should be scaffold`);
  }
  // Every scaffold chapter exposes a live ladder entry event (its rig).
  for (const c of CHAPTERS.slice(1)) {
    assert.equal(c.entry.type, 'scene');
    assert.ok(c.entry.event, `Ch${c.num} has a live entry event`);
  }
});

test('carry-forward unlock rule: a chapter unlocks when the prior is complete', () => {
  const fresh = new ChapterProgressionSystem();
  assert.ok(fresh.isUnlocked(1));
  assert.ok(!fresh.isUnlocked(2));
  assert.equal(fresh.currentChapter().num, 1);

  const afterCh1 = new ChapterProgressionSystem({ chaptersComplete: [1] });
  assert.ok(afterCh1.isUnlocked(2));
  assert.ok(!afterCh1.isUnlocked(3));
  assert.equal(afterCh1.currentChapter().num, 2);
  assert.equal(afterCh1.currentAct().id, 'act1');
});

test('runtime status fuses authored status with player progress', () => {
  const sys = new ChapterProgressionSystem({ chaptersComplete: [1] });
  assert.equal(sys.runtimeStatus(1), 'complete');   // finished
  assert.equal(sys.runtimeStatus(2), 'preview');    // unlocked but scaffolded
  assert.equal(sys.runtimeStatus(3), 'locked');     // gated behind ch2
  const fresh = new ChapterProgressionSystem();
  assert.equal(fresh.runtimeStatus(1), 'playable'); // unlocked + shipped
});

test('spine() projects all acts with per-chapter runtime status', () => {
  const sys = new ChapterProgressionSystem();
  const spine = sys.spine();
  assert.equal(spine.length, 3);
  assert.equal(spine.flatMap((a) => a.chapters).length, 7);
  assert.ok(spine[0].chapters[0].runtimeStatus);
});

test('snapshot round-trips through the constructor', () => {
  const sys = new ChapterProgressionSystem().markComplete(1).markComplete(2);
  const snap = sys.snapshot();
  assert.deepEqual(snap.chaptersComplete, [1, 2]);
  assert.ok(new ChapterProgressionSystem(snap).isUnlocked(3));
});

test('the safety-factor through-line is exported for chapter UIs', () => {
  assert.match(SAFETY_FACTOR_THREAD, /strong enough/i);
});
