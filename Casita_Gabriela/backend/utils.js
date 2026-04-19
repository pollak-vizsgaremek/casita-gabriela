import multer from "multer";
import path from "path";
import fs from "fs";

// ---------- IMAGE NORMALIZERS ----------
export const normalizeImagesFromDb = (imagesField) => {
  if (!imagesField) return [];
  try {
    if (Array.isArray(imagesField)) return imagesField;
    if (Buffer.isBuffer(imagesField)) {
      const b64 = imagesField.toString("base64");
      return [`data:image/jpeg;base64,${b64}`];
    }
    if (typeof imagesField === "string") {
      try {
        const parsed = JSON.parse(imagesField);
        if (Array.isArray(parsed)) return parsed;
        return [parsed];
      } catch {
        return [imagesField];
      }
    }
    return [];
  } catch {
    return [];
  }
};

export const parseId = (idParam) => {
  const n = Number(idParam);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
};

// ---------- MULTER (fájl feltöltés) ----------
const PUBLIC_DIR = path.join(process.cwd(), "public");
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, PUBLIC_DIR),
  filename: (_, file, cb) => cb(null, file.originalname), // eredeti név
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});
