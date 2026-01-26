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
      <div className='flex flex-col min-h-screen w-dvw spacer layerLeftorTop'>
          <main className='flex items-center justify-center flex-1 m-0'>
        <div className='flex sm:flex-row-reverse flex-col-reverse'>
          <div className='sm:w-[50dvw] w-dvw h-[50dvh] sm:h-dvh flex items-center justify-center sm:justify-start'>
            <div className='fade-inR text-black bg-white shadow-md rounded-xl p-4 sm:ml-8 w-[65dvw] min-w-[350px] sm:w-[30dvw] sm:min-w-[275px] h-fill flex flex-col items-center'>
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
              <p className='mt-4'>
                Admin Ideiglenes hozzáférés: <Link to="/admin" className="text-red-500 hover:underline">Link</Link>
              </p>
            </div>
          </div>

          <div className='sm:w-[50dvw] w-dvw h-[50dvh] sm:h-dvh flex items-center sm:justify-start justify-center'>
            <div className='text-shadow-lg/10 font-mono tracking-wide sm:pl-10 pl-0 text-[#F1FBF4] p-4 sm:ml-8 ml-0.5 w-[25dvw] text-4xl h-fill flex flex-col items-center text-center'>
              A szobák kezeléséhez és további foglalásához jelentkezzen be a fiókjába!
            </div>
          </div>
          
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
