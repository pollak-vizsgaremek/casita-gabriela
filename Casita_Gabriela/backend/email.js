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

// Admin email (fallback)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "casitagabriela.mailer@gmail.com";

/**
 * buildEmailHtml
 * Egységes, "szép" HTML sablon minden emailhez.
 * title: főcím
 * preface: rövid bevezető (opcionális)
 * contentHtml: a levél fő tartalma (lista, részletek)
 * ctaHtml: gomb vagy link (opcionális)
 *
 * A sablon részletesebb, több kommenttel és inline stílussal, hogy a levelek
 * egységesek és könnyen testreszabhatók legyenek.
 */
const buildEmailHtml = (title, preface = "", contentHtml = "", ctaHtml = "") => {
  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:Inter, Arial, sans-serif;">
    <table role="presentation" width="100%" style="background:#f6f7fb;padding:28px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="680" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding:18px 32px;">
                <!-- Header -->
                <table role="presentation" width="100%" style="border-collapse:collapse;">
                  <tr>
                    <td style="vertical-align:middle;padding-bottom:8px;">
                      <div style="display:flex;align-items:center;gap:12px;">
                        <div style="width:48px;height:48px;border-radius:10px;background:linear-gradient(135deg,#6FD98C,#2EB872);"></div>
                        <div>
                          <h1 style="margin:0;font-size:20px;color:#222;font-weight:700;">${title}</h1>
                          ${preface ? `<p style="margin:6px 0 0;color:#666;font-size:13px;">${preface}</p>` : ""}
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Content -->
                <div style="margin-top:16px;color:#444;font-size:15px;line-height:1.5;">
                  ${contentHtml}
                </div>

                <!-- CTA -->
                ${ctaHtml ? `<div style="margin-top:20px;">${ctaHtml}</div>` : ""}

                <!-- Footer -->
                <div style="margin-top:26px;border-top:1px solid #f0f0f0;padding-top:16px;color:#888;font-size:13px;">
                  <p style="margin:0;">Üdvözlettel,<br/><strong>Casa Gabriel csapata</strong></p>
                  <p style="margin:8px 0 0 0;color:#aaa;">Ha nem te kezdeményezted ezt az értesítést, egyszerűen hagyd figyelmen kívül, vagy vedd fel velünk a kapcsolatot.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

/* ---------- Registration via email verification ---------- */

export const registerInit = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone_number,
      birth_date,
      address,
      identity_card,
    } = req.body;

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

    const frontendHost = process.env.FRONTEND_HOST || `${req.protocol}://${req.get("host")}`;
    const verifyUrl = `${frontendHost.replace(/\/$/, "")}/verify?token=${token}`;

    const preface = "Köszönjük, hogy regisztráltál. A regisztráció befejezéséhez kérjük, erősítsd meg az email címedet.";
    const contentHtml = `
      <p style="margin:0 0 12px 0;">Kattints az alábbi gombra a regisztráció megerősítéséhez:</p>
      <p style="margin:0;">
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 20px;background:#6FD98C;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Regisztráció megerősítése
        </a>
      </p>
      <p style="margin:14px 0 0 0;color:#777;font-size:13px;">Ha a gomb nem működik, másold be ezt a linket a böngésződbe:<br/><a href="${verifyUrl}" style="color:#1a73e8;">${verifyUrl}</a></p>
    `;

    const html = buildEmailHtml("Regisztráció megerősítése", preface, contentHtml);

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
    if (!token) {
      return res.status(400).json({ error: "Hiányzó token." });
    }

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

/* ---------- Booking-related emails (szép dizájn) ---------- */

/**
 * Foglalás leadva - visszaigazoló email a felhasználónak
 */
export const sendBookingCreatedUser = async (booking, room, user) => {
  try {
    const arrival = booking.arrival_date ? new Date(booking.arrival_date).toISOString().slice(0, 10) : "";
    const departure = booking.departure_date ? new Date(booking.departure_date).toISOString().slice(0, 10) : "";

    const preface = `Kedves ${user.name}, köszönjük a foglalásodat.`;
    const contentHtml = `
      <p style="margin:0 0 10px 0;">A foglalás részletei:</p>
      <table role="presentation" style="width:100%;margin-top:8px;border-collapse:collapse;color:#444;">
        <tr><td style="padding:6px 0;"><strong>Szoba:</strong></td><td style="padding:6px 0;">${room?.name || "—"}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Érkezés:</strong></td><td style="padding:6px 0;">${arrival}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Távozás:</strong></td><td style="padding:6px 0;">${departure}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Vendégek száma:</strong></td><td style="padding:6px 0;">${booking.people || booking.guests || 1}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Foglalás azonosító:</strong></td><td style="padding:6px 0;">${booking.id}</td></tr>
      </table>
      <p style="margin-top:12px;color:#666;">Az admin hamarosan elbírálja a foglalást. Amint döntés születik, értesítünk.</p>
    `;

    const html = buildEmailHtml("Foglalás beérkezett", preface, contentHtml);

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
    const arrival = booking.arrival_date ? new Date(booking.arrival_date).toISOString().slice(0, 10) : "";
    const departure = booking.departure_date ? new Date(booking.departure_date).toISOString().slice(0, 10) : "";

    const preface = "Új foglalás érkezett a rendszerbe.";
    const contentHtml = `
      <p style="margin:0 0 10px 0;">Részletek:</p>
      <table role="presentation" style="width:100%;margin-top:8px;border-collapse:collapse;color:#444;">
        <tr><td style="padding:6px 0;"><strong>Felhasználó:</strong></td><td style="padding:6px 0;">${user?.name || "Ismeretlen"} (${user?.email || "—"})</td></tr>
        <tr><td style="padding:6px 0;"><strong>Szoba:</strong></td><td style="padding:6px 0;">${room?.name || "—"}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Érkezés:</strong></td><td style="padding:6px 0;">${arrival}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Távozás:</strong></td><td style="padding:6px 0;">${departure}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Vendégek száma:</strong></td><td style="padding:6px 0;">${booking.people || booking.guests || 1}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Foglalás azonosító:</strong></td><td style="padding:6px 0;">${booking.id}</td></tr>
      </table>
      <p style="margin-top:12px;color:#666;">Kérjük, lépj be az admin felületre a foglalás elbírálásához.</p>
    `;

    const html = buildEmailHtml("Új foglalás érkezett", preface, contentHtml);

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
    const arrival = booking.arrival_date ? new Date(booking.arrival_date).toISOString().slice(0, 10) : "";
    const departure = booking.departure_date ? new Date(booking.departure_date).toISOString().slice(0, 10) : "";

    const preface = `Kedves ${user.name}, örömmel értesítünk, hogy a foglalásodat elfogadtuk.`;
    const contentHtml = `
      <p style="margin:0 0 10px 0;">Foglalás részletei:</p>
      <table role="presentation" style="width:100%;margin-top:8px;border-collapse:collapse;color:#444;">
        <tr><td style="padding:6px 0;"><strong>Szoba:</strong></td><td style="padding:6px 0;">${room?.name || "—"}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Érkezés:</strong></td><td style="padding:6px 0;">${arrival}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Távozás:</strong></td><td style="padding:6px 0;">${departure}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Foglalás azonosító:</strong></td><td style="padding:6px 0;">${booking.id}</td></tr>
      </table>
      <p style="margin-top:12px;color:#666;">Várunk szeretettel!</p>
    `;

    const html = buildEmailHtml("Foglalás elfogadva", preface, contentHtml);

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
    const arrival = booking.arrival_date ? new Date(booking.arrival_date).toISOString().slice(0, 10) : "";
    const departure = booking.departure_date ? new Date(booking.departure_date).toISOString().slice(0, 10) : "";

    const preface = `Kedves ${user.name}, sajnálattal értesítünk, hogy a foglalásodat elutasítottuk.`;
    const contentHtml = `
      <p style="margin:0 0 10px 0;">Foglalás részletei:</p>
      <table role="presentation" style="width:100%;margin-top:8px;border-collapse:collapse;color:#444;">
        <tr><td style="padding:6px 0;"><strong>Szoba:</strong></td><td style="padding:6px 0;">${room?.name || "—"}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Érkezés:</strong></td><td style="padding:6px 0;">${arrival}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Távozás:</strong></td><td style="padding:6px 0;">${departure}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Foglalás azonosító:</strong></td><td style="padding:6px 0;">${booking.id}</td></tr>
      </table>
      ${reason ? `<p style="margin-top:12px;color:#555;"><strong>Indok:</strong> ${reason}</p>` : ""}
      <p style="margin-top:12px;color:#666;">Ha kérdésed van, kérjük válaszolj erre az emailre vagy lépj kapcsolatba velünk.</p>
    `;

    const html = buildEmailHtml("Foglalás elutasítva", preface, contentHtml);

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

/**
 * Foglalás törölve (felhasználó által) - értesítő az adminnak
 * A felhasználó nem kap emailt.
 */
export const sendBookingCancelledByUser = async (booking, room, user) => {
  try {
    const arrival = booking.arrival_date ? new Date(booking.arrival_date).toISOString().slice(0, 10) : "";
    const departure = booking.departure_date ? new Date(booking.departure_date).toISOString().slice(0, 10) : "";

    const preface = "Figyelem — egy foglalást töröltek a rendszerből.";
    const contentHtml = `
      <p style="margin:0 0 10px 0;">Részletek:</p>
      <table role="presentation" style="width:100%;margin-top:8px;border-collapse:collapse;color:#444;">
        <tr><td style="padding:6px 0;"><strong>Felhasználó:</strong></td><td style="padding:6px 0;">${user?.name || "Ismeretlen"} (${user?.email || "—"})</td></tr>
        <tr><td style="padding:6px 0;"><strong>Szoba:</strong></td><td style="padding:6px 0;">${room?.name || "—"}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Érkezés:</strong></td><td style="padding:6px 0;">${arrival}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Távozás:</strong></td><td style="padding:6px 0;">${departure}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Foglalás azonosító:</strong></td><td style="padding:6px 0;">${booking.id}</td></tr>
      </table>
      <p style="margin-top:12px;color:#666;">Ez a foglalás a felhasználó által lett törölve a profiljában.</p>
    `;

    const html = buildEmailHtml("Foglalás lemondva (felhasználó)", preface, contentHtml);

    await mailer.sendMail({
      from: `"Casa Gabriel" <${process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: "Foglalás lemondva - Casa Gabriel",
      html,
    });
  } catch (err) {
    console.error("SEND BOOKING CANCELLED BY USER ERROR:", err);
  }
};

/* ---------- Új: Felhasználói / admin értesítések és értékelés email ---------- */

/**
 * Felhasználói profil módosult (saját adatlapján)
 * Részletes táblázatos megjelenítéssel, hogy minden mező látható legyen.
 */
export const sendUserProfileUpdated = async (user) => {
  try {
    const preface = `Kedves ${user.name || "Felhasználó"}, az adataid sikeresen frissültek.`;
    const contentHtml = `
      <p style="margin:0 0 10px 0;">Az alábbi fiók adatai módosultak:</p>
      <table role="presentation" style="width:100%;margin-top:8px;border-collapse:collapse;color:#444;">
        <tr><td style="padding:6px 0;width:160px;"><strong>Név:</strong></td><td style="padding:6px 0;">${user.name || "—"}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Email:</strong></td><td style="padding:6px 0;">${user.email || "—"}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Telefonszám:</strong></td><td style="padding:6px 0;">${user.phone_number || "—"}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Születési dátum:</strong></td><td style="padding:6px 0;">${user.birth_date ? new Date(user.birth_date).toISOString().slice(0,10) : "—"}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Cím:</strong></td><td style="padding:6px 0;">${user.address || "—"}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Szem. igazolvány:</strong></td><td style="padding:6px 0;">${user.identity_card || "—"}</td></tr>
      </table>
      <p style="margin-top:12px;color:#666;">Ha nem te módosítottad ezeket az adatokat, kérjük, mielőbb jelezd felénk.</p>
    `;

    const html = buildEmailHtml("Fiókadataid frissültek", preface, contentHtml);

    await mailer.sendMail({
      from: `"Casa Gabriel" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Fiókadataid frissültek - Casa Gabriel",
      html,
    });
  } catch (err) {
    console.error("SEND USER PROFILE UPDATED ERROR:", err);
  }
};

/**
 * Felhasználói profil módosult (admin által)
 * Tartalmazza az admin által beállított jogosultságot is.
 */
export const sendUserUpdatedByAdmin = async (user) => {
  try {
    const preface = `Kedves ${user.name || "Felhasználó"}, az adataidat az admin módosította.`;
    const contentHtml = `
      <p style="margin:0 0 10px 0;">Az alábbi fiók adatai módosultak az admin által:</p>
      <table role="presentation" style="width:100%;margin-top:8px;border-collapse:collapse;color:#444;">
        <tr><td style="padding:6px 0;width:160px;"><strong>Név:</strong></td><td style="padding:6px 0;">${user.name || "—"}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Email:</strong></td><td style="padding:6px 0;">${user.email || "—"}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Telefonszám:</strong></td><td style="padding:6px 0;">${user.phone_number || "—"}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Cím:</strong></td><td style="padding:6px 0;">${user.address || "—"}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Admin jogosultság:</strong></td><td style="padding:6px 0;">${user.isAdmin ? "Igen" : "Nem"}</td></tr>
      </table>
      <p style="margin-top:12px;color:#666;">Ha nem értesz egyet a módosításokkal, kérjük, vedd fel velünk a kapcsolatot.</p>
    `;

    const html = buildEmailHtml("Fiókadataid módosultak", preface, contentHtml);

    await mailer.sendMail({
      from: `"Casa Gabriel" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Fiókadataid módosultak - Casa Gabriel",
      html,
    });
  } catch (err) {
    console.error("SEND USER UPDATED BY ADMIN ERROR:", err);
  }
};

/**
 * Jelszó sikeresen megváltozott (bármilyen folyamat végén)
 * Rövid, de fontos biztonsági üzenet.
 */
export const sendPasswordChangedEmail = async (user) => {
  try {
    const preface = `Kedves ${user.name || "Felhasználó"}, a jelszavad sikeresen megváltozott.`;
    const contentHtml = `
      <p style="margin:0 0 10px 0;">Ez az értesítés megerősíti, hogy a fiókodhoz tartozó jelszó megváltozott.</p>
      <p style="margin:0 0 10px 0;color:#666;">Ha nem te kezdeményezted a jelszóváltoztatást, kérjük, azonnal vedd fel velünk a kapcsolatot, és próbálj meg új jelszót beállítani. Javasoljuk a fiók biztonsági beállításainak ellenőrzését is.</p>
    `;

    const html = buildEmailHtml("Jelszó megváltozott", preface, contentHtml);

    await mailer.sendMail({
      from: `"Casa Gabriel" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Jelszó megváltozott - Casa Gabriel",
      html,
    });
  } catch (err) {
    console.error("SEND PASSWORD CHANGED EMAIL ERROR:", err);
  }
};

/**
 * Új értékelés érkezett – admin értesítése
 * Részletes információkkal, hogy az admin gyorsan át tudja tekinteni.
 */
export const sendReviewCreatedAdmin = async (review, room, user) => {
  try {
    const preface = "Új értékelés érkezett a rendszerbe.";
    const contentHtml = `
      <p style="margin:0 0 10px 0;">Részletek:</p>
      <table role="presentation" style="width:100%;margin-top:8px;border-collapse:collapse;color:#444;">
        <tr><td style="padding:6px 0;width:160px;"><strong>Felhasználó:</strong></td><td style="padding:6px 0;">${user?.name || "Ismeretlen"} (${user?.email || "—"})</td></tr>
        <tr><td style="padding:6px 0;"><strong>Szoba:</strong></td><td style="padding:6px 0;">${room?.name || "—"}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Értékelés:</strong></td><td style="padding:6px 0;">${review.stars} / 5</td></tr>
        <tr><td style="padding:6px 0;"><strong>Szöveg:</strong></td><td style="padding:6px 0;">${review.comment || "—"}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Dátum:</strong></td><td style="padding:6px 0;">${review.created_at ? new Date(review.created_at).toISOString().slice(0, 10) : ""}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Értékelés azonosító:</strong></td><td style="padding:6px 0;">${review.id}</td></tr>
      </table>
      <p style="margin-top:12px;color:#666;">Az admin felületen további részleteket is megtekinthetsz, és szükség esetén intézkedhetsz.</p>
    `;

    const html = buildEmailHtml("Új értékelés érkezett", preface, contentHtml);

    await mailer.sendMail({
      from: `"Casa Gabriel" <${process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: "Új értékelés érkezett - Casa Gabriel",
      html,
    });
  } catch (err) {
    console.error("SEND REVIEW CREATED ADMIN ERROR:", err);
  }
};

/* ---------- Password reset and contact (szép sablon) ---------- */

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Nincs ilyen email címmel regisztrált felhasználó." });
    }

    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const resetLink = `${process.env.FRONTEND_HOST || "http://localhost:5173"}/reset-password?token=${resetToken}`;

    const preface = "Jelszó visszaállítás kérése";
    const contentHtml = `
      <p style="margin:0 0 12px 0;">Kattints az alábbi gombra a jelszó visszaállításához. A link 15 percig érvényes.</p>
      <p style="margin:0;">
        <a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#6FD98C;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
          Jelszó visszaállítása
        </a>
      </p>
      <p style="margin-top:12px;color:#777;font-size:13px;">Ha nem te kérted, egyszerűen hagyd figyelmen kívül ezt az emailt.</p>
    `;

    const html = buildEmailHtml("Jelszó visszaállítás", preface, contentHtml);

    await mailer.sendMail({
      from: `"Casa Gabriel" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Jelszó visszaállítás",
      html,
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
    if (!token || !password) {
      return res.status(400).json({ error: "Hiányzó adatok." });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: "A link lejárt vagy érvénytelen." });
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.users.update({ where: { id: payload.id }, data: { password: hashed } });

    // Küldünk értesítést a felhasználónak, hogy a jelszó sikeresen megváltozott
    try {
      const user = await prisma.users.findUnique({ where: { id: payload.id } });
      if (user && user.email) {
        await sendPasswordChangedEmail(user);
      }
    } catch (emailErr) {
      console.error("RESET PASSWORD EMAIL ERROR:", emailErr);
    }

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
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dailyCount = await prisma.form.count({
      where: {
        email,
        created_at: {
          gte: startOfDay,
        },
      },
    });

    if (dailyCount >= 1) {
      return res.status(429).json({
        error: "Naponta legfeljebb 1 üzenetet küldhetsz.",
      });
    }

    await prisma.form.create({
      data: {
        name,
        email,
        phone_number: phone,
        topic: subject,
        description: message,
      },
    });

    const adminPreface = "Új kapcsolatfelvétel érkezett";
    const adminContent = `
      <p style="margin:0 0 10px 0;">Részletek:</p>
      <table role="presentation" style="width:100%;margin-top:8px;border-collapse:collapse;color:#444;">
        <tr><td style="padding:6px 0;width:160px;"><strong>Név:</strong></td><td style="padding:6px 0;">${name}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Email:</strong></td><td style="padding:6px 0;">${email}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Telefon:</strong></td><td style="padding:6px 0;">${phone}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Tárgy:</strong></td><td style="padding:6px 0;">${subject}</td></tr>
      </table>
      <div style="margin-top:12px;padding:12px;background:#f9f9f9;border-left:4px solid #ff416c;">
        <strong>Üzenet:</strong><br/>${message}
      </div>
    `;
    const adminHtml = buildEmailHtml(`Új kapcsolatfelvétel: ${subject}`, adminPreface, adminContent);

    await mailer.sendMail({
      from: `"Casa Gabriel" <${process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: `Új kapcsolatfelvétel: ${subject}`,
      html: adminHtml,
    });

    const userPreface = `Kedves ${name}, köszönjük, hogy felvetted velünk a kapcsolatot.`;
    const userContent = `<p style="margin:0 0 8px 0;">Hamarosan válaszolunk a megkeresésedre.</p>`;
    const userHtml = buildEmailHtml("Üzeneted megkaptuk", userPreface, userContent);

    await mailer.sendMail({
      from: `"Casa Gabriel" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Köszönjük az üzeneted!",
      html: userHtml,
    });

    res.json({ message: "Üzenet sikeresen elküldve!" });
  } catch (err) {
    console.error("CONTACT ERROR:", err);
    res.status(500).json({ error: "Hiba az üzenet küldésekor." });
  }
};
