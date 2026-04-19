import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { PrismaClient } from "./generated/prisma/client.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Nodemailer transporter (Gmail)
export const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ---------- Registration via email verification ---------- */

/**
 * POST /register-init
 * - Validates minimal input
 * - Hashes password
 * - Creates a JWT token containing the user data (hashed password)
 * - Sends a verification email with a link to /verify-registration?token=...
 */
export const registerInit = async (req, res) => {
  try {
    const { name, email, password, phone_number, birth_date, address, identity_card } = req.body;

    // Basic validation (keep it minimal here; frontend should validate too)
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Név, email és jelszó kötelező." });
    }

    // Check if email already exists
    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Ezzel az email címmel már regisztráltak." });
    }

    // Hash password now so we don't put plain password into token
    const hashedPassword = await bcrypt.hash(password, 10);

    // Build payload for token (store only what's necessary)
    const payload = {
      name,
      email,
      password: hashedPassword,
      phone_number: phone_number || null,
      birth_date: birth_date || null,
      address: address || null,
      identity_card: identity_card || null,
    };

    // Token valid for 24 hours
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });

    // Verification link (frontend route where user clicks; backend verify endpoint below)
    const verifyUrl = `http://localhost:5173/verify?token=${token}`;

    // Friendly HTML email
    const html = `
      <div style="font-family:Arial,sans-serif;background:#f6f7fb;padding:30px;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;padding:24px;">
          <h2 style="color:#333;margin-bottom:8px;">Regisztráció megerősítése</h2>
          <p style="color:#555;line-height:1.4;">
            Köszönjük, hogy regisztráltál. A regisztráció befejezéséhez kérjük, erősítsd meg az email címedet.
          </p>
          <p style="color:#555;line-height:1.4;">
            Erre a linkre kattintva tudod hitelesíteni a regisztrációt:
          </p>
          <p style="margin:18px 0;">
            <a href="${verifyUrl}" style="display:inline-block;padding:12px 20px;background:#6FD98C;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
              Regisztráció megerősítése
            </a>
          </p>
          <p style="color:#999;font-size:13px;">
            Ha a fenti gomb nem működik, másold be ezt a linket a böngésződbe:<br/>
            <a href="${verifyUrl}" style="color:#1a73e8;">${verifyUrl}</a>
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:18px 0;" />
          <p style="color:#777;font-size:13px;">Ha nem te kezdeményezted a regisztrációt, egyszerűen hagyd figyelmen kívül ezt az emailt.</p>
        </div>
      </div>
    `;

    // Send email
    await mailer.sendMail({
      from: `"Casa Gabriel" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Regisztráció megerősítése",
      html,
    });

    res.json({ message: "Megerősítő email elküldve. Kérjük, ellenőrizd a postaládádat." });
  } catch (err) {
    console.error("REGISTER-INIT ERROR:", err);
    res.status(500).json({ error: "Hiba történt a regisztráció kezdeményezésekor." });
  }
};

/**
 * GET /verify-registration?token=...
 * - Verifies token
 * - If valid and email not already used, creates the user in DB
 * - Returns success message (frontend can redirect to login)
 */
export const verifyRegistration = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Hiányzó token." });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: "A link lejárt vagy érvénytelen." });
    }

    // Check again if email already exists (race condition safety)
    const existing = await prisma.users.findUnique({ where: { email: payload.email } });
    if (existing) {
      return res.status(400).json({ error: "Ezzel az email címmel már regisztráltak." });
    }

    // Create user using the data from token (password already hashed)
    const user = await prisma.users.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        phone_number: payload.phone_number,
        birth_date: payload.birth_date ? new Date(payload.birth_date) : null,
        address: payload.address,
        identity_card: payload.identity_card,
      },
    });

    // Optionally: you can auto-login the user by issuing a JWT here.
    // For now, return success message.
    res.json({ message: "Regisztráció sikeres. Most már bejelentkezhetsz.", user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error("VERIFY-REGISTRATION ERROR:", err);
    res.status(500).json({ error: "Hiba történt a regisztráció megerősítésekor." });
  }
};

/* ---------- Existing email-related functions (forgot/reset/contact) ---------- */

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Nincs ilyen email címmel regisztrált felhasználó." });

    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    await mailer.sendMail({
      from: `"Casita Gabriela" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Jelszó visszaállítás",
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;">
          <h3>Jelszó visszaállítás</h3>
          <p>Kattints a linkre a jelszó visszaállításához. A link 15 percig érvényes.</p>
          <a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#6FD98C;color:#fff;border-radius:6px;text-decoration:none;">Jelszó visszaállítása</a>
        </div>
      `,
    });

    res.json({ message: "Jelszó visszaállító email elküldve!" });
  } catch (err) {
    console.error("FORGOT-PASSWORD ERROR:", err);
    res.status(500).json({ error: "Nem sikerült elküldeni az emailt." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "Hiányzó adatok." });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: "A link lejárt vagy érvénytelen." });
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.users.update({ where: { id: payload.id }, data: { password: hashed } });

    res.json({ message: "Jelszó sikeresen megváltoztatva!" });
  } catch (err) {
    console.error("RESET-PASSWORD ERROR:", err);
    res.status(500).json({ error: "Nem sikerült megváltoztatni a jelszót." });
  }
};

export const contactForm = async (req, res) => {
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

    const mailOptions = {
      from: `"Casa Gabriel" <${process.env.EMAIL_USER}>`,
      to: "casitagabriela.mailer@gmail.com",
      subject: `Új kapcsolatfelvétel: ${subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;">
          <h3>Új kapcsolatfelvétel</h3>
          <p><strong>Név:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefon:</strong> ${phone}</p>
          <p><strong>Tárgy:</strong> ${subject}</p>
          <div style="margin-top:12px;padding:12px;background:#f9f9f9;border-left:4px solid #ff416c;">
            <strong>Üzenet:</strong><br/>${message}
          </div>
        </div>
      `,
    };

    await mailer.sendMail(mailOptions);

    // visszaigazoló email a feladónak
    await mailer.sendMail({
      from: `"Casa Gabriel" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Köszönjük az üzeneted!",
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;">
          <h3>Üzeneted megkaptuk</h3>
          <p>Kedves <strong>${name}</strong>, köszönjük, hogy felvetted velünk a kapcsolatot. Hamarosan válaszolunk.</p>
        </div>
      `,
    });

    res.json({ message: "Üzenet sikeresen elküldve!" });
  } catch (err) {
    console.error("CONTACT ERROR:", err);
    res.status(500).json({ error: "Hiba az üzenet küldésekor." });
  }
};
