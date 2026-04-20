import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const BookingSuccess = () => {
  const [pageLoaded, setPageLoaded] = useState(false);
  useEffect(() => { setPageLoaded(true); }, []);

  return (
    <>
      <div
        className={`flex flex-col min-h-screen w-dvw bg-[#0b1f13] text-[#F1FBF4] layerAdmin transition-all duration-500 ${pageLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'cover', backgroundAttachment: 'fixed' }}
      >
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-300 max-w-lg w-full p-8 text-center">
            {/* Check icon */}
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-3">Foglalás sikeresen leadva!</h1>

            <p className="text-gray-600 mb-2 text-base">
              Köszönjük, hogy minket választottál!
            </p>

            <p className="text-gray-600 mb-6 text-base">
              A foglalásod részleteiről <strong>e-mailt küldtünk</strong> neked. Amint a szállás elfogadja vagy elutasítja a foglalásodat, arról is <strong>külön értesítést kapsz e-mailben</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/user/bookings"
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-base"
              >
                Foglalásaim megtekintése
              </Link>
              <Link
                to="/"
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition text-base"
              >
                Vissza a főoldalra
              </Link>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default BookingSuccess;
