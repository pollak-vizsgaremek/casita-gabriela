// src/pages/Room.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import Footer from '../components/Footer';
import api from '../services/api';

// Segéd: hónap első napja
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
// Segéd: hónap utolsó napja
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
// Segéd: dátum ISO
const iso = (d) => d.toISOString().slice(0, 10);

const MonthCalendar = ({ monthDate, bookings, onDayClick, selectedRange }) => {
  // hónap első napja és napok száma
  const start = startOfMonth(monthDate);
  const last = endOfMonth(monthDate);
  const daysInMonth = last.getDate();

  // hét napja az első cella eltolásához (hétfő kezdéshez: (getDay()+6)%7)
  const startWeekday = (start.getDay() + 6) % 7;

  // készítünk üres cellákat az első sorhoz
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(start.getFullYear(), start.getMonth(), d);
    cells.push(date);
  }

  const isBooked = (date) => {
    if (!date) return false;
    const d = new Date(date).setHours(0, 0, 0, 0);
    return bookings.some((b) => {
      const s = new Date(b.arrival_date || b.arrivalDate).setHours(0, 0, 0, 0);
      const e = new Date(b.departure_date || b.departureDate).setHours(0, 0, 0, 0);
      return d >= s && d < e;
    });
  };

  const inSelectedRange = (date) => {
    if (!selectedRange || !selectedRange.start || !selectedRange.end) return false;
    const d = new Date(date).setHours(0, 0, 0, 0);
    const s = new Date(selectedRange.start).setHours(0, 0, 0, 0);
    const e = new Date(selectedRange.end).setHours(0, 0, 0, 0);
    return d >= s && d <= e;
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
        {['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'].map((d) => (
          <div key={d} className="text-gray-600">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, idx) => {
          if (!date) return <div key={idx} className="h-12"></div>;
          const dayIso = iso(date);
          const booked = isBooked(date);
          const selected = inSelectedRange(date);
          return (
            <button
              key={dayIso}
              type="button"
              onClick={() => !booked && onDayClick(dayIso)}
              disabled={booked}
              className={`h-12 rounded-md flex flex-col items-center justify-center text-sm transition
                ${booked ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : selected ? 'bg-[#6FD98C] text-white' : 'bg-white text-gray-800 hover:bg-gray-100'}
              `}
            >
              <div className="font-medium">{date.getDate()}</div>
              <div className="text-[10px] text-gray-500">{date.toLocaleString('hu-HU', { month: 'short' })}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Room = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  const [acceptedAszf, setAcceptedAszf] = useState(false);
  const [acceptedAdat, setAcceptedAdat] = useState(false);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(new Date()); // melyik hónap látszik a naptárban

  const isLoggedIn = !!localStorage.getItem('token');
  const currentUserId = localStorage.getItem('user_id') ? Number(localStorage.getItem('user_id')) : null;

  useEffect(() => {
    fetchRoom();
    fetchBookings();
    const interval = setInterval(() => fetchBookings(), 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRoom = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/rooms/${id}`);
      const data = res.data;
      const roomData = {
        ...data,
        images: Array.isArray(data.images) ? data.images : data.images ? [data.images] : ['/blob.png'],
        space: data.space ?? 1,
        reviews: data.reviews || [],
      };
      setRoom(roomData);
      setSelectedImage(roomData.images[0]);
    } catch (err) {
      console.error('Error fetching room:', err);
      setRoom(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await api.get(`/bookings?room_id=${id}`);
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  // tartomány átfedés ellenőrzése
  const isRangeUnavailable = (startStr, endStr) => {
    if (!startStr || !endStr) return false;
    const start = new Date(startStr).setHours(0, 0, 0, 0);
    const end = new Date(endStr).setHours(0, 0, 0, 0);
    if (end <= start) return true;
    return bookings.some((b) => {
      const bStart = new Date(b.arrival_date || b.arrivalDate).setHours(0, 0, 0, 0);
      const bEnd = new Date(b.departure_date || b.departureDate).setHours(0, 0, 0, 0);
      return start < bEnd && end > bStart;
    });
  };

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days > 0 ? days : 0;
  }, [checkIn, checkOut]);

  const totalPrice = useMemo(() => {
    if (!nights || !guests || !room) return 0;
    return nights * guests * room.price;
  }, [nights, guests, room]);

  const formatPrice = (value) => value.toLocaleString('hu-HU', { maximumFractionDigits: 0 });

  // naptár nap kiválasztás logika (érkezés/távozás)
  const handleDayClick = (dayIso) => {
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(dayIso);
      setCheckOut('');
      return;
    }
    // ha van checkIn, akkor beállítjuk checkOutnak, ha későbbi
    if (new Date(dayIso) <= new Date(checkIn)) {
      setCheckIn(dayIso);
      setCheckOut('');
      return;
    }
    // ellenőrizzük, hogy a tartomány átfed-e
    if (isRangeUnavailable(checkIn, dayIso)) {
      // nem állítjuk be, csak vizuálisan jelöljük a foglaltságot
      setCheckOut('');
      return;
    }
    setCheckOut(dayIso);
  };

  // foglalás POST
  const handleBooking = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!checkIn || !checkOut) {
      alert('Kérlek válassz érkezési és távozási dátumot.');
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      alert('A távozási dátumnak később kell lennie, mint az érkezési dátumnak.');
      return;
    }
    if (isRangeUnavailable(checkIn, checkOut)) {
      alert('A kiválasztott időszakban a szoba nem elérhető. Kérlek válassz másik időpontot.');
      return;
    }
    if (!acceptedAszf || !acceptedAdat) {
      alert('Kérlek fogadd el az ÁSZF-et és az Adatkezelési Tájékoztatót.');
      return;
    }

    const payload = {
      arrival_date: checkIn,
      departure_date: checkOut,
      people: guests,
      booking_date: new Date().toISOString().slice(0, 10),
      status: 'pending',
      user_id: currentUserId || null,
      room_id: Number(id),
    };

    try {
      const res = await api.post('/bookings', payload);
      console.log('Booking response:', res.status, res.data);
      alert('Foglalás sikeresen leadva. A foglalás státusza: függőben.');
      fetchBookings();
      setCheckIn('');
      setCheckOut('');
      setGuests(1);
      setAcceptedAszf(false);
      setAcceptedAdat(false);
      setCalendarOpen(false);
    } catch (err) {
      console.error('Booking error full:', err);
      const status = err?.response?.status;
      const serverMsg = err?.response?.data || err?.message;
      alert(`Hiba történt a foglalás során (HTTP ${status || '??'}): ${JSON.stringify(serverMsg)}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-dvw bg-[#0b1f13] text-[#F1FBF4]">
        <p className="text-gray-500">Szoba betöltése...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen w-dvw bg-[#0b1f13] text-[#F1FBF4]">
        <p className="text-red-500">Szoba nem található</p>
      </div>
    );
  }

  const rangeUnavailable = isRangeUnavailable(checkIn, checkOut);

  return (
    <div className="flex flex-col min-h-screen w-dvw bg-[#0b1f13] text-[#F1FBF4] spacer layerAdmin">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* BAL OLDAL */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h1 className="text-3xl font-mono tracking-wide text-black">{room.name}</h1>

            <div className="w-full bg-[#FFFECE] rounded-xl overflow-hidden shadow-md/20 fade-in">
              <img src={selectedImage} alt={room.name} className="w-full h-72 object-cover" />
            </div>

            <div className="flex gap-3 flex-wrap fade-in-Left">
              {room.images.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-16 rounded-md overflow-hidden border ${selectedImage === img ? 'border-[#6FD98C]' : 'border-transparent'}`}
                >
                  <img src={img} alt={`${room.name} kép ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="bg-[#FFFECE] text-black rounded-xl p-4 shadow-md fade-in-Left">
              <h2 className="font-semibold text-lg mb-2">Leírás</h2>
              <p className="text-sm leading-relaxed">{room.description}</p>
            </div>
          </div>

          {/* JOBB OLDAL – Foglalás */}
          <div className="flex flex-col gap-6">
            <div className="bg-[#FFFECE] text-black rounded-xl p-4 shadow-md fade-inR">
              <h2 className="font-semibold text-lg">Foglalás</h2>

              <div className="mt-2">
                <div className="flex gap-2 items-center">
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-600">Érkezés</label>
                    <div className="text-sm font-medium">{checkIn || '-'}</div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-600">Távozás</label>
                    <div className="text-sm font-medium">{checkOut || '-'}</div>
                  </div>
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setCalendarOpen((s) => !s)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    {calendarOpen ? 'Naptár bezárása' : 'Naptár megnyitása'}
                  </button>
                </div>

                {calendarOpen && (
                  <div className="mt-4 p-4 bg-white text-black rounded-lg shadow">
                    <div className="flex items-center justify-between mb-3">
                      <button
                        type="button"
                        onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
                        className="px-2 py-1 border rounded"
                      >
                        Előző
                      </button>
                      <div className="font-medium">
                        {visibleMonth.toLocaleString('hu-HU', { month: 'long', year: 'numeric' })}
                      </div>
                      <button
                        type="button"
                        onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
                        className="px-2 py-1 border rounded"
                      >
                        Következő
                      </button>
                    </div>

                    <MonthCalendar
                      monthDate={visibleMonth}
                      bookings={bookings}
                      onDayClick={handleDayClick}
                      selectedRange={{ start: checkIn, end: checkOut }}
                    />

                    <div className="mt-3 flex gap-2 justify-end">
                      <button type="button" onClick={() => { setCheckIn(''); setCheckOut(''); }} className="px-3 py-2 border rounded">Törlés</button>
                      <button
                        type="button"
                        onClick={() => setCalendarOpen(false)}
                        className="px-3 py-2 border rounded"
                      >
                        Bezár
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {rangeUnavailable && (
                <p className="text-sm text-red-600 mt-2">
                  A kiválasztott időszak átfed egy meglévő foglalással. Válassz másik időpontot.
                </p>
              )}

              <div className="flex flex-col gap-2 mt-3">
                <label className="text-sm font-medium">Személyek száma</label>
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1 text-sm">
                  {Array.from({ length: room.space || 1 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} személy</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2 mt-3 text-xs text-gray-700">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={acceptedAszf} onChange={(e) => setAcceptedAszf(e.target.checked)} />
                  <span>Elfogadom az <a href="/aszf" className="text-blue-600 underline">ÁSZF-et</a>.</span>
                </label>

                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={acceptedAdat} onChange={(e) => setAcceptedAdat(e.target.checked)} />
                  <span>Elfogadom az <a href="/adatkezeles" className="text-blue-600 underline">Adatkezelési Tájékoztatót</a>.</span>
                </label>
              </div>

              <button
                type="button"
                disabled={!acceptedAszf || !acceptedAdat || !nights || rangeUnavailable}
                onClick={handleBooking}
                className={`mt-3 w-full px-4 py-2 rounded text-sm font-semibold ${!acceptedAszf || !acceptedAdat || !nights || rangeUnavailable ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#6FD98C] text-white hover:bg-[#5FCB80]'}`}
              >
                {isLoggedIn ? 'Foglalás leadása' : 'Bejelentkezés a foglaláshoz'}
              </button>

              <div className="mt-3 flex items-center justify-between text-sm text-gray-700">
                <span>{nights > 0 ? `${nights} éj, ${guests} fő` : 'Válassz dátumot'}</span>
                <span className="font-semibold text-[#0b1f13]">{totalPrice > 0 ? `${formatPrice(totalPrice)} Ft` : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Room;
