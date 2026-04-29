// 404 oldal: nem található oldal megjelenítése
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const NotFound = () => {
  const [show, setShow] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setShow(true)); }, []);

  return (
    <>
      <style>{`
        .notfound-card {
          opacity: 0;
          transform: translateY(3rem) rotate(0deg);
          transform-origin: top left;
          transition: opacity 0.5s ease-out, transform 0.5s ease-out;
        }
        .notfound-card.show {
          opacity: 1;
          transform: translateY(0) rotate(2deg);
        }
      `}</style>
      <div
        className="flex flex-col min-h-screen w-dvw bg-[#0b1f13] text-[#F1FBF4] layerAdmin"
        style={{ backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'cover', backgroundAttachment: 'fixed' }}
      >
        <main className="flex-1 flex items-center justify-center px-4">
          <div
            className={`notfound-card bg-white rounded-2xl shadow-2xl border border-gray-300 max-w-lg w-full p-10 text-center ${show ? 'show' : ''}`}
          >
            <div className="mb-4">
              <span className="text-8xl font-extrabold bg-gradient-to-r from-green-500 to-emerald-700 bg-clip-text text-transparent">404</span>
            </div>
            <h2 className="text-3xl font-semibold text-gray-800 mb-3">Az oldal nem található</h2>
            <p className="text-lg text-gray-600 mb-8">
              A keresett oldal nem létezik vagy áthelyezésre került.
            </p>
            <Link
              to="/"
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-base"
            >
              Vissza a főoldalra
            </Link>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default NotFound;
