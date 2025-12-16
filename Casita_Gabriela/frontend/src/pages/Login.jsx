import React from 'react';
import { Link } from 'react-router';

const Login = () => {
  return (
    <div className='flex items-center justify-center m-0 h-[90dvh] w-dvw'>
     <div className='flex flex-col'>
               <div className='text-black bg-white shadow-md rounded-xl p-4 ml-8 w-[25dvw] h-fill flex flex-col items-center'>
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
                   <button type='submit' className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4'>
                     Belépés
                   </button>
                 </form>
                 <p className='mt-4'>
                   Még nincs fiókod? <Link to="/registration" className="text-blue-500 hover:underline">Regisztrálj!</Link>
                 </p>
               </div>
           </div>
    </div>
  );
};

export default Login;

