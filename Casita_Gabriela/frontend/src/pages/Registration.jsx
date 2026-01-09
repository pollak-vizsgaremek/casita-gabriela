import React, { useState } from 'react';
import { Link } from 'react-router';
import axios from 'axios';

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        birth_date: form.birth_date, // e.g. "1990-01-01"
        address: form.address,
        identity_card: form.identity_card
      });
      setMessage(res.data.message);
    } catch (err) {
      setMessage("Registration failed. " + (err.response?.data?.error || ""));
    }
  };

  return (
    <div className='flex items-center justify-center m-0  h-[90dvh] w-dvw spacer layer1'>
      <div className='flex flex-col'>
        <div className='fade-in text-black bg-[#FFFFFF] shadow-md rounded-xl p-4 ml-8 w-[25dvw] h-fill flex flex-col items-center'>
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
              value={form.password} onChange={handleChange} />
            <input name="passwordRepeat" type='password' placeholder='Jelszó újra'
              className='mb-2 p-2 border h-8 border-gray-300 rounded w-full'
              value={form.passwordRepeat} onChange={handleChange} />
            <input name="phone_number" type='tel' placeholder='Telefonszám'
              className='mb-2 p-2 border h-8 border-gray-300 rounded w-full'
              value={form.phone_number} onChange={handleChange} />
            <input name="birth_date" type='date' placeholder='Születési dátum'
              className='mb-2 p-2 border h-8 border-gray-300 rounded w-full'
              value={form.birth_date} onChange={handleChange} />
            <textarea name="address" placeholder='Lakcím'
              className='mb-2 p-2 border h-11 border-gray-300 rounded w-full'
              value={form.address} onChange={handleChange} />
            <input name="identity_card" type='text' placeholder='Személyi igazolvány szám'
              className='mb-2 p-2 border h-8 border-gray-300 rounded w-full'
              value={form.identity_card} onChange={handleChange} />
            <button type='submit' className='bg-[#6FD98C] text-white px-4 py-2 rounded hover:-translate-y-px transition-all duration-200 hover:bg-[#5FCB80] hover:cursor-pointer mt-2'>
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
  );
};

export default Registration;
