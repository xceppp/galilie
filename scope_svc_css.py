# One-off: scope services layout CSS under #svcLayoutRoot
import re
from pathlib import Path

SRC = Path("services-layout-raw.css")
OUT = Path("services-layout.css")
raw = SRC.read_text(encoding="utf-8")

raw = raw.replace(":root {", "#svcLayoutRoot {", 1)
raw = re.sub(r"\*,\*::before,\*::after\{[^}]*\}\s*", "", raw)
raw = re.sub(r"html\{[^}]*\}\s*", "", raw)
raw = re.sub(r"body\{[^}]*\}\s*", "", raw)

SCOPE = "#svcLayoutRoot "


def prefix_selector(sel: str) -> str:
    sel = sel.strip()
    if not sel or sel.startswith("@"):
        return sel
    parts = [p.strip() for p in sel.split(",")]
    out = []
    for p in parts:
        out.append(SCOPE + p if not p.startswith(SCOPE.strip()) else p)
    return ", ".join(out)


def scope_block(css: str) -> str:
    i = 0
    buf = []
    ln = len(css)
    while i < ln:
        if css.startswith("@media", i):
            m = re.match(r"@media\s*[^{]+\{", css[i:])
            if not m:
                break
            head = m.group(0)
            start = i + len(head)
            depth = 1
            j = start
            while j < ln and depth:
                if css[j] == "{":
                    depth += 1
                elif css[j] == "}":
                    depth -= 1
                j += 1
            inner = css[start : j - 1]
            buf.append(head + scope_block(inner) + "}")
            i = j
            continue
        m = re.match(r"([^{};]+)\{", css[i:])
        if m:
            sel = prefix_selector(m.group(1))
            start = i + m.end() - 1
            depth = 1
            j = start + 1
            while j < ln and depth:
                if css[j] == "{":
                    depth += 1
                elif css[j] == "}":
                    depth -= 1
                j += 1
            inner = css[start + 1 : j - 1]
            buf.append(sel + "{" + inner + "}")
            i = j
            continue
        buf.append(css[i])
        i += 1
    return "".join(buf)


OUT.write_text(scope_block(raw), encoding="utf-8")
print("Wrote", OUT)
