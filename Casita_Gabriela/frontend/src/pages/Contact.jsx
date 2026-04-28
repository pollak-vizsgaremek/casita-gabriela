// src/pages/Contact.jsx
import React, { useRef, useState } from "react";
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
import Toast, { useToast } from "../components/Toast";

const Contact = () => {
  const MAX_MESSAGE_LENGTH = 1000;
  const submitInFlightRef = useRef(false);
  const { toasts, pushToast, removeToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (submitInFlightRef.current) return;
  submitInFlightRef.current = true;
  setSubmitting(true);

  try {
    const res = await fetch("http://localhost:6969/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 429) {
        throw new Error("Naponta legfeljebb 1 üzenetet küldhetsz.");
      }
      throw new Error(data.error);
    }

    pushToast("Üzenet elküldve", "Köszönjük! Hamarosan válaszolunk.", "success");
    setForm({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });

  } catch (err) {
    console.error(err);
    pushToast("Hiba", err?.message || "Hiba történt!", "error");
  } finally {
    submitInFlightRef.current = false;
    setSubmitting(false);
  }
};

  return (
    <div className="flex flex-col min-h-screen w-full bg-white text-black relative overflow-hidden">
      <section className="relative flex-1 w-full overflow-hidden">
        <div
          className="absolute inset-x-0 bottom-0 h-[280px] sm:h-80 md:h-[360px] bg-[url('/layer1.svg')] bg-no-repeat bg-bottom bg-cover pointer-events-none z-0"
          aria-hidden="true"
        />

        <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* HEADLINE */}
        <div className="mb-8 sm:mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl lg:text-[2.7rem] leading-tight font-extrabold tracking-tight text-[#1f1f1f]">
            Lépj velünk kapcsolatba
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-700 max-w-2xl mx-auto sm:mx-0">
            Kérdésed van, segítségre van szükséged, vagy ajánlatot kérnél? Írj nekünk, és hamarosan válaszolunk.
          </p>
        </div>

        {/* KÉT OSZLOP */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">

          {/* BAL OLDALI FORM */}
          <form
            onSubmit={handleSubmit}
            className="order-2 lg:order-1 flex flex-col gap-4 rounded-xl p-4 sm:p-6 shadow-md fade-in w-full max-w-[680px] mx-auto lg:mx-0"
            style={{ backgroundColor: "#FFFECE" }}
          >
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Teljes név"
              className="border border-gray-300 rounded px-3 py-2 text-sm sm:text-base bg-white"
              required
            />

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="E-mail"
              className="border border-gray-300 rounded px-3 py-2 text-sm sm:text-base bg-white"
              required
            />

            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Telefonszám"
              className="border border-gray-300 rounded px-3 py-2 text-sm sm:text-base bg-white"
              required
            />

            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Tárgy"
              className="border border-gray-300 rounded px-3 py-2 text-sm sm:text-base bg-white"
              required
            />

            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Leírás"
              rows={5}
              maxLength={MAX_MESSAGE_LENGTH}
              className="contact-message-scroll border border-gray-300 rounded px-3 py-2 text-sm sm:text-base resize-none bg-white"
              required
            />
            <div className="text-xs sm:text-sm text-gray-600 self-end -mt-2">
              {form.message.length}/{MAX_MESSAGE_LENGTH}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-all duration-200 text-sm sm:text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Küldés folyamatban..." : "Küldés"}
            </button>
          </form>

          {/* JOBB OLDALI ADATOK */}
          <div className="order-1 lg:order-2 flex flex-col gap-6 sm:gap-8 text-base sm:text-lg w-full max-w-[680px] mx-auto lg:mx-0">

            <div className="flex items-center gap-3 sm:gap-4">
              <FaPhoneAlt className="text-[#6FD98C] text-2xl sm:text-3xl shrink-0" />
              <span className="text-base sm:text-[1.1rem] wrap-break-word">+36 30 123 4567</span>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <FaEnvelope className="text-[#6FD98C] text-2xl sm:text-3xl shrink-0" />
              <span className="text-base sm:text-[1.1rem] break-all">info@casagabriel.hu</span>
            </div>

            <div className="flex items-start gap-3 sm:gap-4">
              <FaMapMarkerAlt className="text-[#6FD98C] text-2xl sm:text-3xl shrink-0 mt-0.5" />
              <span className="text-base sm:text-[1.1rem]">
                Magyarország, 6600 Szentes, Tópart utca 1.
              </span>
            </div>

            <div className="flex items-start gap-3 sm:gap-4">
              <FaClock className="text-[#6FD98C] text-2xl sm:text-3xl shrink-0 mt-0.5" />
              <div className="flex flex-col text-base sm:text-[1.1rem]">
                <span>Hétfő–Péntek: 8:00–16:00</span>
                <span>Szombat: 8:00–12:00</span>
                <span>Vasárnap: zárva</span>
              </div>
            </div>

            {/* SOCIAL ICONS */}
            <div className="flex justify-center sm:justify-start gap-5 sm:gap-6 pt-2 text-3xl sm:text-4xl text-[#6FD98C]">
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
      </section>

      {/* FOOTER */}
      <Footer />
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Contact;
