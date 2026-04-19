import { PrismaClient } from "./generated/prisma/client.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { normalizeImagesFromDb, parseId } from "./utils.js";

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
    const token = jwt.sign({ id: user.id, email: user.email, role }, process.env.JWT_SECRET, { expiresIn: "1h" });

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
    const { name, description, price, category, space, images, isHighlighted } = req.body;
    const ac_availablity = req.body.ac_availablity !== undefined ? Number(req.body.ac_availablity) : 0;

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

    const formatted = { ...room, images: normalizeImagesFromDb(room.images), reviews: room.room_review || [] };
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
      category,
      space: Number(space),
      images: images ? JSON.stringify(images) : null,
      isHighlighted: Boolean(isHighlighted),
    };

    if (req.body.ac_availablity !== undefined) updateData.ac_availablity = Number(req.body.ac_availablity);

    const updated = await prisma.room.update({ where: { id: Number(id) }, data: updateData });
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
    if (!existing) return res.status(404).json({ error: "Szoba nem található." });

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
        status: status ?? "pending",
        people: peopleCount,
        arrival_date: new Date(arrival_date),
        departure_date: new Date(departure_date),
      },
    });

    res.json({ message: "Foglalás sikeresen létrehozva!", booking: created });
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

    const bookings = await prisma.booking.findMany({ where, orderBy: { booking_date: "desc" } });
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
    const data = {};
    if (req.body.status) data.status = req.body.status;
    if (req.body.people !== undefined) data.people = parseInt(req.body.people, 10);
    if (req.body.arrival_date) data.arrival_date = new Date(req.body.arrival_date);
    if (req.body.departure_date) data.departure_date = new Date(req.body.departure_date);

    const updated = await prisma.booking.update({ where: { id }, data });
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
    if (!existing) return res.status(404).json({ error: "Értékelés nem található." });

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

    const formatted = bookings.map(b => ({
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
    if (!booking || booking.user_id !== req.user.id) return res.status(404).json({ error: "Foglalás nem található." });

    await prisma.booking.delete({ where: { id } });
    res.json({ message: "Foglalás törölve." });
  } catch (err) {
    console.error("DELETE /user/bookings/:id error:", err);
    res.status(500).json({ error: "Nem sikerült törölni a foglalást." });
  }
};

export const getUserData = async (req, res) => {
  try {
    const { id, name, email, phone_number, birth_date, address, identity_card } = req.user;
    res.json({ id, name, email, phone_number, birth_date, address, identity_card });
  } catch (err) {
    console.error("GET /user/data error:", err);
    res.status(500).json({ error: "Nem sikerült betölteni az adatokat." });
  }
};

export const updateUserData = async (req, res) => {
  try {
    const { name, email, phone_number, address, password, oldPassword } = req.body;
    const data = { name, email, phone_number, address };

    if (password && password.trim().length > 0) {
      if (!oldPassword) return res.status(400).json({ error: "A jelenlegi jelszó megadása kötelező." });

      const user = await prisma.users.findUnique({ where: { id: req.user.id } });
      const valid = await bcrypt.compare(oldPassword, user.password);
      if (!valid) return res.status(400).json({ error: "A jelenlegi jelszó helytelen." });

      data.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.users.update({ where: { id: req.user.id }, data });
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

    const formatted = reviews.map(r => ({
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

export const deleteUserReview = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Érvénytelen id." });

  try {
    const review = await prisma.room_review.findUnique({ where: { id } });
    if (!review || review.user_id !== req.user.id) return res.status(404).json({ error: "Értékelés nem található." });

    await prisma.room_review.delete({ where: { id } });
    res.json({ message: "Értékelés törölve." });
  } catch (err) {
    console.error("DELETE /user/reviews/:id error:", err);
    res.status(500).json({ error: "Nem sikerült törölni az értékelést." });
  }
};
