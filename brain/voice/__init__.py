"""Local XTTS voice engine for BikeBrowser (Narrator / NPC speech).

Executive Brain classification:
    cost_class: local_ai | approval_required: false | resource_governed: true | paid: false

Runs entirely on local GPU (no paid APIs). The XTTS-v2 *weights* are CPML
(non-commercial) — see config.GOVERNANCE and the feasibility audit before any
commercial ship. Public API: `synthesize`, `governance_manifest`, `GOVERNANCE`.
"""
from __future__ import annotations

from .config import CHARACTER_VOICES, GOVERNANCE
from .synthesize import ResourceGoverned, governance_manifest, synthesize

__all__ = [
    "synthesize",
    "governance_manifest",
    "GOVERNANCE",
    "CHARACTER_VOICES",
    "ResourceGoverned",
]
