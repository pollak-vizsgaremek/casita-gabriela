// Foglalás siker: visszaigazoló oldal és banki átutalási információk
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';

const BookingSuccess = () => {
  const [pageLoaded, setPageLoaded] = useState(false);
  const location = useLocation();
  const bookingData = location.state?.bookingData;
  const bookingId = bookingData?.id || 'N/A';
  const totalPrice = bookingData?.total_price || bookingData?.totalPrice || bookingData?.price || 0;

  const bankAccountName = "Casita Gabriela Kft.";
  const bankAccountNumber = "12345678-12345678-12345678";

  useEffect(() => { setPageLoaded(true); }, []);

  return (
    <>
      <div
        className={`flex flex-col min-h-screen w-dvw bg-[#0b1f13] text-[#F1FBF4] layerAdmin transition-all duration-500 ${pageLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'cover', backgroundAttachment: 'fixed' }}
      >
        <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-0">
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

            {/* Banki átutaláshoz szükséges információ */}
            <div className="bg-blue-50 rounded-lg p-6 mb-6 text-left border border-blue-200">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Banki Átutalás Szükséges</h2>
              
              <p className="text-gray-700 mb-4 text-sm">
                A foglalásod véglegesítéséhez szükséges a <strong>banki előreutalás</strong>. Az átutalás után a szállás <strong>jóváhagyja</strong> a foglalásodat.
              </p>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600"><strong>Számlát vezető neve:</strong></p>
                  <p className="text-gray-800 font-medium">{bankAccountName}</p>
                </div>

                <div>
                  <p className="text-gray-600"><strong>Számlaszám:</strong></p>
                  <p className="text-gray-800 font-medium">{bankAccountNumber}</p>
                </div>

                <div>
                  <p className="text-gray-600"><strong>Átutalandó összeg:</strong></p>
                  <p className="text-gray-800 font-bold text-base">{totalPrice} Ft</p>
                </div>

                <div>
                  <p className="text-gray-600"><strong>Megjegyzés az átutalásban:</strong></p>
                  <p className="text-gray-800 font-medium rounded">Foglalás: {bookingId}</p>
                </div>
              </div>
            </div>

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
