#!/usr/bin/env python3
"""Render the filled Trade in DRC technical transfer questionnaire to HTML (then WeasyPrint -> PDF)."""
import json, html, re, sys, pathlib

HERE = pathlib.Path(__file__).parent
m = json.loads((HERE / "meta.json").read_text())
meta = m["meta"]
checklist = m["checklist"]
sections = json.loads((HERE / "secs.json").read_text())

def esc(t):
    t = html.escape(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    return t

NUM = re.compile(r"^(\d{1,2})[.)]\s+(.*)$")


def body(t):
    """Paragraphs, bullet lists, numbered lists, ``` fenced blocks and markdown tables."""
    out, buf, lst, pre, tbl, num = [], [], [], [], [], []
    in_pre = False

    def flush_p():
        if buf:
            out.append("<p>" + esc(" ".join(buf)) + "</p>")
            buf.clear()

    def flush_l():
        if lst:
            out.append("<ul>" + "".join(f"<li>{esc(i)}</li>" for i in lst) + "</ul>")
            lst.clear()

    def flush_t():
        if not tbl:
            return
        rows = [[c.strip() for c in r.strip().strip("|").split("|")] for r in tbl
                if set(r.strip()) - set("|-: ")]
        tbl.clear()
        if not rows:
            return
        head, rest = rows[0], rows[1:]
        h = "".join(f"<th>{esc(c)}</th>" for c in head)
        b = "".join("<tr>" + "".join(f"<td>{esc(c)}</td>" for c in r) + "</tr>" for r in rest)
        out.append(f'<table class="inner"><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table>')

    def flush_n():
        if num:
            out.append("<ol>" + "".join(f"<li>{esc(i)}</li>" for i in num) + "</ol>")
            num.clear()

    def flush_all():
        flush_p(); flush_l(); flush_n(); flush_t()

    for raw in t.split("\n"):
        if raw.strip().startswith("```"):
            if in_pre:
                out.append("<pre>" + html.escape("\n".join(pre)) + "</pre>")
                pre.clear()
            else:
                flush_all()
            in_pre = not in_pre
            continue
        if in_pre:
            pre.append(raw)
            continue
        line = raw.strip()
        if not line:
            flush_all(); continue
        if line.startswith("|") and line.endswith("|"):
            flush_p(); flush_l(); flush_n(); tbl.append(line); continue
        flush_t()
        m_num = NUM.match(line)
        if line.startswith(("- ", "• ", "* ")):
            flush_p(); flush_n(); lst.append(line[2:].strip())
        elif m_num:
            flush_p(); flush_l(); num.append(m_num.group(2).strip())
        else:
            flush_l(); flush_n(); buf.append(line)
    if in_pre and pre:
        out.append("<pre>" + html.escape("\n".join(pre)) + "</pre>")
    flush_all()
    return "".join(out)

rows = []
for s in sections:
    rows.append(f'<h2>{esc(s["section"])}</h2>')
    rows.append('<table class="qa"><colgroup><col class="c1"><col class="c2"></colgroup>'
                '<thead><tr><th>No.</th><th>Question / information provided</th></tr></thead><tbody>')
    for a in s["answers"]:
        rows.append(
            f'<tr><td class="num">{a["n"]}</td><td>'
            f'<div class="q">{esc(a["question"])}</div>'
            f'<div class="a">{body(a["answer"])}</div></td></tr>'
        )
    rows.append("</tbody></table>")

def mark(status, want):
    return "&#9746;" if status == want else "&#9744;"

clrows = []
for c in checklist:
    clrows.append(
        f'<tr><td>{esc(c["item"])}</td>'
        f'<td class="st">{mark(c["status"],"Complete")} Complete<br>'
        f'{mark(c["status"],"Pending")} Pending<br>'
        f'{mark(c["status"],"N/A")} N/A</td>'
        f'<td class="ev">{esc(c["evidence"])}</td></tr>'
    )

HTML = f"""<!doctype html><html><head><meta charset="utf-8"><title>Trade in DRC Technical Transfer Questionnaire</title>
<style>
@page {{
  size: A4; margin: 20mm 16mm 18mm 16mm;
  @top-right {{ content: "TRADE IN DRC | TECHNICAL TRANSFER"; font-family: Helvetica, Arial, sans-serif;
                font-size: 7pt; letter-spacing: .06em; color: #7a8794; }}
  @bottom-center {{ content: "Confidential technical handover document. Do not include passwords, API keys or private keys.";
                    font-family: Helvetica, Arial, sans-serif; font-size: 6.8pt; color: #8a95a1; }}
  @bottom-right {{ content: counter(page) " / " counter(pages);
                   font-family: Helvetica, Arial, sans-serif; font-size: 6.8pt; color: #8a95a1; }}
}}
* {{ box-sizing: border-box; }}
body {{ font-family: Helvetica, Arial, sans-serif; font-size: 8.6pt; line-height: 1.42; color: #17222e; margin: 0; }}
h1 {{ font-size: 17pt; margin: 0 0 2mm; letter-spacing: -.01em; }}
.sub {{ font-size: 9.5pt; color: #4d5b69; margin: 0 0 6mm; }}
h2 {{ font-size: 10.5pt; margin: 7mm 0 2.5mm; padding-bottom: 1.4mm;
      border-bottom: 1.6pt solid #0b3d2c; color: #0b3d2c; break-after: avoid; }}
table {{ width: 100%; border-collapse: collapse; }}
.meta td {{ border: .6pt solid #cdd6de; padding: 2mm 2.5mm; font-size: 8.6pt; }}
.meta td.k {{ width: 34mm; background: #f3f6f8; font-weight: bold; color: #33414f; }}
.note {{ border-left: 2.6pt solid #a8171a; background: #fdf3f3; padding: 2.5mm 3mm; margin: 4mm 0 0;
         font-size: 8.2pt; color: #5c1d1f; }}
.purpose {{ font-size: 8.4pt; color: #3d4a58; margin: 4mm 0 0; }}
table.qa th {{ background: #0b3d2c; color: #fff; font-size: 7.6pt; text-align: left;
               padding: 1.8mm 2.5mm; letter-spacing: .04em; text-transform: uppercase; }}
table.qa td {{ border: .6pt solid #cdd6de; padding: 2.2mm 2.5mm; vertical-align: top; }}
col.c1 {{ width: 9mm; }}
td.num {{ text-align: center; font-weight: bold; color: #0b3d2c; background: #f3f6f8; }}
.q {{ font-weight: bold; color: #0b3d2c; margin-bottom: 1.4mm; }}
.a p {{ margin: 0 0 1.6mm; }}
.a ul, .a ol {{ margin: 0 0 1.6mm; padding-left: 5mm; }}
.a li {{ margin-bottom: .9mm; }}
.a ol li {{ padding-left: .6mm; }}
.a code {{ font-family: "DejaVu Sans Mono", Menlo, monospace; font-size: 7.6pt;
           background: #eef2f5; padding: 0 .6mm; border-radius: 1px; }}
.a pre {{ font-family: "DejaVu Sans Mono", Menlo, monospace; font-size: 7pt; line-height: 1.35;
          background: #f3f6f8; border: .6pt solid #dbe3ea; border-radius: 2px;
          padding: 2mm 2.5mm; margin: 0 0 1.8mm; white-space: pre; overflow-x: auto; }}
table.inner {{ margin: 0 0 1.8mm; width: auto; min-width: 60%; }}
table.inner th {{ background: #eef2f5; color: #0b3d2c; font-size: 7.4pt; text-align: left;
                  padding: 1.2mm 2mm; border: .6pt solid #dbe3ea; text-transform: none; letter-spacing: 0; }}
table.inner td {{ padding: 1.2mm 2mm; border: .6pt solid #dbe3ea; font-size: 8pt; }}
table.cl tr {{ break-inside: avoid; }}
.q {{ break-after: avoid; }}
table.qa thead {{ display: table-header-group; }}
table.cl th {{ background: #0b3d2c; color: #fff; font-size: 7.6pt; text-align: left; padding: 1.8mm 2.5mm; }}
table.cl td {{ border: .6pt solid #cdd6de; padding: 2.2mm 2.5mm; vertical-align: top; font-size: 8.2pt; }}
td.st {{ width: 26mm; white-space: nowrap; }}
td.ev {{ width: 58mm; font-size: 7.8pt; color: #3d4a58; }}
.sign td {{ border: .6pt solid #cdd6de; padding: 4mm 3mm; width: 50%; vertical-align: top; font-size: 8.4pt; }}
.sign .role {{ font-weight: bold; color: #0b3d2c; margin-bottom: 3mm; }}
.line {{ margin-top: 6mm; border-bottom: .6pt solid #7a8794; height: 6mm; }}
</style></head><body>

<h1>Technical Transfer Questionnaire</h1>
<p class="sub">Trade in DRC: application, infrastructure and operational handover</p>

<table class="meta">
<tr><td class="k">Prepared by</td><td>{esc(meta['prepared_by'])}</td></tr>
<tr><td class="k">Date</td><td>{esc(meta['date'])}</td></tr>
<tr><td class="k">Version / repository release</td><td>{esc(meta['version'])}</td></tr>
<tr><td class="k">Application</td><td>{esc(meta['application'])}</td></tr>
<tr><td class="k">Repository</td><td>{esc(meta['repository'])}</td></tr>
</table>

<p class="purpose"><strong>Purpose.</strong> This document accompanies the delivery of the Trade in DRC platform to
the receiving technical team. It describes the system as built, at the commit named above, and every answer was
written against the source rather than from memory. Where a capability was deliberately left for the new owner to
decide, the answer says which decision is open and gives a recommendation.</p>

<div class="note"><strong>Security note.</strong> This document contains no passwords, tokens, API secrets, private
keys or database credentials. It names variables, consoles and owners only. The credentials themselves are handed
over separately, through the approved password manager.</div>

{''.join(rows)}

<h2>10. Handover acceptance checklist</h2>
<table class="cl"><thead><tr><th>Acceptance item</th><th>Status</th><th>Evidence / link</th></tr></thead>
<tbody>{''.join(clrows)}</tbody></table>

<h2>Sign-off</h2>
<p class="purpose">Signing below confirms that both parties have reviewed this handover. Anything still outstanding
is recorded in the open items list at answer 8.5.</p>
<table class="sign"><tr>
<td><div class="role">Transferring representative</div>
Name and role: Mehmet Semih Babacan<div class="line"></div>Signature / date:<div class="line"></div></td>
<td><div class="role">Receiving representative</div>
Name and role:<div class="line"></div>Signature / date:<div class="line"></div></td>
</tr></table>

</body></html>"""

(HERE / "filled.html").write_text(HTML)
print("wrote", HERE / "filled.html")
