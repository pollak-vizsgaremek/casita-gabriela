// routes.js
import {
  login,
  getRooms,
  createRoom,
  getRoomById,
  updateRoom,
  deleteRoom,
  createBooking,
  getBookings,
  updateBooking,
  deleteBooking,
  getReviews,
  createReview,
  deleteReview,
  getUserBookings,
  deleteUserBooking,
  getUserData,
  updateUserData,
  getUserReviews,
  deleteUserReview,
  getAdminCounts,
  getUserCounts,
  getAllUsers,
  adminUpdateUser,
  adminDeleteUser,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from "./controllers.js";

import {
  forgotPassword,
  resetPassword,
  contactForm,
  registerInit,
  verifyRegistration
} from "./email.js";

import { authenticate, requireAdmin } from "./middleware.js";
import { upload } from "./utils.js";

export default function registerRoutes(app) {
  // autentikáció és regisztráció
  app.post("/register-init", registerInit); // kezdeményezi a regisztrációt és emailt küld
  app.get("/verify-registration", verifyRegistration); // a link ide mutat, itt jön létre a felhasználó véglegesen
  app.post("/login", login);
  app.post("/forgot-password", forgotPassword);
  app.post("/reset-password", resetPassword);

  // képek feltöltése
  app.post("/upload-images", upload.array("images", 20), (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const paths = (req.files || []).map(f => `${baseUrl}/public/${f.filename}`);
    res.json({ paths });
  });

  // szobák kezelése
  app.get("/rooms", getRooms);
  app.post("/rooms", authenticate, requireAdmin, createRoom);
  app.get("/rooms/:id", getRoomById);
  app.put("/rooms/:id", authenticate, requireAdmin, updateRoom);
  app.delete("/rooms/:id", authenticate, requireAdmin, deleteRoom);

  // kategóriák kezelése
  app.get("/categories", getCategories);
  app.post("/categories", authenticate, requireAdmin, createCategory);
  app.put("/categories/:id", authenticate, requireAdmin, updateCategory);
  app.delete("/categories/:id", authenticate, requireAdmin, deleteCategory);

  // foglalások kezelése
  app.post("/booking", createBooking);
  app.get("/booking", getBookings);
  app.put("/booking/:id", updateBooking);
  app.delete("/booking/:id", deleteBooking);

  // értékelések kezelése
  app.get("/room_reviews", getReviews);
  app.post("/room_reviews", authenticate, createReview);
  app.delete("/room_reviews/:id", authenticate, requireAdmin, deleteReview);

  // kontakt űrlap
  app.post("/contact", contactForm);

  // admin felhasználókezelés
  app.get("/admin/users", authenticate, requireAdmin, getAllUsers);
  app.put("/admin/users/:id", authenticate, requireAdmin, adminUpdateUser);
  app.delete("/admin/users/:id", authenticate, requireAdmin, adminDeleteUser);

  // értesítési számok
  app.get("/admin/counts", authenticate, requireAdmin, getAdminCounts);
  app.get("/user/counts", authenticate, getUserCounts);

  // felhasználói adatok és foglalások
  app.get("/user/bookings", authenticate, getUserBookings);
  app.delete("/user/bookings/:id", authenticate, deleteUserBooking);
  app.get("/user/data", authenticate, getUserData);
  app.put("/user/data", authenticate, updateUserData);
  app.get("/user/reviews", authenticate, getUserReviews);
  app.delete("/user/reviews/:id", authenticate, deleteUserReview);
}
