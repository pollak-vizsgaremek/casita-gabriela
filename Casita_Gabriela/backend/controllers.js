import { PrismaClient } from "./generated/prisma/client.js";

import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";

import { normalizeImagesFromDb, parseId } from "./utils.js";

import {
  sendBookingCreatedUser,
  sendBookingCreatedAdmin,
  sendBookingApproved,
  sendBookingRejected,
  sendBookingCancelledByUser
} from "./email.js";

const prisma = new PrismaClient();

/* ---------- AUTH (login) ---------- */

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Nincs ilyen felhasználó." });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Hibás jelszó." });

    const role = user.isAdmin ? "admin" : "user";
    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

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

/* ---------- ROOMS ---------- */

export const getRooms = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      include: { booking: true, room_review: { include: { user: true } } },
    });

    const formatted = rooms.map((room) => ({
      ...room,
      images: normalizeImagesFromDb(room.images),
      reviews: room.room_review || [],
    }));

    res.json(formatted);
  } catch (err) {
    console.error("GET /rooms error:", err);
    res.status(500).json({ error: "Hiba a szobák lekérésekor." });
  }
};

export const createRoom = async (req, res) => {
  try {
    const { name, description, price, category, space, images, isHighlighted } =
      req.body;

    const ac_availablity =
      req.body.ac_availablity !== undefined
        ? Number(req.body.ac_availablity)
        : 0;

    const room = await prisma.room.create({
      data: {
        name,
        description,
        price: Number(price),
        ac_availablity,
        category,
        space: Number(space),
        images: images ? JSON.stringify(images) : null,
        isHighlighted: Boolean(isHighlighted),
      },
    });

    res.json({ room });
  } catch (err) {
    console.error("POST /rooms error:", err);
    res.status(500).json({ error: "Hiba történt a szoba létrehozásakor." });
  }
};

export const getRoomById = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Érvénytelen id." });

  try {
    const room = await prisma.room.findUnique({
      where: { id },
      include: { booking: true, room_review: { include: { user: true } } },
    });

    if (!room) return res.status(404).json({ error: "Szoba nem található." });

    const formatted = {
      ...room,
      images: normalizeImagesFromDb(room.images),
      reviews: room.room_review || [],
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
    const { name, description, price, category, space, images, isHighlighted } =
      req.body;

    const updateData = {
      name,
      description,
      price: Number(price),
      category,
      space: Number(space),
      images: images ? JSON.stringify(images) : null,
      isHighlighted: Boolean(isHighlighted),
    };

    if (req.body.ac_availablity !== undefined)
      updateData.ac_availablity = Number(req.body.ac_availablity);

    const updated = await prisma.room.update({
      where: { id: Number(id) },
      data: updateData,
    });

    res.json(updated);
  } catch (err) {
    console.error("PUT /rooms/:id error:", err);
    res.status(500).json({ error: "Hiba történt a szoba frissítésekor." });
  }
};

export const deleteRoom = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Érvénytelen id." });

  try {
    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ error: "Szoba nem található." });

    const result = await prisma.$transaction(async (tx) => {
      const deletedBookings = await tx.booking.deleteMany({
        where: { room_id: id },
      });

      const deletedReviews = await tx.room_review.deleteMany({
        where: { room_id: id },
      });

      const deletedRoom = await tx.room.delete({ where: { id } });

      return { deletedBookings, deletedReviews, deletedRoom };
    });

    res.json({ message: "Szoba sikeresen törölve!" });
  } catch (err) {
    console.error("DELETE /rooms/:id error:", err);
    res.status(500).json({ error: "Hiba a szoba törlésekor." });
  }
};

/* ---------- BOOKING ---------- */

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

    const local = new Date(booking_date);
    const corrected = new Date(
      local.getTime() - local.getTimezoneOffset() * 60000
    );

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
        status: status ?? "pending",
        people: peopleCount,
        arrival_date: new Date(arrival_date),
        departure_date: new Date(departure_date),
      },
    });

    // --- Email értesítések: felhasználó és admin ---

    try {
      // lekérjük a szükséges adatokat az email sablonokhoz
      const room = await prisma.room.findUnique({
        where: { id: Number(room_id) },
      });

      const user = user_id
        ? await prisma.users.findUnique({ where: { id: Number(user_id) } })
        : null;

      // felhasználónak visszaigazoló email
      if (user && user.email) {
        await sendBookingCreatedUser(created, room, user);
      }

      // admin értesítés
      await sendBookingCreatedAdmin(
        created,
        room,
        user || { name: "Ismeretlen", email: "—" }
      );
    } catch (emailErr) {
      console.error("BOOKING EMAIL ERROR:", emailErr);
      // nem dobunk hibát a felhasználónak, csak logoljuk
    }

    res.json({ message: "Foglalás sikeresen létrehozva!", booking: created });

    // Mark user as no longer first-time in DB (fire-and-forget)
    if (user_id) {
      prisma.users
        .update({
          where: { id: parseInt(user_id, 10) },
          data: { isFirstTimeUser: false },
        })
        .catch(() => {});
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
      if (rid) where.room_id = rid;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { booking_date: "desc" },
    });

    res.json(bookings);
  } catch (err) {
    console.error("GET /booking error:", err);
    res.status(500).json({ error: "Hiba a foglalások lekérésekor." });
  }
};

export const updateBooking = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Érvénytelen id." });

  try {
    // először lekérjük a meglévő foglalást, hogy össze tudjuk hasonlítani a státuszt
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ error: "Foglalás nem található." });

    const data = {};
    if (req.body.status) data.status = req.body.status;
    if (req.body.people !== undefined)
      data.people = parseInt(req.body.people, 10);
    if (req.body.arrival_date)
      data.arrival_date = new Date(req.body.arrival_date);
    if (req.body.departure_date)
      data.departure_date = new Date(req.body.departure_date);

    const updated = await prisma.booking.update({ where: { id }, data });

    // Ha státusz változott, és új státusz approved vagy rejected, értesítjük a felhasználót
    try {
      if (data.status && data.status !== existing.status) {
        const room = await prisma.room.findUnique({
          where: { id: existing.room_id },
        });

        const user = existing.user_id
          ? await prisma.users.findUnique({ where: { id: existing.user_id } })
          : null;

        if (data.status === "approved") {
          if (user && user.email) await sendBookingApproved(updated, room, user);
        } else if (data.status === "rejected") {
          // opcionálisan lehet indokot is átadni: req.body.reason
          const reason = req.body.reason || null;
          if (user && user.email)
            await sendBookingRejected(updated, room, user, reason);
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
  if (!id) return res.status(400).json({ error: "Érvénytelen id." });

  try {
    await prisma.booking.delete({ where: { id } });
    res.json({ message: "Foglalás törölve." });
  } catch (err) {
    console.error("DELETE /booking/:id error:", err);
    res.status(500).json({ error: "Nem sikerült törölni a foglalást." });
  }
};

/* ---------- REVIEWS ---------- */

export const getReviews = async (req, res) => {
  try {
    const where = {};

    if (req.query.room_id) {
      const rid = parseId(req.query.room_id);
      if (rid) where.room_id = rid;
    }

    const reviews = await prisma.room_review.findMany({
      where,
      orderBy: { id: "desc" },
      include: { room: true, user: true },
    });

    res.json(reviews);
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
      include: { user: true, room: true },
    });

    res.json({ message: "Értékelés rögzítve.", review: created });
  } catch (err) {
    console.error("POST /room_reviews error:", err);
    res.status(500).json({ error: "Hiba az értékelés létrehozásakor." });
  }
};

export const deleteReview = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Érvénytelen id." });

  try {
    const existing = await prisma.room_review.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ error: "Értékelés nem található." });

    await prisma.room_review.delete({ where: { id } });
    res.json({ message: "Értékelés sikeresen törölve." });
  } catch (err) {
    console.error("DELETE /room_reviews/:id error:", err);
    res.status(500).json({ error: "Hiba az értékelés törlésekor." });
  }
};

/* ---------- USER PANEL ---------- */

export const getUserBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { user_id: req.user.id },
      include: { room: true },
      orderBy: { booking_date: "desc" },
    });

    const formatted = bookings.map((b) => ({
      id: b.id,
      roomName: b.room?.name || "",
      startDate: b.arrival_date?.toISOString().slice(0, 10),
      endDate: b.departure_date?.toISOString().slice(0, 10),
      guests: b.people,
      status: b.status,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("GET /user/bookings error:", err);
    res.status(500).json({ error: "Nem sikerült betölteni a foglalásokat." });
  }
};

export const deleteUserBooking = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Érvénytelen id." });

  try {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking || booking.user_id !== req.user.id)
      return res.status(404).json({ error: "Foglalás nem található." });

    // Lekérjük a room és user adatokat az admin értesítéséhez
    const room = await prisma.room.findUnique({ where: { id: booking.room_id } });
    const user = await prisma.users.findUnique({ where: { id: booking.user_id } });

    // Töröljük a foglalást
    await prisma.booking.delete({ where: { id } });

    // Küldünk értesítést az adminnak, hogy a felhasználó lemondta a foglalást
    try {
      await sendBookingCancelledByUser(booking, room, user);
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
    const { name, email, phone_number, address, password, oldPassword } =
      req.body;

    const data = { name, email, phone_number, address };

    if (password && password.trim().length > 0) {
      if (!oldPassword)
        return res
          .status(400)
          .json({ error: "A jelenlegi jelszó megadása kötelező." });

      const user = await prisma.users.findUnique({
        where: { id: req.user.id },
      });

      const valid = await bcrypt.compare(oldPassword, user.password);
      if (!valid)
        return res.status(400).json({ error: "A jelenlegi jelszó helytelen." });

      data.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.users.update({
      where: { id: req.user.id },
      data,
    });

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
      include: { room: true },
      orderBy: { id: "desc" },
    });

    const formatted = reviews.map((r) => ({
      id: r.id,
      roomName: r.room?.name || "",
      rating: r.stars,
      text: r.comment,
      date: r.created_at ? r.created_at.toISOString().slice(0, 10) : "",
    }));

    res.json(formatted);
  } catch (err) {
    console.error("GET /user/reviews error:", err);
    res.status(500).json({ error: "Nem sikerült betölteni az értékeléseket." });
  }
};

/* ---------- ADMIN USER MANAGEMENT ---------- */

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
  if (!id) return res.status(400).json({ error: "Érvénytelen id." });

  try {
    const { name, email, phone_number, address, isAdmin } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone_number !== undefined) data.phone_number = phone_number;
    if (address !== undefined) data.address = address;
    if (isAdmin !== undefined) data.isAdmin = Boolean(isAdmin);

    const updated = await prisma.users.update({ where: { id }, data });
    res.json({ message: "Felhasználó frissítve.", user: updated });
  } catch (err) {
    console.error("PUT /admin/users/:id error:", err);
    res.status(500).json({ error: "Hiba a felhasználó frissítésekor." });
  }
};

export const adminDeleteUser = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Érvénytelen id." });

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

/* ---------- NOTIFICATION COUNTS ---------- */

export const getAdminCounts = async (req, res) => {
  try {
    const sinceBooking = parseInt(req.query.sinceBooking) || 0;
    const sinceReview = parseInt(req.query.sinceReview) || 0;
    const sinceUser = parseInt(req.query.sinceUser) || 0;

    const [bookings, reviews, users, maxBooking, maxReview, maxUser] =
      await Promise.all([
        prisma.booking.count({
          where: { id: { gt: sinceBooking }, status: "pending" },
        }),
        prisma.room_review.count({ where: { id: { gt: sinceReview } } }),
        prisma.users.count({ where: { id: { gt: sinceUser } } }),
        prisma.booking.findFirst({
          where: { status: "pending" },
          orderBy: { id: "desc" },
          select: { id: true },
        }),
        prisma.room_review.findFirst({
          orderBy: { id: "desc" },
          select: { id: true },
        }),
        prisma.users.findFirst({
          orderBy: { id: "desc" },
          select: { id: true },
        }),
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
      prisma.booking.count({
        where: { user_id: uid, id: { gt: sinceBooking } },
      }),
      prisma.room_review.count({
        where: { user_id: uid, id: { gt: sinceReview } },
      }),
      prisma.booking.findFirst({
        where: { user_id: uid },
        orderBy: { id: "desc" },
        select: { id: true },
      }),
      prisma.room_review.findFirst({
        where: { user_id: uid },
        orderBy: { id: "desc" },
        select: { id: true },
      }),
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

export const deleteUserReview = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Érvénytelen id." });

  try {
    const review = await prisma.room_review.findUnique({ where: { id } });
    if (!review || review.user_id !== req.user.id)
      return res.status(404).json({ error: "Értékelés nem található." });

    await prisma.room_review.delete({ where: { id } });
    res.json({ message: "Értékelés törölve." });
  } catch (err) {
    console.error("DELETE /user/reviews/:id error:", err);
    res.status(500).json({ error: "Nem sikerült törölni az értékelést." });
  }
};

/* ---------- CATEGORIES ---------- */

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });

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

    const category = await prisma.category.create({
      data: {
        name,
        image,
      },
    });

    res.json(category);
  } catch (err) {
    if (err.code === 'P2002') {
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

    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: { name, image },
    });

    res.json(category);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: "Ez a kategória már létezik." });
    }
    console.error("PUT /categories/:id error:", err);
    res.status(500).json({ error: "Hiba történt a kategória frissítésekor." });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({
      where: { id: Number(id) },
    });
    res.json({ message: "Kategória törölve." });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "Kategória nem található." });
    }
    console.error("DELETE /categories/:id error:", err);
    res.status(500).json({ error: "Hiba történt a kategória törlésénél." });
  }
};
