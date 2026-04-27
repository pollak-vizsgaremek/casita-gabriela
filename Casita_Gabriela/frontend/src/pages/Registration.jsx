// Registration.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from '../components/Footer';

const Registration = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordRepeat: "",
    phone_number: "",
    birth_date: "",
    address: "",
    identity_card: "",
    acceptTerms: false,
    acceptPrivacy: false
  });

  const [errors, setErrors] = useState([]);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [message, setMessage] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const navigate = useNavigate();

  const getPasswordErrors = (pw) => {
    const errs = [];
    if (!pw || pw.length < 8) errs.push('Legalább 8 karakter hosszú legyen');
    if (!/[A-Za-z]/.test(pw || '')) errs.push('Tartalmazzon legalább egy betűt');
    if (!/[0-9]/.test(pw || '')) errs.push('Tartalmazzon legalább egy számjegyet');
    return errs;
  };

  const validateAll = () => {
    const newErrors = [];

    // Név
    const nameParts = form.name.trim().split(" ");
    if (nameParts.length < 2 || nameParts.some(p => p.length < 2)) {
      newErrors.push("A név nem megfelelő (vezetéknév + keresztnév).");
    }

    // Email
    if (!form.email.trim()) newErrors.push("Az email mező üres.");

    // Jelszó
    const pwErrs = getPasswordErrors(form.password);
    if (pwErrs.length > 0) newErrors.push("A jelszó nem felel meg a követelményeknek.");
    if (form.password !== form.passwordRepeat) newErrors.push("A két jelszó nem egyezik.");

    // Telefonszám
    if (!/^[0-9]{9}$/.test(form.phone_number)) {
      newErrors.push("A telefonszámnak pontosan 9 számjegynek kell lennie.");
    }

    // Lakcím
    if (form.address.length < 10 || !/\d/.test(form.address) || !form.address.includes(" ")) {
      newErrors.push("A lakcím nem megfelelő (min. 10 karakter, tartalmazzon számot és szóközt).");
    }

    // Személyi igazolvány
    const id = form.identity_card.trim();
    const pattern1 = /^[0-9]{6}[A-Za-z]{2}$/;
    const pattern2 = /^[A-Za-z][0-9]{6}[A-Za-z]$/;
    if (!(pattern1.test(id) || pattern2.test(id))) {
      newErrors.push("A személyi igazolvány szám formátuma hibás.");
    }

    // Jelölőnégyzetek
    if (!form.acceptTerms) newErrors.push("Az ÁSZF elfogadása kötelező.");
    if (!form.acceptPrivacy) newErrors.push("Az Adatkezelési tájékoztató elfogadása kötelező.");

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "phone_number") {
      const cleaned = value.replace(/\D/g, "").slice(0, 9);
      setForm({ ...form, phone_number: cleaned });
      return;
    }

    if (name === "identity_card") {
      setForm({ ...form, identity_card: value.slice(0, 8) });
      return;
    }

    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setMessage(null);

    if (!validateAll()) return;

    try {
      // Küldés a register-init végpontra (emailes megerősítés kezdeményezése)
      const backendBase = import.meta.env.VITE_API_BASE || "http://localhost:6969";
      const res = await axios.post(`${backendBase}/register-init`, {
        name: form.name,
        email: form.email,
        password: form.password,
        phone_number: "+36" + form.phone_number,
        birth_date: form.birth_date,
        address: form.address,
        identity_card: form.identity_card
      });

      // Sikeres kezdeményezés: email elküldve
      setMessage("Megerősítő email elküldve. Kérjük, ellenőrizd a postaládádat és kattints a benne található linkre a regisztráció véglegesítéséhez.");
      setDisabled(true);
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      setErrors([serverMsg || "Szerverhiba történt. Kérjük próbáld újra később."]);
    }
  };

  return (
    <div className='p-0 m-0 gap-0 flex flex-col min-h-screen'>
      <style>
        {`
          input[type="date"] {
            appearance: none;
            -webkit-appearance: none;
            position: relative;
          }
          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(0.3);
            cursor: pointer;
          }
        `}
      </style>

      <video autoPlay loop muted playsInline className='video-background absolute inset-0 hidden lg:block'>
        <source src='/catBack.mp4' type='video/mp4' />
      </video>
      <video autoPlay loop muted playsInline className='video-background absolute inset-0 lg:hidden block'>
        <source src='/SceneResponsive.mp4' type='video/mp4' />
      </video>

      <div className='flex flex-col w-dvw grow relative z-10'>
        <main className='flex items-center justify-center flex-1 m-0'>
          <div className='fade-in text-black bg-white shadow-md rounded-xl p-4 min-w-[320px] sm:min-w-[400px] w-1/3 h-fill min-h flex flex-col items-center mt-10 mb-10'>
            <p className='text-black mb-4'>Regisztráció</p>

            {message && (
              <div className="w-full mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded">
                {message}
              </div>
            )}

            <form className='w-full flex flex-col items-center' onSubmit={handleSubmit}>
              
              <input name="name" type='text' placeholder='Teljes név'
                className='mb-2 p-2 border border-gray-300 rounded w-full'
                value={form.name} onChange={handleChange} disabled={disabled} />

              <input name="email" type='email' placeholder='Email'
                className='mb-2 p-2 border border-gray-300 rounded w-full'
                value={form.email} onChange={handleChange} disabled={disabled} />

              <input name="password" type='password' placeholder='Jelszó'
                className='mb-2 p-2 border border-gray-300 rounded w-full'
                value={form.password}
                onChange={(e) => {
                  handleChange(e);
                  setPasswordErrors(getPasswordErrors(e.target.value));
                }} disabled={disabled} />

              <input name="passwordRepeat" type='password' placeholder='Jelszó újra'
                className='mb-2 p-2 border border-gray-300 rounded w-full'
                value={form.passwordRepeat} onChange={handleChange} disabled={disabled} />

              {passwordErrors.length > 0 && (
                <ul className="text-sm text-gray-700 mt-1 mb-1 list-disc list-inside self-start">
                  {passwordErrors.map((pe, idx) => (
                    <li key={idx}>{pe}</li>
                  ))}
                </ul>
              )}

              <div className='w-full flex items-center gap-2 mb-2'>
                <span className='px-2 py-2 bg-gray-100 border border-gray-300 rounded'>+36</span>
                <input name="phone_number" type='text' placeholder='Telefonszám (9 számjegy)'
                  className='p-2 border border-gray-300 rounded w-full'
                  value={form.phone_number} onChange={handleChange} disabled={disabled} />
              </div>

              <input name="birth_date" type='date'
                className='mb-2 p-2 border border-gray-300 rounded w-full text-gray-800'
                value={form.birth_date} onChange={handleChange} disabled={disabled} />

              <textarea name="address" placeholder='Lakcím'
                className='mb-2 p-2 border border-gray-300 rounded w-full'
                value={form.address} onChange={handleChange} disabled={disabled} />

              <input name="identity_card" type='text' placeholder='Személyi igazolvány szám'
                maxLength={8}
                className='mb-2 p-2 border border-gray-300 rounded w-full'
                value={form.identity_card} onChange={handleChange} disabled={disabled} />

              <label className='flex items-center gap-2 mt-2 self-start'>
                <input type="checkbox" name="acceptTerms" checked={form.acceptTerms} onChange={handleChange} disabled={disabled} />
                <span>
                  Elfogadom az{" "}
                  <a href="/aszf" target="_blank" rel="noopener noreferrer" className="text-red-500 underline">
                    ÁSZF-et
                  </a>
                </span>
              </label>

              <label className='flex items-center gap-2 mt-1 self-start'>
                <input type="checkbox" name="acceptPrivacy" checked={form.acceptPrivacy} onChange={handleChange} disabled={disabled} />
                <span>
                  Elfogadom az{" "}
                  <a href="/adatkezeles" target="_blank" rel="noopener noreferrer" className="text-red-500 underline">
                    Adatkezelési tájékoztatót
                  </a>
                </span>
              </label>

              <button type='submit'
                className='bg-[#6FD98C] text-white px-4 py-2 rounded hover:-translate-y-px transition-all duration-200 hover:bg-[#5FCB80] hover:cursor-pointer mt-4'
                disabled={disabled}>
                Regisztráció
              </button>
            </form>

            {errors.length > 0 && (
              <ul className="mt-4 text-sm text-red-600 self-start list-disc list-inside">
                {errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}

            <p className='mt-4'>
              Már van fiókod?{" "}
              <Link to="/login" className="text-red-500 hover:underline">
                Jelentkezz be
              </Link>
            </p>
          </div>
        </main>
      </div>

      <div className='relative z-10'>
        <Footer />
      </div>
    </div>
  );
};

export default Registration;
