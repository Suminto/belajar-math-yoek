#!/usr/bin/env python3
"""
Migrasi struktur content/*.json dari format lama (1 fase = 1 materi)
ke format baru (1 fase = daftar bab/materi).

AMAN dijalankan berkali-kali: fase yang sudah punya "bab" akan dilewati.
Setiap file akan dibuat backup .bak sebelum ditimpa.

Cara pakai:
    python migrate_bab.py

Jalankan dari folder root project (yang di dalamnya ada folder "content").
"""
import json
import os
import glob

CONTENT_DIR = "content"
# File statis yang TIDAK memakai struktur fase, jangan disentuh
SKIP_FILES = {"home.json", "about.json"}

FASE_CONTENT_KEYS = ["judul", "ringkasan", "konten", "materi", "ebook_file", "ebook_label"]


def migrate_file(path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    fases = data.get("fases")
    if not isinstance(fases, list):
        print(f"  Lewati (tidak ada 'fases'): {path}")
        return False

    changed = False
    for fase in fases:
        if "bab" in fase:
            continue  # sudah format baru, lewati

        # Kumpulkan isi lama (kalau ada) jadi satu bab pertama
        old_content = {k: fase.get(k) for k in FASE_CONTENT_KEYS if fase.get(k)}
        bab_list = []
        if old_content:
            bab_entry = {
                "judul": old_content.get("judul", ""),
                "ringkasan": old_content.get("ringkasan", ""),
                "konten": old_content.get("konten", ""),
                "materi": old_content.get("materi", []) or [],
                "ebook_file": old_content.get("ebook_file", ""),
                "ebook_label": old_content.get("ebook_label", ""),
            }
            bab_list.append(bab_entry)

        # Hapus field lama di level fase, ganti dengan "bab"
        for k in FASE_CONTENT_KEYS:
            fase.pop(k, None)
        fase["bab"] = bab_list
        changed = True

    if changed:
        backup_path = path + ".bak"
        if not os.path.exists(backup_path):
            with open(backup_path, "w", encoding="utf-8") as f:
                json.dump(json.load(open(path, encoding="utf-8")), f, ensure_ascii=False, indent=2)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  Dimigrasi:  {path}  (backup: {backup_path})")
    else:
        print(f"  Sudah format baru, tidak diubah: {path}")
    return changed


def main():
    if not os.path.isdir(CONTENT_DIR):
        print(f"Folder '{CONTENT_DIR}' tidak ditemukan. Jalankan skrip ini dari root project.")
        return

    files = sorted(glob.glob(os.path.join(CONTENT_DIR, "*.json")))
    files = [f for f in files if os.path.basename(f) not in SKIP_FILES]

    if not files:
        print("Tidak ada file domain (bilangan.json, dst.) ditemukan di folder content/.")
        return

    print(f"Memeriksa {len(files)} file di folder '{CONTENT_DIR}':")
    any_changed = False
    for f in files:
        if migrate_file(f):
            any_changed = True

    print()
    if any_changed:
        print("Selesai. Silakan cek isi content/*.json, lalu commit & push seperti biasa:")
        print("  git add .")
        print('  git commit -m "Migrasi struktur fase ke bab"')
        print("  git push")
    else:
        print("Tidak ada perubahan — semua file sudah memakai struktur bab.")


if __name__ == "__main__":
    main()
