// src/pages/Contact.jsx
import React, { useState } from "react";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaTiktok,
} from "react-icons/fa";
import Footer from "../components/Footer";

const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // később backend POST /contact
  };

  return (
    <div className="flex flex-col min-h-screen w-dvw bg-white text-black spacer layer1">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-10">

        {/* HEADLINE */}
        <h1 className="text-3xl font-mono tracking-wide mb-10 text-black">
          Lépj velünk kapcsolatba
        </h1>

        {/* KÉT OSZLOP */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* BAL OLDALI FORM */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-xl p-6 shadow-md"
            style={{ backgroundColor: "#FFFECE" }}
          >
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Teljes név"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              required
            />

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="E-mail"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              required
            />

            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Telefonszám"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              required
            />

            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Tárgy"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              required
            />

            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Leírás"
              rows={5}
              className="border border-gray-300 rounded px-3 py-2 text-sm resize-none"
              required
            />

            <button
              type="submit"
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-all duration-200 text-sm font-semibold"
            >
              Küldés
            </button>
          </form>

          {/* JOBB OLDALI ADATOK */}
          <div className="flex flex-col gap-8 text-lg">

            <div className="flex items-center gap-4">
              <FaPhoneAlt className="text-[#6FD98C] text-3xl" />
              <span className="text-[1.1rem]">+36 30 123 4567</span>
            </div>

            <div className="flex items-center gap-4">
              <FaEnvelope className="text-[#6FD98C] text-3xl" />
              <span className="text-[1.1rem]">info@casagabriel.hu</span>
            </div>

            <div className="flex items-center gap-4">
              <FaMapMarkerAlt className="text-[#6FD98C] text-3xl" />
              <span className="text-[1.1rem]">
                Magyarország, 6600 Szentes, Tópart utca 1.
              </span>
            </div>

            <div className="flex items-start gap-4">
              <FaClock className="text-[#6FD98C] text-3xl" />
              <div className="flex flex-col text-[1.1rem]">
                <span>Hétfő–Péntek: 8:00–16:00</span>
                <span>Szombat: 8:00–12:00</span>
                <span>Vasárnap: zárva</span>
              </div>
            </div>

            {/* SOCIAL ICONS */}
            <div className="flex gap-6 pt-2 text-4xl text-[#6FD98C]">
              <a href="#" aria-label="Facebook">
                <FaFacebook />
              </a>
              <a href="#" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="#" aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="#" aria-label="TikTok">
                <FaTiktok />
              </a>
            </div>

          </div>
        </div>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
};

export default Contact;
