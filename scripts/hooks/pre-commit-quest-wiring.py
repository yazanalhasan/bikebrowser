#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def changed_mission_files() -> list[str]:
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--", "BikeBrowserWorld/Data/missions/*.json"],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        return []
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def main() -> int:
    changed = changed_mission_files()
    if not changed:
        return 0
    command = [sys.executable, "scripts/audit-quest-wiring.py", "--strict", "--changed", *changed]
    return subprocess.run(command, cwd=ROOT).returncode


if __name__ == "__main__":
    sys.exit(main())
