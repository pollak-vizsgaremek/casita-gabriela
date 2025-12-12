import React from 'react';
import { Link } from 'react-router';

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center"></h2>
        <p className="text-center text-black mb-6">
           <Link to="/registration" className="text-blue-500 hover:underline">shortcut</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

