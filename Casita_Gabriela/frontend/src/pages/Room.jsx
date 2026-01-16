// src/pages/Room.jsx
import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import Footer from '../components/Footer';

const Room = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Később backendből jön majd
  const room = {
    id,
    name: 'Első szoba',
    price: 129500,
    description:
      'A Tóparti Apartman Hajdúszoboszló szívében található, modern és ízlésesen berendezett szobákkal. Ingyenes Wi-Fi, légkondicionálás, saját fürdőszoba és kényelmes felszereltség várja a vendégeket.',
    images: ['/blob.png', '/blob.png', '/blob.png', '/blob.png'],
    averageRating: 4.8,
    reviewsCount: 6,
    reviews: [
      { id: 1, stars: 5, comment: 'Nagyon szép, tiszta szoba, kedves személyzet.' },
      { id: 2, stars: 5, comment: 'Kiváló elhelyezkedés, minden közel van.' },
      { id: 3, stars: 4, comment: 'Kényelmes ágy, jó felszereltség.' },
      { id: 4, stars: 5, comment: 'Remek ár-érték arány, biztosan visszatérünk.' },
      { id: 5, stars: 4, comment: 'Csendes környezet, jó pihenési lehetőség.' },
      { id: 6, stars: 5, comment: 'Minden elvárásunkat felülmúlta.' },
    ],
  };

  const [selectedImage, setSelectedImage] = useState(room.images[0]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const isLoggedIn = !!localStorage.getItem('token');

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days > 0 ? days : 0;
  }, [checkIn, checkOut]);

  const totalPrice = useMemo(() => {
    if (!nights || !guests) return 0;
    return nights * guests * room.price;
  }, [nights, guests, room.price]);

  const handlePrimaryAction = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    // később fizetés
  };

  const formatPrice = (value) =>
    value.toLocaleString('hu-HU', { maximumFractionDigits: 0 });

  return (
    <div className="flex flex-col min-h-screen w-dvw bg-[#0b1f13] text-[#F1FBF4]">

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* BAL OLDAL */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h1 className="text-3xl font-mono tracking-wide text-[#F1FBF4]">
              {room.name}
            </h1>

            <div className="w-full bg-[#edf9f2] rounded-xl overflow-hidden">
              <img
                src={selectedImage}
                alt={room.name}
                className="w-full h-72 object-cover"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              {room.images.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-16 rounded-md overflow-hidden border ${
                    selectedImage === img ? 'border-[#6FD98C]' : 'border-transparent'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${room.name} kép ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            <div className="bg-white text-black rounded-xl p-4 shadow-md">
              <h2 className="font-semibold text-lg mb-2">Leírás</h2>
              <p className="text-sm leading-relaxed">{room.description}</p>
            </div>

            <div className="bg-white text-black rounded-xl p-4 shadow-md flex flex-col gap-4">
              <h2 className="font-semibold text-lg">Legjobb vélemények</h2>

              {room.reviews.slice(0, 4).map((review) => (
                <div key={review.id} className="border-b last:border-b-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-500">
                      {'★'.repeat(review.stars)}
                      {'☆'.repeat(5 - review.stars)}
                    </span>
                    <span className="text-xs text-gray-600">{review.stars}/5</span>
                  </div>
                  <p className="text-sm text-gray-800">{review.comment}</p>
                </div>
              ))}

              <div className="pt-2">
                <button
                  type="button"
                  className="bg-[#6FD98C] text-white px-4 py-2 rounded hover:bg-[#5FCB80] transition-all duration-200 text-sm"
                >
                  Vélemény írása
                </button>
              </div>
            </div>
          </div>

          {/* JOBB OLDAL – Foglalás */}
          <div className="flex flex-col gap-6">
            <div className="bg-white text-black rounded-xl p-4 shadow-md">
              <h2 className="font-semibold text-lg mb-2">Értékelés</h2>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-[#6FD98C]">
                  {room.averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-600">
                  {room.reviewsCount} értékelés alapján
                </span>
              </div>
              <div className="mt-2 text-yellow-500">
                {'★'.repeat(Math.round(room.averageRating))}
                {'☆'.repeat(5 - Math.round(room.averageRating))}
              </div>
            </div>

            <div className="bg-white text-black rounded-xl p-4 shadow-md flex flex-col gap-4">
              <h2 className="font-semibold text-lg">Foglalás</h2>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Érkezés</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Távozás</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Személyek száma</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} személy
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-700">
                  {nights > 0 ? `${nights} éj, ${guests} fő` : 'Válassz dátumot'}
                </span>
                <span className="font-semibold text-[#0b1f13]">
                  {totalPrice > 0 ? `${formatPrice(totalPrice)} Ft` : ''}
                </span>
              </div>

              <div className="flex flex-col gap-2 mt-3 text-xs text-gray-700">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  <span>
                    Elfogadom az{' '}
                    <a href="/aszf" className="text-blue-600 underline">
                      Általános Szerződési Feltételeket
                    </a>
                    .
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  <span>
                    Elfogadom az{' '}
                    <a href="/adatkezeles" className="text-blue-600 underline">
                      Adatkezelési Tájékoztatót
                    </a>
                    .
                  </span>
                </label>
              </div>

              <button
                type="button"
                disabled={!acceptedTerms || !nights || !guests}
                onClick={handlePrimaryAction}
                className={`mt-3 w-full px-4 py-2 rounded text-sm font-semibold ${
                  !acceptedTerms || !nights || !guests
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#6FD98C] text-white hover:bg-[#5FCB80] transition-all duration-200'
                }`}
              >
                {isLoggedIn ? 'Fizetési adatok megadása' : 'Bejelentkezés a foglaláshoz'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER KOMPONENS */}
      <Footer />
    </div>
  );
};

export default Room;
