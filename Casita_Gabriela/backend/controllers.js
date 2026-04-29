import { PrismaClient } from "./generated/prisma/client.js";

import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";

import { normalizeImagesFromDb, parseId } from "./utils.js";

import {
  sendBookingCreatedUser,
  sendBookingCreatedAdmin,
  sendBookingApproved,
  sendBookingRejected,
  sendBookingCancelledByUser,
  sendUserProfileUpdated,
  sendUserUpdatedByAdmin,
  sendPasswordChangedEmail,
  sendReviewCreatedAdmin,
  sendEmailChangedOld,
  sendEmailChangedNew,
} from "./email.js";

const prisma = new PrismaClient();

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const getNightCount = (arrival, departure) => {
  const start = new Date(arrival);
  const end = new Date(departure);
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const diff = Math.round((endUtc - startUtc) / MS_PER_DAY);
  return diff > 0 ? diff : 0;
};

// Autentikáció és felhasználói kezelés

export const login = async (req, res) => {
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

    const role = user.isAdmin ? "admin" : "user";

    const token = jwt.sign({ id: user.id, email: user.email, role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      isFirstTimeUser: user.isFirstTimeUser,
    };

    res.json({
      message: "Sikeres bejelentkezés!",
      token,
      role,
      user: safeUser,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Bejelentkezés sikertelen." });
  }
};

// szobák kezelése

export const getRooms = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        booking: true,
        room_review: { include: { user: true } },
        category_rel: true,
      },
    });

    const formatted = rooms.map((room) => ({
      ...room,
      images: normalizeImagesFromDb(room.images),
      reviews: room.room_review || [],
      category: room.category_rel?.name || null,
      category_id: room.category ?? null,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("GET /rooms error:", err);
    res.status(500).json({ error: "Hiba a szobák lekérésekor." });
  }
};

export const createRoom = async (req, res) => {
  try {
    const { name, description, price, category, space, images, isHighlighted } = req.body;

    const ac_availablity =
      req.body.ac_availablity !== undefined ? Number(req.body.ac_availablity) : 0;

    const data = {
      name,
      description,
      price: Number(price),
      ac_availablity,
      category: category !== undefined && category !== null && category !== "" ? Number(category) : null,
      space: Number(space),
      images: images ? JSON.stringify(images) : null,
      isHighlighted: Boolean(isHighlighted),
    };

    const createdRaw = await prisma.room.create({ data });

   
    const created = await prisma.room.findUnique({
      where: { id: createdRaw.id },
      include: { booking: true, room_review: { include: { user: true } }, category_rel: true },
    });

    const formatted = {
      ...created,
      images: normalizeImagesFromDb(created.images),
      reviews: created.room_review || [],
      category: created.category_rel?.name || null,
      category_id: created.category ?? null,
    };

    res.json({ room: formatted });
  } catch (err) {
    console.error("POST /rooms error:", err);
    res.status(500).json({ error: "Hiba történt a szoba létrehozásakor." });
  }
};

export const getRoomById = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "Érvénytelen id." });
  }

  try {
    const room = await prisma.room.findUnique({
      where: { id },
      include: { booking: true, room_review: { include: { user: true } }, category_rel: true },
    });

    if (!room) {
      return res.status(404).json({ error: "Szoba nem található." });
    }

    const formatted = {
      ...room,
      images: normalizeImagesFromDb(room.images),
      reviews: room.room_review || [],
      category: room.category_rel?.name || null,
      category_id: room.category ?? null,
    };

    res.json(formatted);
  } catch (err) {
    console.error("GET /rooms/:id error:", err);
    res.status(500).json({ error: "Hiba a szoba lekérésekor." });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, space, images, isHighlighted } = req.body;

    const updateData = {
      name,
      description,
      price: Number(price),
      category: category !== undefined && category !== null && category !== "" ? Number(category) : null,
      space: Number(space),
      images: images ? JSON.stringify(images) : null,
      isHighlighted: Boolean(isHighlighted),
    };

    if (req.body.ac_availablity !== undefined) {
      updateData.ac_availablity = Number(req.body.ac_availablity);
    }

    const updatedRaw = await prisma.room.update({ where: { id: Number(id) }, data: updateData });

    
    const updated = await prisma.room.findUnique({
      where: { id: Number(id) },
      include: { booking: true, room_review: { include: { user: true } }, category_rel: true },
    });

    const formatted = {
      ...updated,
      images: normalizeImagesFromDb(updated.images),
      reviews: updated.room_review || [],
      category: updated.category_rel?.name || null,
      category_id: updated.category ?? null,
    };

    res.json(formatted);
  } catch (err) {
    console.error("PUT /rooms/:id error:", err);
    res.status(500).json({ error: "Hiba történt a szoba frissítésekor." });
  }
};

export const deleteRoom = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "Érvénytelen id." });
  }

  try {
    const existing = await prisma.room.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: "Szoba nem található." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const deletedBookings = await tx.booking.deleteMany({ where: { room_id: id } });
      const deletedReviews = await tx.room_review.deleteMany({ where: { room_id: id } });
      const deletedRoom = await tx.room.delete({ where: { id } });
      return { deletedBookings, deletedReviews, deletedRoom };
    });

    res.json({ message: "Szoba sikeresen törölve!" });
  } catch (err) {
    console.error("DELETE /rooms/:id error:", err);
    res.status(500).json({ error: "Hiba a szoba törlésekor." });
  }
};

// foglalások kezelése

export const createBooking = async (req, res) => {
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

    // Expect `booking_date` to be an ISO timestamp (UTC) sent by the client.
    // Store it directly as a Date object (or use server time if not provided).
    // Avoid manual timezone arithmetic here; Prisma/DB store UTC timestamps.
    const corrected = booking_date ? new Date(booking_date) : new Date();

    const peopleCount =
      people !== undefined && people !== null
        ? parseInt(people, 10)
        : guests !== undefined && guests !== null
        ? parseInt(guests, 10)
        : 1;

    const room = await prisma.room.findUnique({ where: { id: parseInt(room_id, 10) } });

    if (!room) {
      return res.status(404).json({ error: "Szoba nem található." });
    }

    const nights = getNightCount(arrival_date, departure_date);

    if (!nights) {
      return res.status(400).json({ error: "Érvénytelen foglalási dátumok." });
    }

    const user = user_id ? await prisma.users.findUnique({ where: { id: parseInt(user_id, 10) } }) : null;

    const baseTotal = Number(room.price) * peopleCount * nights;

    const totalPrice = user?.isFirstTimeUser ? Math.round(baseTotal * 0.85) : baseTotal;

    const created = await prisma.booking.create({
      data: {
        room_id: parseInt(room_id, 10),
        user_id: user_id ? parseInt(user_id, 10) : null,
        booking_date: corrected,
        status: status ?? "pending",
        people: peopleCount,
        total_price: totalPrice,
        arrival_date: new Date(arrival_date),
        departure_date: new Date(departure_date),
      },
    });

    //Email értesítések: felhasználó és admin 
    try {
      // felhasználónak visszaigazoló email
      if (user && user.email) {
        await sendBookingCreatedUser(created, room, user);
      }

      // admin értesítés
      await sendBookingCreatedAdmin(created, room, user || { name: "Ismeretlen", email: "—" });
    } catch (emailErr) {
      console.error("BOOKING EMAIL ERROR:", emailErr);
      // nem dobunk hibát a felhasználónak, csak logoljuk
    }

    res.json({ message: "Foglalás sikeresen létrehozva!", booking: created });

    if (user_id) {
      prisma.users.update({ where: { id: parseInt(user_id, 10) }, data: { isFirstTimeUser: false } }).catch(() => {});
    }
  } catch (err) {
    console.error("POST /booking error:", err);
    res.status(500).json({ error: "Hiba a foglalás létrehozásakor." });
  }
};

export const getBookings = async (req, res) => {
  try {
    const where = {};

    if (req.query.room_id) {
      const rid = parseId(req.query.room_id);
      if (rid) {
        where.room_id = rid;
      }
    }

    const bookings = await prisma.booking.findMany({ where, orderBy: { booking_date: "desc" } });

    res.json(bookings);
  } catch (err) {
    console.error("GET /booking error:", err);
    res.status(500).json({ error: "Hiba a foglalások lekérésekor." });
  }
};

export const updateBooking = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "Érvénytelen id." });
  }

  try {
    // először lekérjük a meglévő foglalást, hogy össze tudjuk hasonlítani a státuszt
    const existing = await prisma.booking.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: "Foglalás nem található." });
    }

    const data = {};

    if (req.body.status) {
      data.status = req.body.status;
    }

    if (req.body.people !== undefined) {
      data.people = parseInt(req.body.people, 10);
    }

    if (req.body.arrival_date) {
      data.arrival_date = new Date(req.body.arrival_date);
    }

    if (req.body.departure_date) {
      data.departure_date = new Date(req.body.departure_date);
    }

    const updated = await prisma.booking.update({ where: { id }, data });

    // Ha státusz változott, és új státusz approved vagy rejected, értesítjük a felhasználót
    try {
      if (data.status && data.status !== existing.status) {
        const room = await prisma.room.findUnique({ where: { id: existing.room_id } });
        const user = existing.user_id ? await prisma.users.findUnique({ where: { id: existing.user_id } }) : null;

        if (data.status === "approved") {
          if (user && user.email) {
            await sendBookingApproved(updated, room, user);
          }
        } else if (data.status === "rejected") {
          // opcionálisan lehet indokot is átadni: req.body.reason
          const reason = req.body.reason || null;
          if (user && user.email) {
            await sendBookingRejected(updated, room, user, reason);
          }
        }
      }
    } catch (emailErr) {
      console.error("BOOKING STATUS EMAIL ERROR:", emailErr);
    }

    res.json({ message: "Foglalás frissítve", booking: updated });
  } catch (err) {
    console.error("PUT /booking/:id error:", err);
    res.status(400).json({ error: "Hiba a foglalás frissítésekor." });
  }
};

export const deleteBooking = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "Érvénytelen id." });
  }

  try {
    await prisma.booking.delete({ where: { id } });
    res.json({ message: "Foglalás törölve." });
  } catch (err) {
    console.error("DELETE /booking/:id error:", err);
    res.status(500).json({ error: "Nem sikerült törölni a foglalást." });
  }
};

// Értékelések kezelése

export const getReviews = async (req, res) => {
  try {
    const where = {};

    if (req.query.room_id) {
      const rid = parseId(req.query.room_id);
      if (rid) {
        where.room_id = rid;
      }
    }

    const reviews = await prisma.room_review.findMany({
      where,
      orderBy: { id: "desc" },
      include: { room: { include: { category_rel: true } }, user: true },
    });

    
    const formatted = reviews.map((r) => ({
      ...r,
      room: {
        ...r.room,
        category: r.room?.category_rel?.name || null,
        category_id: r.room?.category ?? null,
      },
    }));

    res.json(formatted);
  } catch (err) {
    console.error("GET /room_reviews error:", err);
    res.status(500).json({ error: "Hiba az értékelések lekérésekor." });
  }
};

export const createReview = async (req, res) => {
  try {
    const { room_id, stars, comment } = req.body;

    const rid = parseId(room_id);

    const s = Number(stars);

    if (!rid || !Number.isInteger(s) || s < 1 || s > 5) {
      return res.status(400).json({ error: "Érvénytelen adatok." });
    }

    const created = await prisma.room_review.create({
      data: {
        room_id: rid,
        stars: s,
        comment: comment ? String(comment).slice(0, 200) : "",
        user_id: req.user.id,
      },
      include: { user: true, room: { include: { category_rel: true } } },
    });

    // Admin értesítése új értékelésről
    try {
      const roomForEmail = {
        ...created.room,
        category: created.room?.category_rel?.name || null,
        category_id: created.room?.category ?? null,
      };
      await sendReviewCreatedAdmin(created, roomForEmail, created.user);
    } catch (emailErr) {
      console.error("REVIEW CREATED ADMIN EMAIL ERROR:", emailErr);
    }

    const response = {
      ...created,
      room: {
        ...created.room,
        category: created.room?.category_rel?.name || null,
        category_id: created.room?.category ?? null,
      },
    };

    res.json({ message: "Értékelés rögzítve.", review: response });
  } catch (err) {
    console.error("POST /room_reviews error:", err);
    res.status(500).json({ error: "Hiba az értékelés létrehozásakor." });
  }
};

export const deleteReview = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "Érvénytelen id." });
  }

  try {
    const existing = await prisma.room_review.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: "Értékelés nem található." });
    }

    await prisma.room_review.delete({ where: { id } });

    res.json({ message: "Értékelés sikeresen törölve." });
  } catch (err) {
    console.error("DELETE /room_reviews/:id error:", err);
    res.status(500).json({ error: "Hiba az értékelés törlésekor." });
  }
};

// felhasználói saját foglalások és értékelések, valamint adatkezelés

export const getUserBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { user_id: req.user.id },
      include: { room: { include: { category_rel: true } } },
      orderBy: { booking_date: "desc" },
    });

    const formatted = bookings.map((b) => ({
      id: b.id,
      roomName: b.room?.name || "",
      startDate: b.arrival_date?.toISOString().slice(0, 10),
      endDate: b.departure_date?.toISOString().slice(0, 10),
      guests: b.people,
      total_price: b.total_price,
      status: b.status,
      category: b.room?.category_rel?.name || null,
      category_id: b.room?.category ?? null,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("GET /user/bookings error:", err);
    res.status(500).json({ error: "Nem sikerült betölteni a foglalásokat." });
  }
};

export const deleteUserBooking = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "Érvénytelen id." });
  }

  try {
    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking || booking.user_id !== req.user.id) {
      return res.status(404).json({ error: "Foglalás nem található." });
    }

    // Lekérjük a room és user adatokat az admin értesítéséhez
    const room = await prisma.room.findUnique({ where: { id: booking.room_id }, include: { category_rel: true } });
    const user = await prisma.users.findUnique({ where: { id: booking.user_id } });

    // Töröljük a foglalást
    await prisma.booking.delete({ where: { id } });

    // Küldünk értesítést az adminnak, hogy a felhasználó lemondta a foglalást
    try {
      const roomForEmail = {
        ...room,
        category: room?.category_rel?.name || null,
        category_id: room?.category ?? null,
      };
      await sendBookingCancelledByUser(booking, roomForEmail, user);
    } catch (emailErr) {
      console.error("BOOKING CANCELLED BY USER EMAIL ERROR:", emailErr);
    }

    res.json({ message: "Foglalás törölve." });
  } catch (err) {
    console.error("DELETE /user/bookings/:id error:", err);
    res.status(500).json({ error: "Nem sikerült törölni a foglalást." });
  }
};

export const getUserData = async (req, res) => {
  try {
    const {
      id,
      name,
      email,
      phone_number,
      birth_date,
      address,
      identity_card,
    } = req.user;

    res.json({
      id,
      name,
      email,
      phone_number,
      birth_date,
      address,
      identity_card,
    });
  } catch (err) {
    console.error("GET /user/data error:", err);
    res.status(500).json({ error: "Nem sikerült betölteni az adatokat." });
  }
};

export const updateUserData = async (req, res) => {
  try {
    const {
      name,
      email,
      phone_number,
      address,
      identity_card,
      password,
      oldPassword,
    } = req.body;

    const data = { name, email, phone_number, address, identity_card };
    let passwordChanged = false;

    // lekérjük a jelenlegi usert, hogy össze tudjuk hasonlítani az emailt
    const currentUser = await prisma.users.findUnique({ where: { id: req.user.id } });

    if (!currentUser) {
      return res.status(404).json({ error: "Felhasználó nem található." });
    }

    const oldEmail = currentUser.email;
    const newEmail = email !== undefined ? String(email).trim() : currentUser.email;
    const emailChanged = newEmail && oldEmail && newEmail.toLowerCase() !== oldEmail.toLowerCase();

    if (password && password.trim().length > 0) {
      if (!oldPassword) {
        return res.status(400).json({ error: "A jelenlegi jelszó megadása kötelező." });
      }

      const valid = await bcrypt.compare(oldPassword, currentUser.password);

      if (!valid) {
        return res.status(400).json({ error: "A jelenlegi jelszó helytelen." });
      }

      data.password = await bcrypt.hash(password, 10);
      passwordChanged = true;
    }

    const updated = await prisma.users.update({ where: { id: req.user.id }, data });

    // Email értesítés a felhasználónak – adatok/jelszó módosultak
    try {
      if (updated.email) {
        // Ha az email megváltozott, küldünk értesítést a régi címre és az új címre is
        if (emailChanged) {
          // régi emailre: csak rövid értesítés, hogy az email címed megváltozott
          try {
            await sendEmailChangedOld({ name: currentUser.name, oldEmail, newEmail, byAdmin: false });
            console.log("EMAIL SEND OK: old email notification sent to", oldEmail);
          } catch (oldErr) {
            console.error("SEND EMAIL CHANGED OLD ERROR:", oldErr);
          }

          // új emailre: teljes profilfrissítés + értesítés az email változásról
          try {
            await sendEmailChangedNew(updated, oldEmail, { byAdmin: false });
            console.log("EMAIL SEND OK: new email notification sent to", updated.email);
          } catch (newErr) {
            console.error("SEND EMAIL CHANGED NEW ERROR:", newErr);
          }
        } else {
          // ha nem változott az email, csak a szokásos profilfrissítés és jelszó értesítés
          await sendUserProfileUpdated(updated);
          console.log("EMAIL SEND OK: profile updated notification sent to", updated.email);

          if (passwordChanged) {
            await sendPasswordChangedEmail(updated);
            console.log("EMAIL SEND OK: password changed notification sent to", updated.email);
          }
        }
      }
    } catch (emailErr) {
      console.error("USER DATA UPDATE EMAIL ERROR:", emailErr);
    }

    res.json({ message: "Sikeres mentés!", user: updated });
  } catch (err) {
    console.error("PUT /user/data error:", err);
    res.status(500).json({ error: "Nem sikerült menteni az adatokat." });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const reviews = await prisma.room_review.findMany({
      where: { user_id: req.user.id },
      include: { room: { include: { category_rel: true } } },
      orderBy: { id: "desc" },
    });

    const formatted = reviews.map((r) => ({
      id: r.id,
      roomName: r.room?.name || "",
      rating: r.stars,
      text: r.comment,
      date: r.created_at ? r.created_at.toISOString().slice(0, 10) : "",
      category: r.room?.category_rel?.name || null,
      category_id: r.room?.category ?? null,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("GET /user/reviews error:", err);
    res.status(500).json({ error: "Nem sikerült betölteni az értékeléseket." });
  }
};

export const deleteUserReview = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "Érvénytelen id." });
  }

  try {
    const review = await prisma.room_review.findUnique({ where: { id } });

    if (!review || review.user_id !== req.user.id) {
      return res.status(404).json({ error: "Értékelés nem található." });
    }

    await prisma.room_review.delete({ where: { id } });

    res.json({ message: "Értékelés törölve." });
  } catch (err) {
    console.error("DELETE /user/reviews/:id error:", err);
    res.status(500).json({ error: "Nem sikerült törölni az értékelést." });
  }
};

// Admin felhasználókezelés

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      orderBy: { id: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        birth_date: true,
        address: true,
        identity_card: true,
        isAdmin: true,
        isFirstTimeUser: true,
      },
    });

    res.json(users);
  } catch (err) {
    console.error("GET /admin/users error:", err);
    res.status(500).json({ error: "Hiba a felhasználók lekérésekor." });
  }
};

export const adminUpdateUser = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "Érvénytelen id." });
  }

  try {
    const { name, email, phone_number, address, isAdmin } = req.body;
    const data = {};

    if (name !== undefined) {
      data.name = name;
    }
    if (email !== undefined) {
      data.email = email;
    }
    if (phone_number !== undefined) {
      data.phone_number = phone_number;
    }
    if (address !== undefined) {
      data.address = address;
    }
    if (isAdmin !== undefined) {
      data.isAdmin = Boolean(isAdmin);
    }

    
    const current = await prisma.users.findUnique({ where: { id } });

    if (!current) {
      return res.status(404).json({ error: "Felhasználó nem található." });
    }

    const oldEmail = current.email;
    const newEmail = email !== undefined ? String(email).trim() : current.email;
    const emailChanged = newEmail && oldEmail && newEmail.toLowerCase() !== oldEmail.toLowerCase();

    const updated = await prisma.users.update({ where: { id }, data });

    // Email értesítés a felhasználónak – admin módosította az adatait
    try {
      if (updated.email) {
        if (emailChanged) {
          
          try {
            await sendEmailChangedOld({ name: current.name, oldEmail, newEmail, byAdmin: true });
            console.log("EMAIL SEND OK: old email notification (admin) sent to", oldEmail);
          } catch (oldErr) {
            console.error("SEND EMAIL CHANGED OLD ERROR (ADMIN):", oldErr);
          }

          
          try {
            await sendEmailChangedNew(updated, oldEmail, { byAdmin: true });
            console.log("EMAIL SEND OK: new email notification (admin) sent to", updated.email);
          } catch (newErr) {
            console.error("SEND EMAIL CHANGED NEW ERROR (ADMIN):", newErr);
          }
        } else {
          
          await sendUserUpdatedByAdmin(updated);
          console.log("EMAIL SEND OK: admin update notification sent to", updated.email);
        }
      }
    } catch (emailErr) {
      console.error("ADMIN UPDATE USER EMAIL ERROR:", emailErr);
    }

    res.json({ message: "Felhasználó frissítve.", user: updated });
  } catch (err) {
    console.error("PUT /admin/users/:id error:", err);
    res.status(500).json({ error: "Hiba a felhasználó frissítésekor." });
  }
};

export const adminDeleteUser = async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "Érvénytelen id." });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.booking.deleteMany({ where: { user_id: id } });
      await tx.room_review.deleteMany({ where: { user_id: id } });
      await tx.users.delete({ where: { id } });
    });

    res.json({ message: "Felhasználó törölve." });
  } catch (err) {
    console.error("DELETE /admin/users/:id error:", err);
    res.status(500).json({ error: "Hiba a felhasználó törlésekor." });
  }
};

// Értesítések

export const getAdminCounts = async (req, res) => {
  try {
    const sinceBooking = parseInt(req.query.sinceBooking) || 0;
    const sinceReview = parseInt(req.query.sinceReview) || 0;
    const sinceUser = parseInt(req.query.sinceUser) || 0;

    const [bookings, reviews, users, maxBooking, maxReview, maxUser] = await Promise.all([
      prisma.booking.count({ where: { id: { gt: sinceBooking }, status: "pending" } }),
      prisma.room_review.count({ where: { id: { gt: sinceReview } } }),
      prisma.users.count({ where: { id: { gt: sinceUser } } }),
      prisma.booking.findFirst({ where: { status: "pending" }, orderBy: { id: "desc" }, select: { id: true } }),
      prisma.room_review.findFirst({ orderBy: { id: "desc" }, select: { id: true } }),
      prisma.users.findFirst({ orderBy: { id: "desc" }, select: { id: true } }),
    ]);

    res.json({
      bookings,
      reviews,
      users,
      maxIds: {
        bookings: maxBooking?.id || 0,
        reviews: maxReview?.id || 0,
        users: maxUser?.id || 0,
      },
    });
  } catch (err) {
    console.error("GET /admin/counts error:", err);
    res.status(500).json({ error: "Hiba." });
  }
};

export const getUserCounts = async (req, res) => {
  try {
    const sinceBooking = parseInt(req.query.sinceBooking) || 0;
    const sinceReview = parseInt(req.query.sinceReview) || 0;
    const uid = req.user.id;

    const [bookings, reviews, maxBooking, maxReview] = await Promise.all([
      prisma.booking.count({ where: { user_id: uid, id: { gt: sinceBooking } } }),
      prisma.room_review.count({ where: { user_id: uid, id: { gt: sinceReview } } }),
      prisma.booking.findFirst({ where: { user_id: uid }, orderBy: { id: "desc" }, select: { id: true } }),
      prisma.room_review.findFirst({ where: { user_id: uid }, orderBy: { id: "desc" }, select: { id: true } }),
    ]);

    res.json({
      bookings,
      reviews,
      maxIds: {
        bookings: maxBooking?.id || 0,
        reviews: maxReview?.id || 0,
      },
    });
  } catch (err) {
    console.error("GET /user/counts error:", err);
    res.status(500).json({ error: "Hiba." });
  }
};

// Kategóriák kezelése

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    res.json(categories);
  } catch (err) {
    console.error("GET /categories error:", err);
    res.status(500).json({ error: "Hiba a kategóriák lekérésekor." });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, image } = req.body;

    if (!name || !image) {
      return res.status(400).json({ error: "Név és kép szükséges." });
    }

    const category = await prisma.category.create({ data: { name, image } });

    res.json(category);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Ez a kategória már létezik." });
    }
    console.error("POST /categories error:", err);
    res.status(500).json({ error: "Hiba történt a kategória létrehozásakor." });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image } = req.body;

    if (!name || !image) {
      return res.status(400).json({ error: "Név és kép szükséges." });
    }

    const categoryId = Number(id);

    const existing = await prisma.category.findUnique({ where: { id: categoryId } });

    if (!existing) {
      return res.status(404).json({ error: "Kategória nem található." });
    }

    const nextName = String(name).trim();
    const nextImage = String(image).trim();

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: { name: nextName, image: nextImage },
    });

    res.json(updated);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Ez a kategória már létezik." });
    }
    console.error("PUT /categories/:id error:", err);
    res.status(500).json({ error: "Hiba történt a kategória frissítésekor." });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryId = Number(id);

    const existing = await prisma.category.findUnique({ where: { id: categoryId } });

    if (!existing) {
      return res.status(404).json({ error: "Kategória nem található." });
    }

    const roomsUsingCategory = await prisma.room.count({ where: { category: categoryId } });

    if (roomsUsingCategory > 0) {
      return res.status(409).json({
        error: `A kategória nem törölhető, mert ${roomsUsingCategory} szoba még ezt használja. Előbb módosítsd a szobák kategóriáját.`,
      });
    }

    await prisma.category.delete({ where: { id: categoryId } });

    res.json({ message: "Kategória törölve." });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Kategória nem található." });
    }
    console.error("DELETE /categories/:id error:", err);
    res.status(500).json({ error: "Hiba történt a kategória törlésénél." });
  }
};
