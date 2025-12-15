import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import axios from 'axios';

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:6969/login", {
        email: form.email,
        password: form.password,
      });
      setMessage(res.data.message);

      // token mentése
      localStorage.setItem("token", res.data.token);

      // redirect pl. dashboardra
      navigate("/dashboard");
    } catch (err) {
      setMessage("Login failed. " + (err.response?.data?.error || ""));
    }
  };

  return (
    <div className='flex items-center justify-center m-0 bg-gray-100 h-[90dvh] w-dvw'>
      <div className='flex flex-col'>
        <div className='text-black bg-white shadow-md rounded-xl p-4 ml-8 w-[25dvw] h-fill flex flex-col items-center'>
          <p className='text-black mb-4'>Bejelentkezés</p>
          <form className='w-full flex flex-col items-center' onSubmit={handleSubmit}>
            <input
              name="email"
              type='email'
              placeholder='Email'
              className='mb-2 p-2 border border-gray-300 rounded w-full'
              value={form.email}
              onChange={handleChange}
            />
            <input
              name="password"
              type='password'
              placeholder='Jelszó'
              className='mb-2 p-2 border border-gray-300 rounded w-full'
              value={form.password}
              onChange={handleChange}
            />
            <button type='submit' className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4'>
              Belépés
            </button>
          </form>
          {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
          <p className='mt-4'>
            Még nincs fiókod? <Link to="/registration" className="text-blue-500 hover:underline">Regisztrálj!</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
