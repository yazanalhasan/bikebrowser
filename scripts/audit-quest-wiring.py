#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
WORLD = ROOT / "BikeBrowserWorld"
MISSIONS = WORLD / "Data" / "missions"
EXCLUDE = {".godot", "addons", "backups", "reports", "references", "project_audit", "tests"}
QUEST_ALIASES = {"bike_safety_check": "act1_pre_ride_check"}


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def mission_objectives(data: dict[str, Any]) -> list[str]:
    if isinstance(data.get("steps"), list):
        return [str(step.get("id", "")) for step in data["steps"] if step.get("id")]
    if isinstance(data.get("objectives"), list):
        values: list[str] = []
        for obj in data["objectives"]:
            values.append(str(obj.get("id", "")) if isinstance(obj, dict) else str(obj))
        return [value for value in values if value]
    return []


def parse_string_array(value: str) -> list[str]:
    return re.findall(r'"([^"]+)"', value)


def scene_files() -> list[Path]:
    return sorted(path for path in WORLD.rglob("*.tscn") if not any(part in EXCLUDE for part in path.parts))


def script_files() -> list[Path]:
    return sorted(path for path in WORLD.rglob("*.gd") if not any(part in EXCLUDE for part in path.parts))


def scan_scene(path: Path) -> list[dict[str, str]]:
    records: list[dict[str, str]] = []
    current_node = ""
    quest_id = ""
    objective_ids: list[str] = []

    def flush() -> None:
        if not quest_id:
            return
        for objective_id in objective_ids:
            records.append({"quest_id": quest_id, "objective_id": objective_id, "source": rel(path), "producer_type": "scene_property", "node": current_node})

    for raw in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        node = re.match(r'\[node name="([^"]+)"', raw)
        if node:
            flush()
            current_node = node.group(1)
            quest_id = ""
            objective_ids = []
            continue
        m = re.match(r'\s*quest_id\s*=\s*"([^"]+)"', raw)
        if m:
            quest_id = m.group(1)
            continue
        m = re.match(r'\s*objective_id\s*=\s*"([^"]+)"', raw)
        if m:
            objective_ids = [m.group(1)]
            continue
        m = re.match(r'\s*objective_ids\s*=\s*(.+)$', raw)
        if m:
            objective_ids = parse_string_array(m.group(1))
            continue
    flush()
    return records


def scan_script(path: Path) -> list[dict[str, str]]:
    text = path.read_text(encoding="utf-8", errors="ignore")
    records: list[dict[str, str]] = []
    quest_exports = re.findall(r'@export\s+var\s+quest_id\s*(?::=|=)\s*"([^"]+)"', text)
    objective_exports: list[str] = []
    for array_text in re.findall(r'@export\s+var\s+objective_ids[^=]*=\s*\[(.*?)\]', text, flags=re.S):
        objective_exports.extend(parse_string_array(array_text))
    for quest_id in quest_exports:
        for objective_id in objective_exports:
            records.append({"quest_id": quest_id, "objective_id": objective_id, "source": rel(path), "producer_type": "script_export_metadata", "node": ""})
    if quest_exports:
        # Some embodied stations keep their objective ids in authored step tables
        # instead of an exported metadata array.
        table_objectives = re.findall(r'"id"\s*:\s*"([^"]+)"', text)
        for quest_id in quest_exports:
            quest_id = QUEST_ALIASES.get(quest_id, quest_id)
            for objective_id in table_objectives:
                records.append({"quest_id": quest_id, "objective_id": objective_id, "source": rel(path), "producer_type": "script_step_table", "node": ""})
            for objective_id in re.findall(r'QuestRegistry\.record_objective\(\s*quest_id\s*,\s*"([^"]+)"', text):
                records.append({"quest_id": quest_id, "objective_id": objective_id, "source": rel(path), "producer_type": "script_variable_call", "node": ""})
    conditional_quests = {QUEST_ALIASES.get(q, q) for q in re.findall(r'quest_id\s*==\s*"([^"]+)"', text)}
    if conditional_quests:
        for quest_id in conditional_quests:
            for objective_id in re.findall(r'QuestRegistry\.record_objective\(\s*quest_id\s*,\s*"([^"]+)"', text):
                records.append({"quest_id": quest_id, "objective_id": objective_id, "source": rel(path), "producer_type": "script_conditional_variable_call", "node": ""})
    for m in re.finditer(r'QuestRegistry\.record_objective\(\s*"([^"]+)"\s*,\s*"([^"]+)"', text):
        records.append({"quest_id": QUEST_ALIASES.get(m.group(1), m.group(1)), "objective_id": m.group(2), "source": rel(path), "producer_type": "script_call", "node": ""})
    return records


def build_report(changed: set[str] | None = None) -> dict[str, Any]:
    producers: dict[tuple[str, str], list[dict[str, str]]] = defaultdict(list)
    for path in scene_files():
        for record in scan_scene(path):
            producers[(record["quest_id"], record["objective_id"])].append(record)
    for path in script_files():
        for record in scan_script(path):
            producers[(record["quest_id"], record["objective_id"])].append(record)

    quests: list[dict[str, Any]] = []
    for path in sorted(MISSIONS.glob("*.json")):
        data = load_json(path)
        quest_id = str(data.get("id") or data.get("quest_id") or path.stem)
        if changed is not None and rel(path) not in changed and str(path) not in changed:
            continue
        objectives = []
        missing: list[str] = []
        for objective_id in mission_objectives(data):
            matched = producers.get((quest_id, objective_id), [])
            if not matched:
                missing.append(objective_id)
            objectives.append({"objective_id": objective_id, "producer_count": len(matched), "producers": matched[:8]})
        deprecated = bool(data.get("deprecated", False))
        if deprecated:
            status = "STALE_DUPLICATE"
        elif missing and len(missing) == len(objectives):
            status = "DATA_ONLY"
        elif missing:
            status = "PARTIAL"
        else:
            status = "HAS_PRODUCERS"
        quests.append({"quest_id": quest_id, "file": rel(path), "deprecated": deprecated, "supersededBy": data.get("supersededBy", ""), "status": status, "missing_objectives": missing, "objectives": objectives})
    counts: dict[str, int] = {}
    for quest in quests:
        counts[quest["status"]] = counts.get(quest["status"], 0) + 1
    return {"quests": quests, "counts": counts}


def main() -> int:
    parser = argparse.ArgumentParser(description="Static BikeBrowser quest wiring audit.")
    parser.add_argument("--strict", action="store_true", help="Exit nonzero when active quests have missing objective producers.")
    parser.add_argument("--json", default="", help="Optional report path to write as JSON.")
    parser.add_argument("--changed", nargs="*", help="Limit strict checking to these mission JSON paths.")
    args = parser.parse_args()

    changed = set(args.changed) if args.changed is not None else None
    report = build_report(changed)
    if args.json:
        out = Path(args.json)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")

    offenders = [q for q in report["quests"] if not q["deprecated"] and q["missing_objectives"]]
    print("Quest wiring audit:")
    for status, count in sorted(report["counts"].items()):
        print(f"- {status}: {count}")
    if offenders:
        print("Missing producers:")
        for quest in offenders:
            print(f"- {quest['quest_id']}: {', '.join(quest['missing_objectives'])}")
    if args.strict and offenders:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
