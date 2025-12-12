import express from 'express';
import cors from "cors";
import { PrismaClient } from './generated/prisma/client.js';
import bcrypt from "bcrypt"; 
const app = express()
const port = 6969
const prisma = new PrismaClient();

app.use(cors());


app.post("/register", async (req, res) => {
  const { name, email, password, phone_number, birth_date, address, identity_card } = req.body;

  try {
    // bcrypt hash
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone_number,
        birth_date: new Date(birth_date), // frontendről pl. "1990-01-01"
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

app.listen(port, () => {console.log(`Backend is running on this port: ${port}`)
})
