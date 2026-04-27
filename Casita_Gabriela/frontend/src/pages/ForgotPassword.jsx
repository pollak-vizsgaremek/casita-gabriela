import React, { useState } from 'react';
import { Link } from 'react-router';
import axios from 'axios';
import Footer from "../components/Footer";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:6969/forgot-password", { email });
      setMessage(res.data.message || "Email elküldve!");
      setSuccess(true);
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      setMessage(serverMsg || "Hiba történt. Próbáld újra.");
    }
    setLoading(false);
  };

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
            <p className='text-black mb-4'>Elfelejtett jelszó</p>

            <form className='w-full flex flex-col items-center' onSubmit={handleSubmit}>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Email cím'
                className='mb-2 p-2 border border-gray-300 rounded w-full'
                required
              />

              <button
                type='submit'
                className='bg-[#6FD98C] text-white px-4 py-2 rounded hover:-translate-y-px transition-all duration-200 hover:bg-[#5FCB80] hover:cursor-pointer mt-4'
                disabled={loading || success}
              >
                {loading ? "Küldés..." : "Email küldése"}
              </button>
            </form>

            <p className={`mt-4 ${success ? 'text-green-600' : 'text-red-500'}`}>{message}</p>

            <p className='mt-4'>
              <Link to="/login" className="text-red-500 hover:underline">
                Vissza a bejelentkezéshez
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

export default ForgotPassword;
