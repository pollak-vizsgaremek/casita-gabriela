import express from 'express';
import cors from "cors";
import { PrismaClient } from './generated/prisma/client.js';
import bcrypt from "bcrypt"; 
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config(); // .env betöltése

const JWT_SECRET = process.env.JWT_SECRET; // titkos kulcs .env-ből
const app = express();
const port = 6969;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- REGISZTRÁCIÓ ---
app.post("/register", async (req, res) => {
  const { name, email, password, phone_number, birth_date, address, identity_card } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone_number,
        birth_date: new Date(birth_date),
        address,
        identity_card,
      },
    });

    res.json({ message: "User registered successfully!", user });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Registration failed. Email may already exist or invalid data." });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: "Nincs ilyen felhasználó." });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Hibás jelszó." });
    }

    // Role az adatbázisból
    const role = user.isAdmin ? "admin" : "user";

    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Sikeres bejelentkezés!", token, role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Bejelentkezés sikertelen." });
  }
});

// --- PROTECTED példa ---
app.get("/protected", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token hiányzik." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ message: "Protected adat", user: decoded });
  } catch (err) {
    res.status(401).json({ error: "Érvénytelen token." });
  }
});

// --- GET ALL ROOMS ---
app.get("/rooms", async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        booking: true,
        room_review: true,
      },
    });
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch rooms." });
  }
});

// --- CREATE ROOM ---
app.post("/rooms", async (req, res) => {
  const { name, description, price, category, space, images } = req.body;

  try {
    // Validation
    if (!name || !description || !price || !category || !space) {
      return res.status(400).json({ error: "Minden mező kitöltése kötelező!" });
    }

    if (name.length > 30) {
      return res.status(400).json({ error: "A szoba neve maximum 30 karakter lehet!" });
    }

    if (description.length > 1000) {
      return res.status(400).json({ error: "A leírás maximum 1000 karakter lehet!" });
    }

    if (category.length > 20) {
      return res.status(400).json({ error: "A típus maximum 20 karakter lehet!" });
    }

    const room = await prisma.room.create({
      data: {
        name,
        description,
        price: parseInt(price),
        category,
        space: parseInt(space),
        ac_availablity: 0,
        images: images ? Buffer.from(images, 'base64') : null,
      },
      include: {
        booking: true,
        room_review: true,
      },
    });

    res.json({ message: "Room created successfully!", room });
  } catch (err) {
    console.error("Room creation error:", err.message);
    console.error("Full error:", err);
    res.status(400).json({ error: `Szoba létrehozás sikertelen: ${err.message}` });
  }
});

// --- GET ROOM BY ID ---
app.get("/rooms/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const room = await prisma.room.findUnique({
      where: { id: parseInt(id) },
      include: {
        booking: true,
        room_review: true,
      },
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found." });
    }

    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch room." });
  }
});

app.listen(port, () => {
  console.log(`Backend is running on port: ${port}`);
});
