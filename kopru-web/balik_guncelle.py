# -*- coding: utf-8 -*-
"""assets/fish klasörünü tarar ve manifest.js dosyasını yeniden üretir.
Yeni balık eklemek için: resmi assets/fish içine kopyala, bu scripti çalıştır.
Nadirlik, dosya adından deterministik olarak atanır:
  %40 yaygın · %30 orta · %20 nadir · %10 efsanevi
"""
import hashlib, json, os, re, sys

KOK = os.path.dirname(os.path.abspath(__file__))
KLASOR = os.path.join(KOK, "assets", "fish")
UZANTILAR = (".jpg", ".jpeg", ".png", ".webp")

def guvenli_ad(ad):
    kok, uz = os.path.splitext(ad)
    temiz = re.sub(r"[^A-Za-z0-9._-]", "_", kok)
    return temiz + uz.lower()

def nadirlik(ad):
    h = int(hashlib.md5(ad.encode("utf-8")).hexdigest(), 16) % 10
    if h < 4: return "yaygin"
    if h < 7: return "orta"
    if h < 9: return "nadir"
    return "efsanevi"

kayitlar = []
for ad in sorted(os.listdir(KLASOR)):
    if not ad.lower().endswith(UZANTILAR) : continue
    yeni = guvenli_ad(ad)
    if yeni != ad:
        os.rename(os.path.join(KLASOR, ad), os.path.join(KLASOR, yeni))
        ad = yeni
    kayitlar.append({"file": ad, "tier": nadirlik(ad)})

icerik = "// Bu dosya balik_guncelle.py tarafından üretilir — elle düzenleme.\n"
icerik += "window.FISH_CATALOG = " + json.dumps(kayitlar, ensure_ascii=False, indent=1) + ";\n"
with open(os.path.join(KLASOR, "manifest.js"), "w", encoding="utf-8") as f:
    f.write(icerik)
print(f"{len(kayitlar)} balık kataloğa yazıldı → assets/fish/manifest.js")
for t in ("yaygin","orta","nadir","efsanevi"):
    print(" ", t, sum(1 for k in kayitlar if k["tier"]==t))
