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
app.use(express.json());

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

// --- LOGIN JWT-vel ---
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

    // JWT token generálás
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Sikeres bejelentkezés!", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Bejelentkezés sikertelen." });
  }
});

// --- PROTECTED ROUTE példa ---
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

app.listen(port, () => {
  console.log(`Backend is running on this port: ${port}`);
});
