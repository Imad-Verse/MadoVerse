#!/usr/bin/env node
/* ==========================================================================
   تسهيل للعلوم الشرعية — مولّد بيان الإصدار (Release Manifest Generator)
   --------------------------------------------------------------------------
   يفحص مجلد download/ ويستخرج أحدث ملف APK وأحدث ملف Windows ‎(.zip)
   بحسب رقم الإصدار المكتوب في اسم الملف، ثم:
     1) يكتب البيان download/version.json (يقرؤه الموقع ديناميكياً).
     2) يحدّث القيم الثابتة داخل index.html (لمحركات البحث وللمتصفحات بلا JS).

   الاستخدام:  npm run update-version   (أو: node scripts/update-version.js)
   تسمية الملفات المقترحة:
     download/tasheel-v1.4.6.apk
     download/tasheel-v1.4.6-windows.zip
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOWNLOAD_DIR = path.join(ROOT, 'download');
const MANIFEST_PATH = path.join(DOWNLOAD_DIR, 'version.json');
const INDEX_PATH = path.join(ROOT, 'index.html');

const VERSION_RE = /v?(\d+)\.(\d+)(?:\.(\d+))?/i;

function parseVersion(fileName) {
  const m = fileName.match(VERSION_RE);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3] || 0)];
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function pickLatest(files) {
  let best = null;
  for (const file of files) {
    const version = parseVersion(file);
    if (!version) continue;
    if (!best || compareVersions(version, best.version) > 0) {
      best = { file, version };
    }
  }
  return best;
}

function describe(entry) {
  if (!entry) return null;
  const stats = fs.statSync(path.join(DOWNLOAD_DIR, entry.file));
  const ver = `v${entry.version.join('.')}`;
  return {
    file: entry.file,
    url: `https://github.com/Imad-Verse/MadoVerse/releases/download/${ver}/${encodeURIComponent(entry.file)}`,
    version: entry.version.join('.'),
    size: stats.size,
    updatedAt: stats.mtime.toISOString(),
  };
}

function main() {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    console.error('✖ مجلد download/ غير موجود.');
    process.exit(1);
  }

  const files = fs.readdirSync(DOWNLOAD_DIR).filter((f) =>
    fs.statSync(path.join(DOWNLOAD_DIR, f)).isFile()
  );

  const android = describe(pickLatest(files.filter((f) => /\.apk$/i.test(f))));
  const windows = describe(
    pickLatest(files.filter((f) => /\.(zip|msix|exe)$/i.test(f)))
  );

  const candidates = [android, windows].filter(Boolean).map((p) => parseVersion(p.version));
  const latest = candidates.sort(compareVersions).pop();

  if (!latest) {
    console.error('✖ لم يُعثر على أي ملف يحمل رقم إصدار داخل download/.');
    process.exit(1);
  }

  const version = latest.join('.');
  const manifest = {
    version,
    generatedAt: new Date().toISOString(),
    android,
    windows,
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`✔ تم إنشاء download/version.json — الإصدار v${version}`);

  // ── تحديث القيم الثابتة في index.html ────────────────────────────────────
  if (fs.existsSync(INDEX_PATH)) {
    let html = fs.readFileSync(INDEX_PATH, 'utf8');

    // نص الإصدار داخل أي عنصر يحمل data-app-version
    html = html.replace(
      /(<[^>]*\bdata-app-version\b[^>]*>)\s*v?[\d.]+\s*(<)/g,
      `$1v${version}$2`
    );

    // رقم الإصدار في البيانات المهيكلة JSON-LD
    html = html.replace(/("softwareVersion"\s*:\s*")[\d.]+(")/g, `$1${version}$2`);

    // روابط ملف الأندرويد
    if (android) {
      html = html.replace(
        /(<a[^>]*\bdata-dl="android"[^>]*\bhref=")[^"]*(")/g,
        `$1${android.url}$2`
      );
    }

    // روابط ملف ويندوز وحالة توفره
    html = html.replace(
      /(<a[^>]*\bdata-dl="windows"[^>]*\bhref=")[^"]*(")/g,
      `$1${windows ? windows.url : '#download'}$2`
    );
    html = html.replace(
      /(\bdata-dl="windows"[^>]*\bdata-available=")(true|false)(")/g,
      `$1${windows ? 'true' : 'false'}$3`
    );

    fs.writeFileSync(INDEX_PATH, html, 'utf8');
    console.log('✔ تم تحديث القيم الثابتة في index.html');
  }

  console.log(`   • Android: ${android ? android.file : '— غير متوفر'}`);
  console.log(`   • Windows: ${windows ? windows.file : '— غير متوفر (سيظهر «قريباً»)'}`);
}

main();
