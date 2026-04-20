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

// Admin email (ideiglenes default; később .env-ben állítható)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "casitagabriela.mailer@gmail.com";

/* ---------- Registration via email verification ---------- */

export const registerInit = async (req, res) => {
  try {
    const { name, email, password, phone_number, birth_date, address, identity_card } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Név, email és jelszó kötelező." });
    }

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Ezzel az email címmel már regisztráltak." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const payload = {
      name,
      email,
      password: hashedPassword,
      phone_number: phone_number || null,
      birth_date: birth_date || null,
      address: address || null,
      identity_card: identity_card || null,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });

    // A link most a frontend Verify oldalára mutat (Vite dev: 5173)
    const frontendHost = process.env.FRONTEND_HOST || `${req.protocol}://${req.get("host")}`; // ha nincs .env, fallback a backend host
    const verifyUrl = `${frontendHost.replace(/\/$/, "")}/verify?token=${token}`;

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

    const existing = await prisma.users.findUnique({ where: { email: payload.email } });
    if (existing) {
      return res.status(400).json({ error: "Ezzel az email címmel már regisztráltak." });
    }

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

    res.json({ message: "Regisztráció sikeres. Most már bejelentkezhetsz.", user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error("VERIFY-REGISTRATION ERROR:", err);
    res.status(500).json({ error: "Hiba történt a regisztráció megerősítésekor." });
  }
};

/* ---------- Booking-related emails ---------- */

/**
 * Foglalás leadva - visszaigazoló email a felhasználónak
 * booking: a booking objektum (tartalmazza a room_id, arrival_date, departure_date, people, stb.)
 * room: a szoba objektum (név, ár, stb.)
 * user: a felhasználó objektum (name, email)
 */
export const sendBookingCreatedUser = async (booking, room, user) => {
  try {
    const arrival = booking.arrival_date ? new Date(booking.arrival_date).toISOString().slice(0,10) : "";
    const departure = booking.departure_date ? new Date(booking.departure_date).toISOString().slice(0,10) : "";

    const html = `
      <div style="font-family:Arial,sans-serif;padding:20px;">
        <h3>Foglalás beérkezett</h3>
        <p>Kedves <strong>${user.name}</strong>,</p>
        <p>Köszönjük a foglalásodat. A foglalás részletei:</p>
        <ul>
          <li><strong>Szoba:</strong> ${room?.name || "—"}</li>
          <li><strong>Érkezés:</strong> ${arrival}</li>
          <li><strong>Távozás:</strong> ${departure}</li>
          <li><strong>Vendégek száma:</strong> ${booking.people || booking.guests || 1}</li>
          <li><strong>Foglalás azonosító:</strong> ${booking.id}</li>
        </ul>
        <p>Az admin hamarosan elbírálja a foglalást. Amint döntés születik, értesítünk.</p>
        <p>Üdvözlettel,<br/>Casa Gabriel csapata</p>
      </div>
    `;

    await mailer.sendMail({
      from: `"Casa Gabriel" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Foglalás beérkezett - Casa Gabriel",
      html,
    });
  } catch (err) {
    console.error("SEND BOOKING CREATED USER ERROR:", err);
  }
};

/**
 * Foglalás leadva - értesítő email az adminnak
 */
export const sendBookingCreatedAdmin = async (booking, room, user) => {
  try {
    const arrival = booking.arrival_date ? new Date(booking.arrival_date).toISOString().slice(0,10) : "";
    const departure = booking.departure_date ? new Date(booking.departure_date).toISOString().slice(0,10) : "";

    const html = `
      <div style="font-family:Arial,sans-serif;padding:20px;">
        <h3>Új foglalás érkezett</h3>
        <p>Új foglalás érkezett a rendszerbe:</p>
        <ul>
          <li><strong>Felhasználó:</strong> ${user.name} (${user.email})</li>
          <li><strong>Szoba:</strong> ${room?.name || "—"}</li>
          <li><strong>Érkezés:</strong> ${arrival}</li>
          <li><strong>Távozás:</strong> ${departure}</li>
          <li><strong>Vendégek száma:</strong> ${booking.people || booking.guests || 1}</li>
          <li><strong>Foglalás azonosító:</strong> ${booking.id}</li>
        </ul>
        <p>Kérjük, lépj be az admin felületre a foglalás elbírálásához.</p>
      </div>
    `;

    await mailer.sendMail({
      from: `"Casa Gabriel" <${process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: "Új foglalás érkezett - Casa Gabriel",
      html,
    });
  } catch (err) {
    console.error("SEND BOOKING CREATED ADMIN ERROR:", err);
  }
};

/**
 * Foglalás elfogadva - értesítő a felhasználónak
 */
export const sendBookingApproved = async (booking, room, user) => {
  try {
    const arrival = booking.arrival_date ? new Date(booking.arrival_date).toISOString().slice(0,10) : "";
    const departure = booking.departure_date ? new Date(booking.departure_date).toISOString().slice(0,10) : "";

    const html = `
      <div style="font-family:Arial,sans-serif;padding:20px;">
        <h3>Foglalás elfogadva</h3>
        <p>Kedves <strong>${user.name}</strong>,</p>
        <p>Örömmel értesítünk, hogy a foglalásodat elfogadtuk. Részletek:</p>
        <ul>
          <li><strong>Szoba:</strong> ${room?.name || "—"}</li>
          <li><strong>Érkezés:</strong> ${arrival}</li>
          <li><strong>Távozás:</strong> ${departure}</li>
          <li><strong>Foglalás azonosító:</strong> ${booking.id}</li>
        </ul>
        <p>Várunk szeretettel!</p>
        <p>Üdvözlettel,<br/>Casa Gabriel csapata</p>
      </div>
    `;

    await mailer.sendMail({
      from: `"Casa Gabriel" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Foglalás elfogadva - Casa Gabriel",
      html,
    });
  } catch (err) {
    console.error("SEND BOOKING APPROVED ERROR:", err);
  }
};

/**
 * Foglalás elutasítva - értesítő a felhasználónak
 */
export const sendBookingRejected = async (booking, room, user, reason = null) => {
  try {
    const arrival = booking.arrival_date ? new Date(booking.arrival_date).toISOString().slice(0,10) : "";
    const departure = booking.departure_date ? new Date(booking.departure_date).toISOString().slice(0,10) : "";

    const html = `
      <div style="font-family:Arial,sans-serif;padding:20px;">
        <h3>Foglalás elutasítva</h3>
        <p>Kedves <strong>${user.name}</strong>,</p>
        <p>Sajnálattal értesítünk, hogy a foglalásodat elutasítottuk. Részletek:</p>
        <ul>
          <li><strong>Szoba:</strong> ${room?.name || "—"}</li>
          <li><strong>Érkezés:</strong> ${arrival}</li>
          <li><strong>Távozás:</strong> ${departure}</li>
          <li><strong>Foglalás azonosító:</strong> ${booking.id}</li>
        </ul>
        ${reason ? `<p><strong>Indok:</strong> ${reason}</p>` : ""}
        <p>Ha kérdésed van, kérjük válaszolj erre az emailre vagy lépj kapcsolatba velünk.</p>
        <p>Üdvözlettel,<br/>Casa Gabriel csapata</p>
      </div>
    `;

    await mailer.sendMail({
      from: `"Casa Gabriel" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Foglalás elutasítva - Casa Gabriel",
      html,
    });
  } catch (err) {
    console.error("SEND BOOKING REJECTED ERROR:", err);
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
      to: ADMIN_EMAIL,
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
