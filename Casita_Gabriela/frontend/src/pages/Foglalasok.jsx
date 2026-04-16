// src/pages/Foglalasok.jsx

import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { useLocation } from 'react-router';
import { useNavigate } from 'react-router';

const STATUS_PENDING = 'pending';
const STATUS_APPROVED = 'approved';
const STATUS_REJECTED = 'rejected';

const formatDate = (iso) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
};

const BookingRow = ({ b, onApprove, onReject, onChangeStatus }) => {
  return (
    <div className="bg-white border rounded-md p-3 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1">
        <div className="text-sm text-gray-600">Foglalás #<span className="font-medium text-gray-800">{b.id}</span></div>
        <div className="text-sm text-gray-700 mt-1">
          <span className="font-semibold">Szoba:</span> {b.room_id ?? '-'} &nbsp; • &nbsp;
          <span className="font-semibold">Felhasználó:</span> {b.user_id ?? '-'}
        </div>
        <div className="text-sm text-gray-600 mt-1">
          <span className="font-semibold">Érkezés:</span> {formatDate(b.arrival_date)} &nbsp; • &nbsp;
          <span className="font-semibold">Távozás:</span> {formatDate(b.departure_date)}
        </div>
        <div className="text-sm text-gray-600 mt-1">
          <span className="font-semibold">Foglalva:</span> {formatDate(b.booking_date)} &nbsp; • &nbsp;
          <span className="font-semibold">Férőhely:</span> {b.people ?? '-'}
        </div>
      </div>

      <div className="flex-shrink-0 flex items-center gap-2">
        <div className={`px-3 py-1 rounded text-sm font-medium ${b.status === STATUS_PENDING ? 'bg-yellow-100 text-yellow-800' : b.status === STATUS_APPROVED ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {b.status}
        </div>

        {b.status === STATUS_PENDING && (
          <>
            <button
              onClick={() => onApprove(b)}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Jóváhagy
            </button>
            <button
              onClick={() => onReject(b)}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Elutasít
            </button>
          </>
        )}

        {b.status !== STATUS_PENDING && (
          <div className="flex gap-2">
            <button
              onClick={() => onChangeStatus(b, STATUS_APPROVED)}
              disabled={b.status === STATUS_APPROVED}
              className="px-2 py-1 bg-white border rounded text-sm disabled:opacity-50"
              title="Átállít jóváhagyottra"
            >
              ✔
            </button>
            <button
              onClick={() => onChangeStatus(b, STATUS_REJECTED)}
              disabled={b.status === STATUS_REJECTED}
              className="px-2 py-1 bg-white border rounded text-sm disabled:opacity-50"
              title="Átállít elutasítottra"
            >
              ✖
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const CollapsibleGroup = ({ title, count, openByDefault = false, children }) => {
  const [open, setOpen] = useState(openByDefault);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between bg-gray-100 px-4 py-2 rounded-md"
        aria-expanded={open}
      >
        <div className="text-sm font-semibold">{title} <span className="text-gray-500 ml-2">({count})</span></div>
        <div className="text-gray-600">{open ? '▲' : '▼'}</div>
      </button>
      {open && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
};

const Foglalasok = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings');
      // ensure array
      const data = Array.isArray(res.data) ? res.data : [];
      // sort by booking_date desc for display
      data.sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date));
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      setUpdatingId(bookingId);
      // backend supports both /booking/:id and /bookings/:id aliases for PUT
      await api.put(`/booking/${bookingId}`, { status: newStatus });
      // optimistic refresh
      await fetchBookings();
    } catch (err) {
      console.error('Error updating booking status:', err);
      // try alternate alias if needed
      try {
        await api.put(`/bookings/${bookingId}`, { status: newStatus });
        await fetchBookings();
      } catch (e) {
        console.error('Alternate update failed:', e);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApprove = (b) => {
    if (!window.confirm(`Jóváhagyod a #${b.id} foglalást?`)) return;
    updateBookingStatus(b.id, STATUS_APPROVED);
  };

  const handleReject = (b) => {
    if (!window.confirm(`Elutasítod a #${b.id} foglalást?`)) return;
    updateBookingStatus(b.id, STATUS_REJECTED);
  };

  const handleChangeStatus = (b, status) => {
    if (!window.confirm(`Átállítod a #${b.id} státuszát ${status}-re?`)) return;
    updateBookingStatus(b.id, status);
  };

  // group bookings
  const pending = bookings.filter((b) => (b.status || '').toLowerCase() === STATUS_PENDING);
  const approved = bookings.filter((b) => (b.status || '').toLowerCase() === STATUS_APPROVED);
  const rejected = bookings.filter((b) => (b.status || '').toLowerCase() === STATUS_REJECTED);
  // any other statuses go into 'other' (not shown by default)
  const others = bookings.filter((b) => {
    const s = (b.status || '').toLowerCase();
    return s !== STATUS_PENDING && s !== STATUS_APPROVED && s !== STATUS_REJECTED;
  });

  return (
    <div className="flex min-h-screen w-dvw bg-[#f7faf7]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 ml-0 md:ml-64">
        {/* MOBILE HEADER */}
        <header className="flex items-center justify-between px-5 py-4 border-b bg-white md:hidden">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
            aria-label="Menü"
          >
            <svg className="h-6 w-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="text-lg font-semibold">Foglalások kezelése</div>
          <div style={{ width: 36 }} />
        </header>

        <main className="px-5 pt-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Foglalások</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchBookings}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Frissít
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                Vissza a szobákhoz
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-500">Foglalások betöltése...</p>
          ) : (
            <div className="space-y-6">
              {/* Pending first */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Jóváhagyásra váró</h3>
                {pending.length === 0 ? (
                  <div className="text-gray-500">Nincs jóváhagyásra váró foglalás.</div>
                ) : (
                  <div className="space-y-3">
                    {pending.map((b) => (
                      <div key={b.id} className={`${updatingId === b.id ? 'opacity-60' : ''}`}>
                        <BookingRow
                          b={b}
                          onApprove={handleApprove}
                          onReject={handleReject}
                          onChangeStatus={handleChangeStatus}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Approved (collapsible) */}
              <CollapsibleGroup title="Jóváhagyottak" count={approved.length} openByDefault={false}>
                {approved.length === 0 ? (
                  <div className="text-gray-500">Nincs jóváhagyott foglalás.</div>
                ) : (
                  approved.map((b) => (
                    <div key={b.id} className={`${updatingId === b.id ? 'opacity-60' : ''}`}>
                      <BookingRow
                        b={b}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onChangeStatus={handleChangeStatus}
                      />
                    </div>
                  ))
                )}
              </CollapsibleGroup>

              {/* Rejected (collapsible) */}
              <CollapsibleGroup title="Elutasítottak" count={rejected.length} openByDefault={false}>
                {rejected.length === 0 ? (
                  <div className="text-gray-500">Nincs elutasított foglalás.</div>
                ) : (
                  rejected.map((b) => (
                    <div key={b.id} className={`${updatingId === b.id ? 'opacity-60' : ''}`}>
                      <BookingRow
                        b={b}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onChangeStatus={handleChangeStatus}
                      />
                    </div>
                  ))
                )}
              </CollapsibleGroup>

              {/* Other statuses (optional) */}
              {others.length > 0 && (
                <CollapsibleGroup title="Egyéb státuszok" count={others.length} openByDefault={false}>
                  {others.map((b) => (
                    <div key={b.id} className={`${updatingId === b.id ? 'opacity-60' : ''}`}>
                      <BookingRow
                        b={b}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onChangeStatus={handleChangeStatus}
                      />
                    </div>
                  ))}
                </CollapsibleGroup>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Inline small styles */}
      <style>{`
        /* small responsive tweaks */
        @media (min-width: 768px) {
          main { padding: 2rem; }
        }
      `}</style>
    </div>
  );
};

export default Foglalasok;