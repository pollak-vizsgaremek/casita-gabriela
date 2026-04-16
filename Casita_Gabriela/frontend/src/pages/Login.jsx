import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import axios from 'axios';
import Footer from "../components/Footer";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const emitAuthChange = (user, token) => {
    // persist to localStorage so other tabs receive storage event
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("user_id", user.id);
    // dispatch custom event for same-tab listeners
    window.dispatchEvent(new CustomEvent('authChanged', { detail: { user, token } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await axios.post("http://localhost:6969/login", form);

      if (!res.data || !res.data.user) {
        setMessage('Hiba: a szerver nem küldött user adatot.');
        return;
      }

      const user = res.data.user;
      const token = res.data.token;

      // persist and notify other components
      emitAuthChange(user, token);

      setMessage(res.data.message || 'Sikeres bejelentkezés.');

      // redirect back to original page if provided, otherwise admin or home
      const from = location.state?.from || (Number(user.isAdmin) === 1 ? '/admin' : '/');
      navigate(from, { replace: true });
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      setMessage("Bejelentkezés sikertelen. " + (serverMsg || err.message));
    }
  };

  return (
    <div className='p-0 m-0 gap-0 flex flex-col min-h-screen'>
      <video autoPlay loop muted playsInline className='video-background absolute inset-0 hidden lg:block'>
        <source src='/catBack.mp4' type='video/mp4' />
      </video>
      <video autoPlay loop muted playsInline className='video-background absolute inset-0 lg:hidden block'>
        <source src='/SceneResponsive.mp4' type='video/mp4' />
      </video>

      <div className='flex flex-col w-dvw grow relative z-10'>
        <main className='flex items-center justify-center flex-1 m-0'>
          <div className='fade-in text-black bg-white shadow-md rounded-xl p-4 min-w-[320px] sm:min-w-[400px] w-1/3 h-fill min-h flex flex-col items-center mt-10 mb-10'>
            <p className='text-black mb-4'>Bejelentkezés</p>

            <form className='w-full flex flex-col items-center' onSubmit={handleSubmit}>
              <input
                type='email'
                name='email'
                value={form.email}
                onChange={handleChange}
                placeholder='Email'
                className='mb-2 p-2 border border-gray-300 rounded w-full'
                required
              />
              <input
                type='password'
                name='password'
                value={form.password}
                onChange={handleChange}
                placeholder='Jelszó'
                className='mb-2 p-2 border border-gray-300 rounded w-full'
                required
              />

              <button
                type='submit'
                className='bg-[#6FD98C] text-white px-4 py-2 rounded hover:-translate-y-px transition-all duration-200 hover:bg-[#5FCB80] hover:cursor-pointer mt-4'
              >
                Belépés
              </button>
            </form>

            <p className='mt-4 text-red-500'>{message}</p>

            <p className='mt-4'>
              Még nincs fiókod?{" "}
              <Link to="/registration" className="text-red-500 hover:underline">
                Regisztrálj!
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

export default Login;
