#!/usr/bin/env node
/**
 * inspect-save.js — Dev tool for inspecting the BikeBrowser game save
 * state stored in Electron's localStorage.
 *
 * Usage:
 *   node tools/inspect-save.js <path-to-Local Storage leveldb dir or .json>
 *   node tools/inspect-save.js <path> --reset-quest <questId>
 *
 * Where to find the save:
 *   Electron stores localStorage under:
 *     %APPDATA%\bikebrowser\Local Storage\leveldb\
 *   The save key is `bikebrowser_game_save`. Reading raw leveldb is
 *   non-trivial; the recommended workflow is to copy the value out via
 *   the running app's DevTools console (much simpler):
 *
 *     copy(localStorage.getItem('bikebrowser_game_save'))
 *
 *   Then paste into a file like `tmp-save.json` and pass that path
 *   to this tool:
 *
 *     node tools/inspect-save.js tmp-save.json
 *
 * What it prints:
 *   - completedQuests (array)
 *   - activeQuest (object or null)
 *   - observations (array)
 *   - bridgeBuilt (bool)
 *   - flags (object)
 *
 * Optional --reset-quest:
 *   Prints what the new save state WOULD look like with the named
 *   quest removed from completedQuests. Does NOT write the file.
 *   Pipe to a file yourself if you want to write the result back:
 *
 *     node tools/inspect-save.js tmp-save.json --reset-quest bridge_collapse > tmp-save-new.json
 *
 *   Then paste the new content back into DevTools:
 *
 *     localStorage.setItem('bikebrowser_game_save', <pasted-content>)
 *
 * This tool never writes to disk on its own. Read-only by design.
 */

'use strict';

const fs = require('fs');

function die(msg) {
  process.stderr.write(`inspect-save: ${msg}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0) {
    die('missing save-file path. See header comment for usage.');
  }
  const path = args[0];
  let resetQuest = null;
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--reset-quest') {
      resetQuest = args[i + 1];
      if (!resetQuest) die('--reset-quest requires a quest id');
      i++;
    }
  }
  return { path, resetQuest };
}

function loadSave(path) {
  let raw;
  try {
    raw = fs.readFileSync(path, 'utf8');
  } catch (e) {
    die(`could not read ${path}: ${e.message}`);
  }
  // The save is JSON; sometimes wrapped in extra quoting if pasted
  // out of DevTools' copy() output (which produces a JSON-string-of-
  // a-JSON-string). Try the raw parse first; on failure, peel one
  // layer.
  try {
    return JSON.parse(raw);
  } catch (_e) {
    try {
      return JSON.parse(JSON.parse(raw));
    } catch (e) {
      die(`could not parse JSON: ${e.message}`);
    }
  }
}

function summarize(save) {
  const out = {
    completedQuests: save.completedQuests || [],
    activeQuest: save.activeQuest || null,
    observations: save.observations || [],
    bridgeBuilt: save.bridgeBuilt ?? null,
    flags: save.flags || {},
  };
  // Pretty print
  process.stdout.write(JSON.stringify(out, null, 2));
  process.stdout.write('\n');
}

function resetQuest(save, questId) {
  const completedQuests = (save.completedQuests || []).filter((q) => q !== questId);
  const wasComplete = (save.completedQuests || []).includes(questId);
  if (!wasComplete) {
    process.stderr.write(
      `inspect-save: warning — '${questId}' is not in completedQuests; nothing to reset.\n`,
    );
  }
  const updated = { ...save, completedQuests };
  // Also clear any active state pointing at this quest, just in case
  if (updated.activeQuest?.id === questId) {
    updated.activeQuest = null;
  }
  process.stdout.write(JSON.stringify(updated, null, 2));
  process.stdout.write('\n');
}

function main() {
  const { path, resetQuest: questToReset } = parseArgs(process.argv);
  const save = loadSave(path);
  if (questToReset) {
    resetQuest(save, questToReset);
  } else {
    summarize(save);
  }
}

main();
