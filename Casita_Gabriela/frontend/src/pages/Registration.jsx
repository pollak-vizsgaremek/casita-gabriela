import React from 'react';
import { Link } from 'react-router';

const Registration = () => {
  return (
    <div className='flex items-center justify-center m-0 bg-gray-100 h-[90dvh] w-dvw'>
      <div className='flex flex-col'>
          
          <div className='text-black bg-white shadow-md rounded-xl p-4 ml-8 w-[25dvw] h-[75dvh] flex flex-col items-center'>
            <p className='text-black mb-4'> Regisztráció</p>
            <form className='w-full flex flex-col items-center'>
              <input
                type='text'
                placeholder='Teljes név'
                className='mb-2 p-2 border border-gray-300 rounded w-full'
              />
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
              <input
                type='password'
                placeholder='Jelszó újra'
                className='mb-2 p-2 border border-gray-300 rounded w-full'
              />
              <input
                type='tel'
                placeholder='Telefonszám'
                className='mb-2 p-2 border border-gray-300 rounded w-full'
              />
              <textarea
                placeholder='Lakcím'
                className='mb-2 p-2 border border-gray-300 rounded w-full'
              />
              <input
                type='text'
                placeholder='Személyi igazolvány szám'
                className='mb-2 p-2 border border-gray-300 rounded w-full'
              />
              <button type='submit' className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4'>
                Regisztráció
              </button>
            </form>
            <p className='mt-4'>
              Már van fiókod? <Link to="/login" className="text-blue-500 hover:underline">Jelentkezz be</Link>
            </p>
          </div>
      </div>
     
    </div>
  );
};

export default Registration;
