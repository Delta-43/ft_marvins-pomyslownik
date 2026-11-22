"""Licence check of the installed Python packages. Run inside the environment to check.

Reads License-Expression (PEP 639), then the trove classifiers, then the License field, so new-style
packages are not reported as unknown. Fails on licences that are not compatible with EUPL-1.2 for our use.
LGPL and MPL-2.0 are allowed: both are on the EUPL-1.2 compatibility list.
"""
import importlib.metadata as md
import re
import sys

FORBIDDEN = re.compile(r"(?<![LA])GPL|\bAGPL|SSPL|BUSL|Business Source|Commons Clause|\bNC\b|NonCommercial|Elastic License", re.I)
IGNORE = {"pip", "setuptools", "wheel"}


def licence(dist: md.Distribution) -> str:
    m = dist.metadata
    if m.get("License-Expression"):
        return m["License-Expression"]
    classifiers = [c.split(" :: ")[-1] for c in m.get_all("Classifier") or [] if c.startswith("License ::")]
    if classifiers:
        return "; ".join(classifiers)
    text = (m.get("License") or "").strip().splitlines()
    return text[0][:80] if text else "UNKNOWN"


def main() -> int:
    bad, unknown = [], []
    for dist in sorted(md.distributions(), key=lambda d: d.metadata["Name"].lower()):
        name = dist.metadata["Name"]
        if name.lower() in IGNORE:
            continue
        lic = licence(dist)
        print(f"{name:28} {dist.version:12} {lic}")
        if FORBIDDEN.search(lic) and not re.search(r"\bLGPL|Lesser General", lic, re.I):
            bad.append(f"{name} ({lic})")
        if lic == "UNKNOWN":
            unknown.append(name)
    if unknown:
        print("\nNo licence metadata (check by hand):", ", ".join(unknown))
    if bad:
        print("\nNot allowed:", ", ".join(bad))
        return 1
    print("\nLicence check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
