# Evidence sweep manifest — iOS perfection session

Captured 2026-07-30 from the RELEASE build (bundled JS, no dev chrome),
on-device data seeded to Houston + onboarded (fresh containers otherwise). The `today` capture in
each cell is a cold launch; every other capture is a deep link into the named route.

| Cell | Device | OS | Configuration | Why this cell exists | Shots |
|---|---|---|---|---|---|
| a-16e | iPhone 16e | iOS 26.3 | EN · light · default | notch, no Dynamic Island | 15 |
| a-17 | iPhone 17 | iOS 26.5 | EN · light · default | mainstream Dynamic Island | 15 |
| a-17promax | iPhone 17 Pro Max | iOS 26.5 | EN · light · default | largest phone; 6.9" store-screenshot source | 15 |
| a-air | iPhone Air | iOS 26.5 | EN · light · default | odd 420pt width — magic-number catcher | 15 |
| a-ipadair11 | iPad Air 11" M4 | iOS 26.5 | EN · light · default | most common iPad class | 15 |
| a-ipadmini | iPad mini A17 Pro | iOS 26.5 | EN · light · default | narrowest tablet | 15 |
| a-ipadpro13 | iPad Pro 13" M5 | iOS 26.5 | EN · light · default | 13" store-screenshot source (2064×2752) | 15 |
| a-se3-18 | iPhone SE 3rd gen | iOS 18.6 | EN · light · default type | smallest screen, home button, NO Liquid Glass — degradation check | 15 |
| b-dark-17 | iPhone 17 | iOS 26.5 | EN · DARK · default | full dark-theme sweep | 15 |
| c-nightwarm-17 | iPhone 17 | iOS 26.5 | EN · light + night-warm reader | reader-scoped warm palette | 3 |
| d-dark-ipad13 | iPad Pro 13" M5 | iOS 26.5 | EN · DARK | dark on the big canvas | 6 |
| e-dt-17 | iPhone 17 | iOS 26.5 | EN · light · 310% AX type | 200%+ bar, full route set | 15 |
| e-dt-ipad13 | iPad Pro 13" M5 | iOS 26.5 | EN · light · 310% AX type | 200%+ on the big canvas | 5 |
| e-dt-se3 | iPhone SE 3rd gen | iOS 18.6 | EN · light · 310% AX type | 200%+ bar on the SMALLEST screen | 8 |
| f-ar-17 | iPhone 17 | iOS 26.5 | ARABIC (RTL) · light | full RTL sweep incl. 2:282 | 10 |
| f-ar-ipadmini | iPad mini A17 Pro | iOS 26.5 | ARABIC (RTL) · light | RTL on the narrow tablet | 6 |
| g-ur-17 | iPhone 17 | iOS 26.5 | URDU (RTL, Nastaliq) · light | Nastaliq leading + RTL | 6 |
| h-compound-17 | iPhone 17 | iOS 26.5 | ARABIC · DARK · 310% AX type | worst-case compound | 6 |
| i-rm-17 | iPhone 17 | iOS 26.5 | EN · light · Reduce Motion ON | motion-off degradation | 4 |
| j-ipad-window | iPad Pro 13" M5 | iOS 26.5 | EN · light · floating narrow window | iPadOS 26 window-drag resize probe — live reflow, no breakage | 1 |

**Total: 205 captures.**

Suites on the same release build: smoke, ask, locales, offline (wiped-container onboarding →
every worship feature with zero servers → five offline cold starts), onboarding persistence.
