import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import axios from 'axios';
import Footer from "../components/Footer";

const ResetPassword = () => {
  // Jelszó-visszaállítás oldal: token ellenőrzés és új jelszó mentése
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", passwordConfirm: "" });
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);

  // Jelszó validációs szabályok
  const getPasswordErrors = (pw) => {
    const errs = [];
    if (!pw || pw.length < 8) errs.push('Legalább 8 karakter hosszú legyen');
    if (!/[A-Za-z]/.test(pw || '')) errs.push('Tartalmazzon legalább egy betűt');
    if (!/[0-9]/.test(pw || '')) errs.push('Tartalmazzon legalább egy számjegyet');
    return errs;
  };

  // Űrlap input változás kezelése
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Űrlap beküldése: reset jelszó végpont hívása
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (form.password !== form.passwordConfirm) {
      setMessage("A két jelszó nem egyezik.");
      return;
    }
    if (form.password.length < 6) {
      setMessage("A jelszónak legalább 6 karakter hosszúnak kell lennie.");
      return;
    }
    const errs = getPasswordErrors(form.password);
    if (errs.length) {
      setPasswordErrors(errs);
      return;
    }
    try {
      const res = await axios.post("http://localhost:6969/reset-password", {
        token,
        password: form.password,
      });
      setMessage(res.data.message || "Jelszó sikeresen megváltoztatva!");
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      setMessage(serverMsg || "Hiba történt. Próbáld újra.");
    }
  };

  if (!token) {
    return (
      <div className='p-0 m-0 gap-0 flex flex-col min-h-screen bg-[#f7f3e9] relative'>
        <video autoPlay loop muted playsInline className='absolute top-0 left-0 w-full h-auto hidden lg:block pointer-events-none' style={{ zIndex: 0 }}>
          <source src='/catBack.mp4' type='video/mp4' />
        </video>
        {/* Háttérvideó dekoráció: esztétikai elem, nincs funkcionális hatása a formra */}
        <video autoPlay loop muted playsInline className='absolute top-0 left-0 w-full h-auto lg:hidden block pointer-events-none origin-top scale-[1.12]' style={{ zIndex: 0 }}>
          <source src='/catBack.mp4' type='video/mp4' />
        </video>
        <div className='flex flex-col w-dvw grow relative z-10'>
          <main className='flex items-center justify-center flex-1 m-0 py-16 md:py-24 px-4'>
            <div className='fade-in text-black bg-white shadow-md rounded-xl p-4 w-[86%] max-w-[420px] lg:w-1/3 flex flex-col items-center mt-32 mb-10 sm:mt-10'>
              <p className='text-red-500'>Érvénytelen vagy hiányzó token.</p>
            </div>
          </main>
        </div>
        <div className='relative z-10'><Footer /></div>
      </div>
    );
  }

  return (
    <div className='p-0 m-0 gap-0 flex flex-col min-h-screen bg-[#f7f3e9] relative'>
      <video autoPlay loop muted playsInline className='absolute top-0 left-0 w-full h-auto hidden lg:block pointer-events-none' style={{ zIndex: 0 }}>
        <source src='/catBack.mp4' type='video/mp4' />
      </video>
      <video autoPlay loop muted playsInline className='absolute top-0 left-0 w-full h-auto lg:hidden block pointer-events-none origin-top scale-[1.12]' style={{ zIndex: 0 }}>
        <source src='/catBack.mp4' type='video/mp4' />
      </video>

      <div className='flex flex-col w-dvw grow relative z-10'>
        <main className='flex items-center justify-center flex-1 m-0 py-16 md:py-24 px-4'>
          <div className='fade-in text-black bg-white shadow-md rounded-xl p-4 w-[86%] max-w-[420px] lg:w-1/3 flex flex-col items-center mt-32 mb-10 sm:mt-10'>
            {/* Űrlap cím: új jelszó megadása */}
            <p className='text-black mb-4'>Új jelszó megadása</p>

            {/* Jelszó űrlap: két mező és beküldés */}
            <form className='w-full flex flex-col items-center' onSubmit={handleSubmit}>
              <input
                type='password'
                name='password'
                value={form.password}
                onChange={(e) => { handleChange(e); setPasswordErrors(getPasswordErrors(e.target.value)); }}
                placeholder='Új jelszó'
                className='mb-2 p-2 border border-gray-300 rounded w-full'
                required
              />
              {/* Jelszó validációs hibák listázása */}
              {passwordErrors.length > 0 && (
                <ul className="text-sm text-gray-700 mt-3 mb-4 ml-1 space-y-1.5 list-disc list-inside self-start">
                  {passwordErrors.map((pe, idx) => (
                    <li key={idx}>{pe}</li>
                  ))}
                </ul>
              )}
              <input
                type='password'
                name='passwordConfirm'
                value={form.passwordConfirm}
                onChange={handleChange}
                placeholder='Új jelszó megerősítése'
                className='mb-2 p-2 border border-gray-300 rounded w-full'
                required
              />

              <button
                type='submit'
                className='bg-[#6FD98C] text-white px-4 py-2 rounded hover:-translate-y-px transition-all duration-200 hover:bg-[#5FCB80] hover:cursor-pointer mt-4'
                disabled={success}
              >
                Jelszó mentése
              </button>
            </form>

            {/* Üzenet mező: siker vagy hiba megjelenítése */}
            <p className={`mt-4 ${success ? 'text-green-600' : 'text-red-500'}`}>{message}</p>

            {success && (
              <p className='mt-2 text-sm text-gray-500'>
                Átirányítás a bejelentkezéshez...
              </p>
            )}
          </div>
        </main>
      </div>

      <div className='relative z-10'>
        <Footer />
      </div>
    </div>
  );
};

export default ResetPassword;
