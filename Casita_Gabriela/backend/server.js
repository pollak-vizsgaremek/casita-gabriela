// server.js

import express from 'express';
import cors from 'cors';
import { PrismaClient } from './generated/prisma/client.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const app = express();
const port = process.env.PORT || 6969;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure backend/public exists
const PUBLIC_DIR = path.join(process.cwd(), 'public');
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Serve static files
app.use('/public', express.static(PUBLIC_DIR));

/* ---------- Helpers ---------- */

const normalizeImagesFromDb = (imagesField) => {
  if (!imagesField) return [];
  try {
    if (Array.isArray(imagesField)) return imagesField;
    if (Buffer.isBuffer(imagesField)) {
      const b64 = imagesField.toString('base64');
      return [`data:image/jpeg;base64,${b64}`];
    }
    if (typeof imagesField === 'string') {
      try {
        const parsed = JSON.parse(imagesField);
        if (Array.isArray(parsed)) return parsed;
        return [parsed];
      } catch (e) {
        return [imagesField];
      }
    }
    return [];
  } catch (err) {
    console.error('normalizeImagesFromDb error:', err);
    return [];
  }
};

const normalizeImagesForSave = (images) => {
  if (!images) return null;
  if (Array.isArray(images)) return images;
  if (typeof images === 'string') return [images];
  if (Buffer.isBuffer(images)) {
    return [`data:image/jpeg;base64,${images.toString('base64')}`];
  }
  return null;
};

const parseId = (idParam) => {
  const n = Number(idParam);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
};

/* ---------- Multer setup (NO TIMESTAMP) ---------- */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PUBLIC_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // <-- NO TIMESTAMP, ORIGINAL NAME
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

/* ---------- Upload endpoint ---------- */

app.post('/upload-images', upload.array('images', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nincs feltöltött fájl.' });
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const paths = req.files.map((f) => `${baseUrl}/public/${f.filename}`);
    res.json({ paths });
  } catch (err) {
    console.error('UPLOAD IMAGES ERROR:', err);
    res.status(500).json({ error: 'Hiba a képek feltöltésekor.' });
  }
});

/* ---------- Auth ---------- */

app.post('/register', async (req, res) => {
  const { name, email, password, phone_number, birth_date, address, identity_card } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone_number,
        birth_date: birth_date ? new Date(birth_date) : null,
        address,
        identity_card,
      },
    });
    res.json({ message: 'Felhasználó sikeresen regisztrálva!', user });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(400).json({ error: 'A regisztráció sikertelen. Az e-mail már létezhet vagy az adatok érvénytelenek.' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Nincs ilyen felhasználó.' });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Hibás jelszó.' });
    const role = user.isAdmin ? 'admin' : 'user';
    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    };
    console.log('LOGIN OK – sending to frontend:', {
      message: 'Sikeres bejelentkezés!',
      token,
      role,
      user: safeUser,
    });
    res.json({
      message: 'Sikeres bejelentkezés!',
      token,
      role,
      user: safeUser,
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: 'Bejelentkezés sikertelen.' });
  }
});

/* ---------- Rooms ---------- */

app.get('/rooms', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      include: { booking: true, room_review: true },
    });
    const formatted = rooms.map((room) => ({
      ...room,
      images: normalizeImagesFromDb(room.images),
    }));
    res.json(formatted);
  } catch (err) {
    console.error('GET /rooms error:', err);
    res.status(500).json({ error: 'Hiba a szobák lekérésekor.' });
  }
});

app.post('/rooms', async (req, res) => {
  const { name, description, price, category, space, images } = req.body;
  try {
    if (!name || !description || !price || !category || !space) {
      return res.status(400).json({ error: 'Minden mező kitöltése kötelező!' });
    }
    const imagesToSave = normalizeImagesForSave(images);
    const room = await prisma.room.create({
      data: {
        name,
        description,
        price: parseInt(price, 10),
        category,
        space: parseInt(space, 10),
        ac_availablity: 0,
        images: imagesToSave ? JSON.stringify(imagesToSave) : null,
      },
      include: { booking: true, room_review: true },
    });
    const formatted = { ...room, images: normalizeImagesFromDb(room.images) };
    res.json({ message: 'Szoba sikeresen létrehozva!', room: formatted });
  } catch (err) {
    console.error('POST /rooms error:', err);
    res.status(400).json({ error: `Szoba létrehozás sikertelen: ${err.message}` });
  }
});

app.get('/rooms/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Érvénytelen id.' });
  try {
    const room = await prisma.room.findUnique({
      where: { id },
      include: { booking: true, room_review: true },
    });
    if (!room) return res.status(404).json({ error: 'Szoba nem található.' });
    const formatted = { ...room, images: normalizeImagesFromDb(room.images) };
    res.json(formatted);
  } catch (err) {
    console.error('GET /rooms/:id error:', err);
    res.status(500).json({ error: 'Hiba a szoba lekérésekor.' });
  }
});

app.put('/rooms/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Érvénytelen id.' });
  const { name, description, price, category, space, images } = req.body;
  try {
    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Szoba nem található.' });
    const imagesToSave = normalizeImagesForSave(images);
    const updated = await prisma.room.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        description: description ?? existing.description,
        price: price !== undefined ? parseInt(price, 10) : existing.price,
        category: category ?? existing.category,
        space: space !== undefined ? parseInt(space, 10) : existing.space,
        images: imagesToSave ? JSON.stringify(imagesToSave) : existing.images,
      },
      include: { booking: true, room_review: true },
    });
    const formatted = { ...updated, images: normalizeImagesFromDb(updated.images) };
    res.json({ message: 'Szoba sikeresen frissítve!', room: formatted });
  } catch (err) {
    console.error('PUT /rooms/:id error:', err);
    res.status(400).json({ error: `Szoba frissítés sikertelen: ${err.message}` });
  }
});

app.delete('/rooms/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Érvénytelen id.' });
  try {
    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Szoba nem található.' });
    await prisma.room.delete({ where: { id } });
    res.json({ message: 'Szoba sikeresen törölve!' });
  } catch (err) {
    console.error('DELETE /rooms/:id error:', err);
    res.status(500).json({ error: 'Hiba a szoba törlésekor.' });
  }
});

/* ---------- Bookings ---------- */

app.get('/bookings', async (req, res) => {
  try {
    const where = {};
    if (req.query.room_id) {
      const rid = parseId(req.query.room_id);
      if (rid) where.room_id = rid;
    }

    // A schema.prisma szerint nincs created_at mező a booking modellen.
    // Rendezéshez használjuk a booking_date mezőt (létezik a sémában).
    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { booking_date: 'desc' },
    });

    res.json(bookings);
  } catch (err) {
    console.error('GET /bookings error:', err);
    res.status(500).json({ error: 'Hiba a foglalások lekérésekor.' });
  }
});

app.put('/bookings/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Érvénytelen id.' });
  try {
    const data = {};
    if (req.body.status) data.status = req.body.status;
    const updated = await prisma.booking.update({
      where: { id },
      data,
    });
    res.json({ message: 'Foglalás frissítve', booking: updated });
  } catch (err) {
    console.error('PUT /bookings/:id error:', err);
    res.status(400).json({ error: 'Hiba a foglalás frissítésekor.' });
  }
});

/* ---------- Reviews ---------- */

app.get('/room_reviews', async (req, res) => {
  try {
    const where = {};
    if (req.query.room_id) {
      const rid = parseId(req.query.room_id);
      if (rid) where.room_id = rid;
    }

    // A room_review modellben nincs created_at mező a sémában.
    // Rendezéshez használjuk az id mezőt (legújabbak elöl).
    const reviews = await prisma.room_review.findMany({
      where,
      orderBy: { id: 'desc' },
    });

    res.json(reviews);
  } catch (err) {
    console.error('GET /room_reviews error:', err);
    res.status(500).json({ error: 'Hiba az értékelések lekérésekor.' });
  }
});

/* ---------- Start server ---------- */

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
