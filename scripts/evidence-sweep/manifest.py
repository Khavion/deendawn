import os, datetime
BASE = "docs/screens/final"
CELLS = {
 "a-se3-18":    ("iPhone SE 3rd gen", "iOS 18.6", "EN · light · default type", "smallest screen, home button, NO Liquid Glass — degradation check"),
 "a-16e":       ("iPhone 16e", "iOS 26.3", "EN · light · default", "notch, no Dynamic Island"),
 "a-17":        ("iPhone 17", "iOS 26.5", "EN · light · default", "mainstream Dynamic Island"),
 "a-air":       ("iPhone Air", "iOS 26.5", "EN · light · default", "odd 420pt width — magic-number catcher"),
 "a-17promax":  ("iPhone 17 Pro Max", "iOS 26.5", "EN · light · default", "largest phone; 6.9\" store-screenshot source"),
 "a-ipadmini":  ("iPad mini A17 Pro", "iOS 26.5", "EN · light · default", "narrowest tablet"),
 "a-ipadair11": ("iPad Air 11\" M4", "iOS 26.5", "EN · light · default", "most common iPad class"),
 "a-ipadpro13": ("iPad Pro 13\" M5", "iOS 26.5", "EN · light · default", "13\" store-screenshot source (2064×2752)"),
 "b-dark-17":   ("iPhone 17", "iOS 26.5", "EN · DARK · default", "full dark-theme sweep"),
 "c-nightwarm-17": ("iPhone 17", "iOS 26.5", "EN · light + night-warm reader", "reader-scoped warm palette"),
 "d-dark-ipad13":  ("iPad Pro 13\" M5", "iOS 26.5", "EN · DARK", "dark on the big canvas"),
 "e-dt-se3":    ("iPhone SE 3rd gen", "iOS 18.6", "EN · light · 310% AX type", "200%+ bar on the SMALLEST screen"),
 "e-dt-17":     ("iPhone 17", "iOS 26.5", "EN · light · 310% AX type", "200%+ bar, full route set"),
 "e-dt-ipad13": ("iPad Pro 13\" M5", "iOS 26.5", "EN · light · 310% AX type", "200%+ on the big canvas"),
 "f-ar-17":     ("iPhone 17", "iOS 26.5", "ARABIC (RTL) · light", "full RTL sweep incl. 2:282"),
 "f-ar-ipadmini": ("iPad mini A17 Pro", "iOS 26.5", "ARABIC (RTL) · light", "RTL on the narrow tablet"),
 "g-ur-17":     ("iPhone 17", "iOS 26.5", "URDU (RTL, Nastaliq) · light", "Nastaliq leading + RTL"),
 "h-compound-17": ("iPhone 17", "iOS 26.5", "ARABIC · DARK · 310% AX type", "worst-case compound"),
 "j-ipad-window": ("iPad Pro 13\" M5", "iOS 26.5", "EN · light · floating narrow window", "iPadOS 26 window-drag resize probe — live reflow, no breakage"),
 "i-rm-17":     ("iPhone 17", "iOS 26.5", "EN · light · Reduce Motion ON", "motion-off degradation"),
}
lines = [
 "# Evidence sweep manifest — iOS perfection session",
 "",
 f"Captured {datetime.date.today().isoformat()} from the RELEASE build (bundled JS, no dev chrome),",
 "on-device data seeded to Houston + onboarded (fresh containers otherwise). The `today` capture in",
 "each cell is a cold launch; every other capture is a deep link into the named route.",
 "",
 "| Cell | Device | OS | Configuration | Why this cell exists | Shots |",
 "|---|---|---|---|---|---|",
]
total = 0
for cell in sorted(os.listdir(BASE)):
    p = os.path.join(BASE, cell)
    if not os.path.isdir(p): continue
    n = len([f for f in os.listdir(p) if f.endswith(".png")])
    total += n
    d = CELLS.get(cell, ("?", "?", "?", "?"))
    lines.append(f"| {cell} | {d[0]} | {d[1]} | {d[2]} | {d[3]} | {n} |")
lines += ["", f"**Total: {total} captures.**", "",
 "Suites on the same release build: smoke, ask, locales, offline (wiped-container onboarding →",
 "every worship feature with zero servers → five offline cold starts), onboarding persistence.",
]
open(os.path.join(BASE, "MANIFEST.md"), "w").write("\n".join(lines) + "\n")
print("manifest written,", total, "captures")
