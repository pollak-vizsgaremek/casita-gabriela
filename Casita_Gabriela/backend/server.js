// server.js
import express from 'express';
import cors from 'cors';
import { PrismaClient } from './generated/prisma/client.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const app = express();
const port = process.env.PORT || 6969;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/* ---------- Helperek ---------- */

// Biztonságos parse: ha room.images JSON string, parse-olja; ha Buffer/blob, konvertálja base64-re; ha már tömb, visszaadja
const normalizeImagesFromDb = (imagesField) => {
  if (!imagesField) return [];
  // Prisma MySQL esetén images lehet string (JSON string), vagy Buffer (korábbi blob)
  try {
    // Ha már tömb
    if (Array.isArray(imagesField)) return imagesField;

    // Ha Buffer (Node Buffer)
    if (Buffer.isBuffer(imagesField)) {
      const b64 = imagesField.toString('base64');
      return [`data:image/jpeg;base64,${b64}`];
    }

    // Ha string: lehet JSON string vagy egy sima base64/dataURL
    if (typeof imagesField === 'string') {
      // próbáljuk JSON-ként parse-olni
      try {
        const parsed = JSON.parse(imagesField);
        if (Array.isArray(parsed)) return parsed;
        // ha parse sikeres, de nem tömb, csomagoljuk tömbbe
        return [parsed];
      } catch (e) {
        // nem JSON: lehet sima base64 vagy dataURL -> csomagoljuk tömbbe
        return [imagesField];
      }
    }

    return [];
  } catch (err) {
    console.error('normalizeImagesFromDb error:', err);
    return [];
  }
};

// A frontendről érkező images mezőt normalizáljuk: lehet array, lehet single string, lehet Buffer (nem ajánlott)
const normalizeImagesForSave = (images) => {
  if (!images) return null;
  if (Array.isArray(images)) return images;
  if (typeof images === 'string') return [images];
  // ha valami más (pl. Buffer), próbáljuk base64-re konvertálni
  if (Buffer.isBuffer(images)) {
    return [`data:image/jpeg;base64,${images.toString('base64')}`];
  }
  return null;
};

// id validáció: visszatér a Number(id) ha érvényes egész, különben null
const parseId = (idParam) => {
  const n = Number(idParam);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
};

/* ---------- Auth / User ---------- */

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
    const token = jwt.sign({ id: user.id, email: user.email, role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Sikeres bejelentkezés!', token, role });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: 'Bejelentkezés sikertelen.' });
  }
});

app.get('/protected', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token hiányzik.' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ message: 'Védett adatok', user: decoded });
  } catch (err) {
    res.status(401).json({ error: 'Érvénytelen token.' });
  }
});

/* ---------- ROOMS ---------- */

// GET /rooms - listázás (images tömbként)
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

// POST /rooms - létrehozás (images: array vagy string)
app.post('/rooms', async (req, res) => {
  const { name, description, price, category, space, images } = req.body;
  try {
    if (!name || !description || !price || !category || !space) {
      return res.status(400).json({ error: 'Minden mező kitöltése kötelező!' });
    }
    const imagesToSave = normalizeImagesForSave(images); // array vagy null
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

// GET /rooms/:id - lekérés id alapján (id validálva)
app.get('/rooms/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Érvénytelen id paraméter.' });

  try {
    const room = await prisma.room.findUnique({
      where: { id },
      include: { booking: true, room_review: true },
    });
    if (!room) return res.status(404).json({ error: 'A szoba nem található.' });
    const formatted = { ...room, images: normalizeImagesFromDb(room.images) };
    res.json(formatted);
  } catch (err) {
    console.error('GET /rooms/:id error:', err);
    res.status(500).json({ error: 'A szoba lekérése sikertelen.' });
  }
});

// PUT /rooms/:id - frissítés (images: array vagy string vagy null)
app.put('/rooms/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Érvénytelen id paraméter.' });

  const { name, description, price, category, space, images } = req.body;
  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseInt(price, 10);
    if (category !== undefined) updateData.category = category;
    if (space !== undefined) updateData.space = parseInt(space, 10);

    if (images !== undefined) {
      const imagesToSave = normalizeImagesForSave(images);
      updateData.images = imagesToSave ? JSON.stringify(imagesToSave) : null;
    }

    const room = await prisma.room.update({
      where: { id },
      data: updateData,
    });

    const formatted = { ...room, images: normalizeImagesFromDb(room.images) };
    res.json({ message: 'Szoba sikeresen frissítve!', room: formatted });
  } catch (err) {
    console.error('PUT /rooms/:id error:', err);
    res.status(500).json({ error: 'A szoba frissítése sikertelen.' });
  }
});

// DELETE /rooms/:id
app.delete('/rooms/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Érvénytelen id paraméter.' });

  try {
    const room = await prisma.room.delete({ where: { id } });
    res.json({ message: 'Szoba sikeresen törölve!', room });
  } catch (err) {
    console.error('DELETE /rooms/:id error:', err);
    res.status(500).json({ error: 'A szoba törlése sikertelen.' });
  }
});

/* ---------- BOOKINGS ---------- */

app.get('/bookings', async (req, res) => {
  const { room_id } = req.query;
  try {
    const where = room_id ? { room_id: parseInt(room_id, 10) } : {};
    const bookings = await prisma.booking.findMany({ where, orderBy: { id: 'desc' } });
    res.json(bookings);
  } catch (err) {
    console.error('GET /bookings error:', err);
    res.status(500).json({ error: 'Foglalások lekérése sikertelen.' });
  }
});

app.post('/bookings', async (req, res) => {
  const { arrival_date, departure_date, people, booking_date, status, user_id, room_id } = req.body;
  try {
    if (!arrival_date || !departure_date || !people || !room_id) {
      return res.status(400).json({ error: 'Hiányzó kötelező mezők.' });
    }
    const created = await prisma.booking.create({
      data: {
        arrival_date,
        departure_date,
        people: parseInt(people, 10),
        booking_date: booking_date || new Date().toISOString().slice(0, 10),
        status: status || 'pending',
        user_id: user_id ? parseInt(user_id, 10) : null,
        room_id: parseInt(room_id, 10),
      },
    });
    res.status(201).json(created);
  } catch (err) {
    console.error('POST /bookings error:', err);
    res.status(500).json({ error: 'Foglalás létrehozása sikertelen.' });
  }
});

app.put('/bookings/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Érvénytelen id paraméter.' });
  const data = req.body;
  try {
    const updated = await prisma.booking.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    console.error('PUT /bookings/:id error:', err);
    res.status(500).json({ error: 'Foglalás frissítése sikertelen.' });
  }
});

/* ---------- Health ---------- */
app.get('/', (req, res) => res.json({ status: 'ok', message: 'Backend fut' }));

/* ---------- Start ---------- */
app.listen(port, () => {
  console.log(`Backend is running on port: ${port}`);
});
