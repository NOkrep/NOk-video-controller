import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const archiver = require('archiver');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '0.4.6',
    name: 'NOk Video Controller'
  });
});

// ZIP Download endpoint for the unpacked extension
app.get('/api/download-zip', (req, res) => {
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename=NOk-video-controller-v0.4.6.zip');

  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('error', (err) => {
    res.status(500).send({ error: err.message });
  });

  archive.pipe(res);

  // Add extension files
  const extensionFiles = [
    'manifest.json',
    'background.js',
    'content.js',
    'injected.js',
    'injected.css',
    'popup.html',
    'popup.js',
    'README.md'
  ];

  extensionFiles.forEach((file) => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: file });
    }
  });

  // Add icons directory
  const iconsDir = path.join(__dirname, 'icons');
  if (fs.existsSync(iconsDir)) {
    archive.directory(iconsDir, 'icons');
  }

  archive.finalize();
});

// Serve static assets from project root
app.use(express.static(__dirname));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`NOk Video Controller app running at http://${HOST}:${PORT}`);
});
