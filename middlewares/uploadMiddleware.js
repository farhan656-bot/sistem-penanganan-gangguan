const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILE_COUNT = 5;
const uploadRootDir = path.join(__dirname, '../public/uploads');
const completionUploadDir = path.join(uploadRootDir, 'completion');
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);
const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
]);
const allowedMimeExtensionMap = {
  'image/jpeg': new Set(['.jpg', '.jpeg']),
  'image/png': new Set(['.png']),
  'image/webp': new Set(['.webp']),
  'application/pdf': new Set(['.pdf'])
};
const blockedExtensions = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.js',
  '.php',
  '.html',
  '.zip',
  '.rar',
  '.7z'
]);

function ensureUploadDir(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

ensureUploadDir(uploadRootDir);
ensureUploadDir(completionUploadDir);

function getFileExtension(file) {
  return path.extname(file && file.originalname ? file.originalname : '').toLowerCase();
}

function hasBlockedExtension(fileName) {
  const normalizedName = path.basename(String(fileName || '')).toLowerCase();

  for (const blockedExtension of blockedExtensions) {
    if (
      normalizedName.endsWith(blockedExtension) ||
      normalizedName.includes(`${blockedExtension}.`)
    ) {
      return true;
    }
  }

  return false;
}

function buildSafeStoredName(file) {
  const extension = getFileExtension(file);
  const uniqueId = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

  return `completion-${uniqueId}${extension}`;
}

function sanitizeOriginalName(fileName) {
  const baseName = path.basename(String(fileName || 'bukti-penyelesaian'));
  const sanitized = baseName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 120);

  return sanitized || 'bukti-penyelesaian';
}

function isPathInsideUploadRoot(filePath) {
  const resolvedRoot = path.resolve(uploadRootDir);
  const resolvedFilePath = path.resolve(filePath);

  return (
    resolvedFilePath === resolvedRoot ||
    resolvedFilePath.startsWith(resolvedRoot + path.sep)
  );
}

async function cleanupUploadedFiles(req) {
  const uploadedFiles = []
    .concat(req.file || [])
    .concat(Array.isArray(req.files) ? req.files : []);

  await Promise.all(uploadedFiles.map(async (file) => {
    if (!file || !file.path || !isPathInsideUploadRoot(file.path)) {
      return;
    }

    try {
      await fs.promises.unlink(file.path);
    } catch (error) {
      if (!error || error.code !== 'ENOENT') {
        console.error('Gagal menghapus file upload sementara:', error.message || error);
      }
    }
  }));
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, completionUploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, buildSafeStoredName(file));
  }
});

const fileFilter = (req, file, cb) => {
  const extension = getFileExtension(file);
  const mimeType = String(file && file.mimetype ? file.mimetype : '').toLowerCase();
  const allowedExtensionsForMime = allowedMimeExtensionMap[mimeType];

  if (blockedExtensions.has(extension) || hasBlockedExtension(file.originalname)) {
    return cb(new Error('Tipe file tidak diizinkan. File EXE, script, arsip, atau HTML tidak boleh diunggah.'));
  }

  if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(mimeType)) {
    return cb(new Error('Format file tidak didukung. Gunakan JPG, JPEG, PNG, WEBP, atau PDF.'));
  }

  if (!allowedExtensionsForMime || !allowedExtensionsForMime.has(extension)) {
    return cb(new Error('Ekstensi file tidak sesuai dengan tipe file. Gunakan JPG, JPEG, PNG, WEBP, atau PDF.'));
  }

  file.safeOriginalName = sanitizeOriginalName(file.originalname);
  return cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILE_COUNT
  },
  fileFilter
});

function getUploadErrorMessage(error) {
  if (!error) {
    return 'Upload file gagal diproses.';
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return 'Ukuran file terlalu besar. Maksimal 5 MB per file.';
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return 'Jumlah file terlalu banyak. Maksimal 5 file per upload.';
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      if (error.field === 'proof_file') {
        return 'Jumlah file terlalu banyak. Maksimal 5 file bukti per upload.';
      }

      return 'Field upload tidak valid. Gunakan field bukti penyelesaian yang tersedia.';
    }
  }

  return error.message || 'Upload file gagal diproses.';
}

function uploadCompletionEvidence(req, res, next) {
  upload.array('proof_file', MAX_FILE_COUNT)(req, res, async (error) => {
    if (!error) {
      return next();
    }

    await cleanupUploadedFiles(req);
    req.flash('error_msg', getUploadErrorMessage(error));
    return res.redirect(`/reports/${req.params.id}`);
  });
}

function getUploadedEvidenceFiles(req) {
  if (Array.isArray(req.files)) {
    return req.files;
  }

  return req.file ? [req.file] : [];
}

module.exports = upload;
module.exports.MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES;
module.exports.MAX_FILE_COUNT = MAX_FILE_COUNT;
module.exports.allowedExtensions = allowedExtensions;
module.exports.allowedMimeTypes = allowedMimeTypes;
module.exports.cleanupUploadedFiles = cleanupUploadedFiles;
module.exports.getUploadedEvidenceFiles = getUploadedEvidenceFiles;
module.exports.sanitizeOriginalName = sanitizeOriginalName;
module.exports.uploadCompletionEvidence = uploadCompletionEvidence;
