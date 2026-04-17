import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
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
    identity_card: ""
  });
  const [message, setMessage] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);
  
  const getPasswordErrors = (pw) => {
    const errs = [];
    if (!pw || pw.length < 8) errs.push('Legalább 8 karakter hosszú legyen');
    if (!/[A-Za-z]/.test(pw || '')) errs.push('Tartalmazzon legalább egy betűt');
    if (!/[0-9]/.test(pw || '')) errs.push('Tartalmazzon legalább egy számjegyet');
    return errs;
  };

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = getPasswordErrors(form.password);
    if (errs.length) {
      setPasswordErrors(errs);
      setMessage('');
      return;
    }

    if (form.password !== form.passwordRepeat) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const res = await axios.post("http://localhost:6969/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        phone_number: form.phone_number,
        birth_date: form.birth_date,
        address: form.address,
        identity_card: form.identity_card
      });

      try {
        const loginResp = await axios.post("http://localhost:6969/login", { 
          email: form.email, 
          password: form.password 
        });

        const user = loginResp.data.user;
        const token = loginResp.data.token;

        if (user && token) {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("user_id", user.id);
          window.dispatchEvent(new CustomEvent('authChanged', { detail: { user, token } }));
          navigate('/', { replace: true });
          return;
        }
      } catch (loginErr) {
        console.debug('Auto-login after register failed', loginErr?.message || loginErr);
      }

      setMessage(res.data.message || 'Sikeres regisztráció.');
    } catch (err) {
      setMessage("Registration failed. " + (err.response?.data?.error || ""));
    }
  };

  return (
    <div>
      {/* 🔧 DATE ICON FIX */}
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

      <div className='flex flex-col items-center justify-center m-0 min-h-screen w-dvw spacer layer1'>
        <div className='flex flex-col'>
          <div className='fade-in text-black bg-[#FFFFFF] shadow-md rounded-xl p-4 min-w-[350px] h-fill flex flex-col items-center'>
            <p className='text-black mb-4'> Regisztráció</p>

            <form className='w-full flex flex-col items-center' onSubmit={handleSubmit}>
              <input name="name" type='text' placeholder='Teljes név'
                className='mb-2 p-2 border h-8 border-gray-300 rounded w-full'
                value={form.name} onChange={handleChange} />

              <input name="email" type='email' placeholder='Email'
                className='mb-2 p-2 border h-8 border-gray-300 rounded w-full'
                value={form.email} onChange={handleChange} />

              <input name="password" type='password' placeholder='Jelszó'
                className='mb-2 p-2 border h-8 border-gray-300 rounded w-full'
                value={form.password}
                onChange={(e) => {
                  handleChange(e);
                  setPasswordErrors(getPasswordErrors(e.target.value));
                }} />

              <input name="passwordRepeat" type='password' placeholder='Jelszó újra'
                className='mb-2 p-2 border h-8 border-gray-300 rounded w-full'
                value={form.passwordRepeat} onChange={handleChange} />

              {passwordErrors.length > 0 && (
                <ul className="text-sm text-gray-700 mt-1 mb-1 list-disc list-inside">
                  {passwordErrors.map((pe, idx) => (
                    <li key={idx}>{pe}</li>
                  ))}
                </ul>
              )}

              <input name="phone_number" type='tel' placeholder='Telefonszám'
                className='mb-2 p-2 border h-8 border-gray-300 rounded w-full'
                value={form.phone_number} onChange={handleChange} />

              {/* ✅ DATE INPUT */}
              <input name="birth_date" type='date'
                className='mb-2 p-2 border h-8 border-gray-300 rounded w-full text-gray-800'
                value={form.birth_date} onChange={handleChange} />

              <textarea name="address" placeholder='Lakcím'
                className='mb-2 p-2 border h-11 border-gray-300 rounded w-full'
                value={form.address} onChange={handleChange} />

              <input name="identity_card" type='text' placeholder='Személyi igazolvány szám'
                className='mb-2 p-2 border h-8 border-gray-300 rounded w-full'
                value={form.identity_card} onChange={handleChange} />

              <button type='submit'
                className='bg-[#6FD98C] text-white px-4 py-2 rounded hover:-translate-y-px transition-all duration-200 hover:bg-[#5FCB80] hover:cursor-pointer mt-2'>
                Regisztráció
              </button>
            </form>

            {message && <p className="mt-4 text-sm text-green-600">{message}</p>}

            <p className='mt-4'>
              Már van fiókod? <Link to="/login" className="text-red-500 hover:underline">Jelentkezz be</Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Registration;