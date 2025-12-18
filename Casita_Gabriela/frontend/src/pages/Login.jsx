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
    <div className='flex items-center justify-center m-0 h-[90dvh] w-dvw spacer layerLeftorTop'>
     <div className='flex sm:flex-row-reverse flex-col-reverse'>
                <div className='sm:w-[50dvw] w-dvw h-[50dvh] sm:h-dvh flex items-center justify-center sm:justify-start'>
                    <div className='fade-inR text-black bg-white shadow-md rounded-xl p-4 sm:ml-8 w-[65dvw] min-w-[350px] sm:w-[30dvw] sm:min-w-[275px] h-fill flex flex-col items-center'>
                 <p className='text-black mb-4'>Bejelentkezés</p>
                 <form className='w-full flex flex-col items-center'>
                   <input
                     type='email'
                     placeholder='Email'
                     className='mb-2 p-2 border border-gray-300 rounded w-full'
                   />
                   <input
                     type='password'
                     placeholder='Jelszó'
                     className='mb-2 p-2 border border-gray-300 rounded w-full'
                   />
                   <button type='submit' className='bg-[#6FD98C] text-white px-4 py-2 rounded hover:-translate-y-px transition-all duration-200 hover:bg-[#5FCB80] hover:cursor-pointer mt-4'>
                     Belépés
                   </button>
                 </form>
                 <p className='mt-4'>
                   Még nincs fiókod? <Link to="/registration" className="text-red-500 hover:underline">Regisztrálj!</Link>
                 </p>
               </div>
                </div>
               
               <div className='sm:w-[50dvw] w-dvw h-[50dvh] sm:h-dvh flex items-center  sm:justify-start justify-center'>
                  <div className='text-shadow-lg/10 font-mono tracking-wide sm:pl-10 pl-0  text-[#F1FBF4] p-4 sm:ml-8 ml-0.5 w-[25dvw] text-4xl h-fill flex flex-col items-center text-center'>
                A szobák kezeléséhez és további foglalásához jelentkezzen be a fiókjába!
                </div>
               </div>
               
        </div>
    </div>
  );
};

export default Login;
