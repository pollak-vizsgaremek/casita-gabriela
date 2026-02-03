import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router'; 
import axios from 'axios';
import Footer from "../components/Footer";

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
      const res = await axios.post("http://localhost:6969/login", form);
      setMessage(res.data.message);

      localStorage.setItem("token", res.data.token);

      // Backend role alapján irányítunk
      if (res.data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/"); // főoldalra ha nem admin
      }
    } catch (err) {
      setMessage("Login failed. " + (err.response?.data?.error || ""));
    }
  };

  return (
    <div className='p-0 m-0 gap-0'>
      <video autoPlay loop muted playsInline className='video-background'>
        <source src='/catBack.mp4' type='video/mp4' />
      </video>
      <div className='flex flex-col  w-dvw'>
        <main className='flex items-center justify-center flex-1 m-0'>
          <div className='fade-inR text-black m-30 bg-white shadow-md rounded-xl p-4 w-[65dvw] min-w-[350px] sm:w-[30dvw] sm:min-w-[275px] h-fill flex flex-col items-center'>
              <p className='text-black mb-4'>Bejelentkezés</p>
              <form className='w-full flex flex-col items-center' onSubmit={handleSubmit}>
                <input
                  type='email'
                  name='email'
                  value={form.email}
                  onChange={handleChange}
                  placeholder='Email'
                  className='mb-2 p-2 border border-gray-300 rounded w-full'
                />
                <input
                  type='password'
                  name='password'
                  value={form.password}
                  onChange={handleChange}
                  placeholder='Jelszó'
                  className='mb-2 p-2 border border-gray-300 rounded w-full'
                />
                <button type='submit' className='bg-[#6FD98C] text-white px-4 py-2 rounded hover:-translate-y-px transition-all duration-200 hover:bg-[#5FCB80] hover:cursor-pointer mt-4'>
                  Belépés
                </button>
              </form>
              <p className='mt-4 text-red-500'>{message}</p>
              <p className='mt-4'>
                Még nincs fiókod? <Link to="/registration" className="text-red-500 hover:underline">Regisztrálj!</Link>
                
              </p>
          </div>
        </main>
      </div>
      <div>
        <Footer />
      </div>
      
    </div>
  );
};

export default Login;
