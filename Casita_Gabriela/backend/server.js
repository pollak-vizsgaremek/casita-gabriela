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
import nodemailer from "nodemailer";

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
    const token = jwt.sign({ id: user.id, email: user.email, role }, JWT_SECRET, { expiresIn: '1h' });
    const safeUser = { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin };
    console.log('LOGIN OK – sending to frontend:', { message: 'Sikeres bejelentkezés!', token, role, user: safeUser });
    res.json({ message: 'Sikeres bejelentkezés!', token, role, user: safeUser });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: 'Bejelentkezés sikertelen.' });
  }
});

/* ---------- Rooms ---------- */

app.get('/rooms', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({ include: { booking: true, room_review: true } });
    const formatted = rooms.map((room) => ({ ...room, images: normalizeImagesFromDb(room.images) }));
    res.json(formatted);
  } catch (err) {
    console.error('GET /rooms error:', err);
    res.status(500).json({ error: 'Hiba a szobák lekérésekor.' });
  }
});

app.post('/rooms', async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      space,
      images,
      isHighlighted
    } = req.body;

    const room = await prisma.room.create({
      data: {
        name,
        description,
        price: Number(price),
        category,
        space: Number(space),
        images: images ? JSON.stringify(images) : null,
        isHighlighted: Boolean(isHighlighted)   // ÚJ
      }
    });

    res.json({ room });
  } catch (err) {
    console.error('POST /rooms error:', err);
    res.status(500).json({ error: 'Hiba történt a szoba létrehozásakor.' });
  }
});


app.get('/rooms/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Érvénytelen id.' });
  try {
    const room = await prisma.room.findUnique({ where: { id }, include: { booking: true, room_review: true } });
    if (!room) return res.status(404).json({ error: 'Szoba nem található.' });
    const formatted = { ...room, images: normalizeImagesFromDb(room.images) };
    res.json(formatted);
  } catch (err) {
    console.error('GET /rooms/:id error:', err);
    res.status(500).json({ error: 'Hiba a szoba lekérésekor.' });
  }
});

app.put('/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      price,
      category,
      space,
      images,
      isHighlighted
    } = req.body;

    const updated = await prisma.room.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        price: Number(price),
        category,
        space: Number(space),
        images: images ? JSON.stringify(images) : null,
        isHighlighted: Boolean(isHighlighted)   // ÚJ
      }
    });

    res.json(updated);
  } catch (err) {
    console.error('PUT /rooms/:id error:', err);
    res.status(500).json({ error: 'Hiba történt a szoba frissítésekor.' });
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

/*
  Important:
  - Prisma schema requires arrival_date, departure_date and people (Int).
  - The frontend may send either `people` or `guests`. We normalize to `people`.
  - Do NOT send fields that don't exist in the schema (e.g., `guests`) to prisma.create.
*/

const createBookingHandler = async (req, res) => {
  try {
    const {
  room_id,
  user_id,
  booking_date,
  status,
  guests,
  people,
  arrival_date,
  departure_date,
} = req.body;

// Magyar időzóna korrekció (CET/CEST automatikusan)
const local = new Date(booking_date);
const corrected = new Date(local.getTime() - local.getTimezoneOffset() * 60000);

const peopleCount =
  people !== undefined && people !== null
    ? parseInt(people, 10)
    : guests !== undefined && guests !== null
    ? parseInt(guests, 10)
    : 1;

const created = await prisma.booking.create({
  data: {
    room_id: parseInt(room_id, 10),
    user_id: user_id ? parseInt(user_id, 10) : null,
    booking_date: corrected,
    status: status ?? 'pending',
    people: peopleCount,
    arrival_date: new Date(arrival_date),
    departure_date: new Date(departure_date),
  },
});



    res.json({ message: 'Foglalás sikeresen létrehozva!', booking: created });
  } catch (err) {
    console.error('POST /booking error:', err);
    res.status(500).json({ error: 'Hiba a foglalás létrehozásakor.' });
  }
};

// POST /booking (singular)
app.post('/booking', createBookingHandler);

// POST /bookings (plural alias)
app.post('/bookings', createBookingHandler);

app.get('/booking', async (req, res) => {
  try {
    const where = {};
    if (req.query.room_id) {
      const rid = parseId(req.query.room_id);
      if (rid) where.room_id = rid;
    }
    const bookings = await prisma.booking.findMany({ where, orderBy: { booking_date: 'desc' } });
    res.json(bookings);
  } catch (err) {
    console.error('GET /booking error:', err);
    res.status(500).json({ error: 'Hiba a foglalások lekérésekor.' });
  }
});

// alias GET /bookings
app.get('/bookings', async (req, res) => {
  try {
    const where = {};
    if (req.query.room_id) {
      const rid = parseId(req.query.room_id);
      if (rid) where.room_id = rid;
    }
    const bookings = await prisma.booking.findMany({ where, orderBy: { booking_date: 'desc' } });
    res.json(bookings);
  } catch (err) {
    console.error('GET /bookings error:', err);
    res.status(500).json({ error: 'Hiba a foglalások lekérésekor.' });
  }
});

app.put('/booking/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Érvénytelen id.' });
  try {
    const data = {};
    if (req.body.status) data.status = req.body.status;
    if (req.body.people !== undefined) data.people = parseInt(req.body.people, 10);
    if (req.body.arrival_date) data.arrival_date = new Date(req.body.arrival_date);
    if (req.body.departure_date) data.departure_date = new Date(req.body.departure_date);
    const updated = await prisma.booking.update({ where: { id }, data });
    res.json({ message: 'Foglalás frissítve', booking: updated });
  } catch (err) {
    console.error('PUT /booking/:id error:', err);
    res.status(400).json({ error: 'Hiba a foglalás frissítésekor.' });
  }
});

// alias PUT /bookings/:id
app.put('/bookings/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Érvénytelen id.' });
  try {
    const data = {};
    if (req.body.status) data.status = req.body.status;
    if (req.body.people !== undefined) data.people = parseInt(req.body.people, 10);
    if (req.body.arrival_date) data.arrival_date = new Date(req.body.arrival_date);
    if (req.body.departure_date) data.departure_date = new Date(req.body.departure_date);
    const updated = await prisma.booking.update({ where: { id }, data });
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
    const reviews = await prisma.room_review.findMany({ where, orderBy: { id: 'desc' } });
    res.json(reviews);
  } catch (err) {
    console.error('GET /room_reviews error:', err);
    res.status(500).json({ error: 'Hiba az értékelések lekérésekor.' });
  }
});

/* ---------- Contact ---------- */

app.post('/contact', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !phone || !subject || !message) {
    return res.status(400).json({ error: "Minden mező kötelező!" });
  }
  try {
    await prisma.form.create({
      data: {
        name,
        email,
        phone_number: phone,
        topic: subject,
        description: message,
      },
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Casa Gabriel" <${process.env.EMAIL_USER}>`,
      to: "casitagabriela.mailer@gmail.com",
      subject: `Új kapcsolatfelvétel: ${subject}`,
      html: `
<div style="
font-family: Arial, sans-serif;
background-color: #f6f7fb;
padding: 30px;
">
<div style="
max-width: 600px;
margin: auto;
background: white;
border-radius: 12px;
overflow: hidden;
box-shadow: 0 10px 25px rgba(0,0,0,0.08);
">
<!-- HEADER -->
<div style="
background: linear-gradient(135deg, #ff4b2b, #ff416c);
color: white;
padding: 20px;
text-align: center;
">
<h2 style="margin: 0;"> Új kapcsolatfelvétel</h2>
<p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">
Casa Gabriel
</p>
</div>
<!-- BODY -->
<div style="padding: 25px; color: #333;">
<div style="margin-bottom: 15px;">
<strong> Név:</strong><br/>
${name}
</div>
<div style="margin-bottom: 15px;">
<strong> Email:</strong><br/>
${email}
</div>
<div style="margin-bottom: 15px;">
<strong> Telefon:</strong><br/>
${phone}
</div>
<div style="margin-bottom: 15px;">
<strong> Tárgy:</strong><br/>
${subject}
</div>
<div style="
margin-top: 20px;
padding: 15px;
background: #f9f9f9;
border-left: 4px solid #ff416c;
border-radius: 6px;
">
<strong> Üzenet:</strong><br/><br/>
${message}
</div>
</div>
<!-- FOOTER -->
<div style="
text-align: center;
padding: 15px;
font-size: 12px;
color: #888;
">
Casa Gabriel • Automatikus értesítés
</div>
</div>
</div>
`,
    };

    await transporter.sendMail(mailOptions);

    await transporter.sendMail({
      from: `"Casa Gabriel" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Köszönjük az üzeneted! ",
      html: `
<div style="
font-family: Arial, sans-serif;
background-color: #f6f7fb;
padding: 30px;
">
<div style="
max-width: 600px;
margin: auto;
background: white;
border-radius: 12px;
overflow: hidden;
box-shadow: 0 10px 25px rgba(0,0,0,0.08);
">
<!-- HEADER -->
<div style="
background: linear-gradient(135deg, #6fd98c, #3bb78f);
color: white;
padding: 20px;
text-align: center;
">
<h2 style="margin: 0;"> Üzeneted megkaptuk</h2>
<p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">
Casa Gabriel
</p>
</div>
<!-- BODY -->
<div style="padding: 25px; color: #333;">
<p>Kedves <strong>${name}</strong>!</p>
<p>Köszönjük, hogy felvetted velünk a kapcsolatot.</p>
<p>Üzenetedet megkaptuk, és hamarosan válaszolunk.</p>
<div style="
margin-top: 20px;
padding: 15px;
background: #f9f9f9;
border-left: 4px solid #3bb78f;
border-radius: 6px;
">
<strong> Tárgy:</strong> ${subject}
<br/><br/>
<strong> Üzenet:</strong><br/>
${message}
</div>
<p style="margin-top: 25px;">
Üdvözlettel,<br/>
<strong>Casa Gabriel</strong>
</p>
</div>
<!-- FOOTER -->
<div style="
text-align: center;
padding: 15px;
font-size: 12px;
color: #888;
">
Ez egy automatikus visszaigazoló email, ne válaszoljon rá.
</div>
</div>
</div>
`,
    });

    res.json({ message: "Üzenet sikeresen elküldve!" });
  } catch (err) {
    console.error("CONTACT ERROR:", err);
    res.status(500).json({ error: "Hiba az üzenet küldésekor." });
  }
});

/* ---------- Start server ---------- */

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
