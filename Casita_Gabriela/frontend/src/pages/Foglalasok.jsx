// src/pages/Foglalasok.jsx

import React, { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import Toast, { useToast } from '../components/Toast';
import { useLocation } from 'react-router';
import { useNavigate } from 'react-router';

const STATUS_PENDING = 'pending';
const STATUS_APPROVED = 'approved';
const STATUS_REJECTED = 'rejected';
const CONFIRM_ANIMATION_MS = 220;

const getStatusLabel = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === STATUS_PENDING) return 'Függőben';
  if (normalized === STATUS_APPROVED) return 'Jóváhagyva';
  if (normalized === STATUS_REJECTED) return 'Elutasítva';
  return status || '-';
};

const formatDate = (iso) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
};

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '-';
  return `${amount.toLocaleString('hu-HU')} Ft`;
};

const BookingRow = ({ b, onApprove, onReject, onChangeStatus, roomNameById, userNameById }) => {
  const roomLabel = b?.room?.name || roomNameById.get(b.room_id) || (b.room_id ? `#${b.room_id}` : '-');
  const userLabel = b?.users?.name || userNameById.get(b.user_id) || (b.user_id ? `#${b.user_id}` : '-');

  return (
    <div className="bg-white border rounded-md p-3 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1">
        <div className="text-sm text-gray-600">Foglalás #<span className="font-medium text-gray-800">{b.id}</span></div>
        <div className="text-sm text-gray-700 mt-1">
          <span className="font-semibold">Szoba:</span> {roomLabel} &nbsp; • &nbsp;
          <span className="font-semibold">Felhasználó:</span> {userLabel}
        </div>
        <div className="text-sm text-gray-600 mt-1">
          <span className="font-semibold">Érkezés:</span> {formatDate(b.arrival_date)} &nbsp; • &nbsp;
          <span className="font-semibold">Távozás:</span> {formatDate(b.departure_date)}
        </div>
        <div className="text-sm text-gray-600 mt-1">
          <span className="font-semibold">Foglalva:</span> {formatDate(b.booking_date)} &nbsp; • &nbsp;
          <span className="font-semibold">Vendégek:</span> {b.people ?? '-'}
        </div>
        <div className="text-sm text-gray-600 mt-1">
          <span className="font-semibold italic">Végösszeg:</span> <span className="italic">{formatCurrency(b.total_price)}</span>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <div className={`px-3 py-1 rounded text-sm font-medium ${b.status === STATUS_PENDING ? 'bg-yellow-100 text-yellow-800' : b.status === STATUS_APPROVED ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {getStatusLabel(b.status)}
        </div>

        {b.status === STATUS_PENDING && (
          <>
            <button
              onClick={() => onApprove(b)}
              className="px-3 py-1 bg-green-100 text-green-800 border border-green-200 rounded text-sm hover:cursor-pointer hover:bg-green-200 transition-colors"
            >
              Jóváhagy
            </button>
            <button
              onClick={() => onReject(b)}
              className="px-3 py-1 bg-red-100 text-red-700 border border-red-200 rounded text-sm hover:cursor-pointer hover:bg-red-200 transition-colors"
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

const CollapsibleGroup = ({ title, count, openByDefault = false, children, titleClass = '' }) => {
  const [open, setOpen] = useState(openByDefault);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between bg-gray-100 px-4 py-2 rounded-md"
        aria-expanded={open}
      >
        <div className={`text-sm font-semibold ${titleClass}`}>{title} <span className="text-gray-500 ml-2">({count})</span></div>
        <div className="text-gray-600">{open ? '▲' : '▼'}</div>
      </button>
      {open && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
};

const Foglalasok = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [roomNameById, setRoomNameById] = useState(new Map());
  const [userNameById, setUserNameById] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmMounted, setConfirmMounted] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const closeConfirmTimeoutRef = useRef(null);
  const openConfirmRafRef = useRef(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Megerősítés',
    variant: 'primary',
    onConfirm: null,
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { toasts, pushToast, removeToast } = useToast();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    return () => {
      if (closeConfirmTimeoutRef.current) clearTimeout(closeConfirmTimeoutRef.current);
      if (openConfirmRafRef.current) cancelAnimationFrame(openConfirmRafRef.current);
    };
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const [bookingsRes, roomsRes, usersRes] = await Promise.allSettled([
        api.get('/booking'),
        api.get('/rooms'),
        api.get('/admin/users'),
      ]);

      if (bookingsRes.status !== 'fulfilled') {
        throw bookingsRes.reason;
      }

      // ensure array
      const data = Array.isArray(bookingsRes.value.data) ? bookingsRes.value.data : [];
      // sort by booking_date desc for display
      data.sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date));
      setBookings(data);

      if (roomsRes.status === 'fulfilled') {
        const rooms = Array.isArray(roomsRes.value.data) ? roomsRes.value.data : [];
        setRoomNameById(new Map(rooms.map((r) => [r.id, r.name])));
      }

      if (usersRes.status === 'fulfilled') {
        const users = Array.isArray(usersRes.value.data) ? usersRes.value.data : [];
        setUserNameById(new Map(users.map((u) => [u.id, u.name])));
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    const statusLabel = getStatusLabel(newStatus).toLowerCase();

    try {
      setUpdatingId(bookingId);
      // backend supports both /booking/:id and /bookings/:id aliases for PUT
      await api.put(`/booking/${bookingId}`, { status: newStatus });
      // optimistic refresh
      await fetchBookings();
      pushToast('Foglalás frissítve', `A #${bookingId} foglalás sikeresen ${statusLabel}.`, 'success');
    } catch (err) {
      console.error('Error updating booking status:', err);
      // try alternate alias if needed
      try {
        await api.put(`/bookings/${bookingId}`, { status: newStatus });
        await fetchBookings();
        pushToast('Foglalás frissítve', `A #${bookingId} foglalás sikeresen ${statusLabel}.`, 'success');
      } catch (e) {
        console.error('Alternate update failed:', e);
        pushToast('Státusz módosítás hiba', `Nem sikerült frissíteni a #${bookingId} foglalást (${getStatusLabel(newStatus)}).`, 'error');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const openConfirm = ({ title, message, confirmLabel = 'Megerősítés', variant = 'primary', onConfirm }) => {
    if (closeConfirmTimeoutRef.current) {
      clearTimeout(closeConfirmTimeoutRef.current);
      closeConfirmTimeoutRef.current = null;
    }
    if (openConfirmRafRef.current) {
      cancelAnimationFrame(openConfirmRafRef.current);
      openConfirmRafRef.current = null;
    }

    setConfirmDialog({
      open: true,
      title,
      message,
      confirmLabel,
      variant,
      onConfirm,
    });

    setConfirmMounted(true);
    setConfirmVisible(false);
    openConfirmRafRef.current = requestAnimationFrame(() => {
      setConfirmVisible(true);
      openConfirmRafRef.current = null;
    });
  };

  const closeConfirm = () => {
    if (openConfirmRafRef.current) {
      cancelAnimationFrame(openConfirmRafRef.current);
      openConfirmRafRef.current = null;
    }

    setConfirmVisible(false);
    closeConfirmTimeoutRef.current = setTimeout(() => {
      setConfirmMounted(false);
      setConfirmDialog({
        open: false,
        title: '',
        message: '',
        confirmLabel: 'Megerősítés',
        variant: 'primary',
        onConfirm: null,
      });
      closeConfirmTimeoutRef.current = null;
    }, CONFIRM_ANIMATION_MS);
  };

  const handleConfirm = () => {
    const callback = confirmDialog.onConfirm;
    closeConfirm();
    if (typeof callback === 'function') callback();
  };

  const handleApprove = (b) => {
    openConfirm({
      title: 'Foglalás jóváhagyása',
      message: `Biztosan jóváhagyod a #${b.id} foglalást?`,
      confirmLabel: 'Jóváhagyás',
      variant: 'success',
      onConfirm: () => updateBookingStatus(b.id, STATUS_APPROVED),
    });
  };

  const handleReject = (b) => {
    openConfirm({
      title: 'Foglalás elutasítása',
      message: `Biztosan elutasítod a #${b.id} foglalást?`,
      confirmLabel: 'Elutasítás',
      variant: 'danger',
      onConfirm: () => updateBookingStatus(b.id, STATUS_REJECTED),
    });
  };

  const handleChangeStatus = (b, status) => {
    openConfirm({
      title: 'Státusz módosítása',
      message: `Átállítod a #${b.id} foglalás státuszát ${getStatusLabel(status)} állapotra?`,
      confirmLabel: 'Módosítás',
      variant: status === STATUS_REJECTED ? 'danger' : 'primary',
      onConfirm: () => updateBookingStatus(b.id, status),
    });
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
            <h2 className="text-2xl font-semibold text-gray-500">Foglalások</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchBookings}
                className="px-3 py-2 bg-blue-100 text-blue-700 border border-blue-200 rounded hover:cursor-pointer hover:bg-blue-200 transition-colors"
              >
                Frissít
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="px-3 py-2 bg-gray-100 text-gray-500 hover:cursor-pointer rounded hover:bg-gray-200"
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
                <h3 className="text-lg font-semibold mb-3 text-gray-500">Jóváhagyásra váró</h3>
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
                          roomNameById={roomNameById}
                          userNameById={userNameById}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Approved (collapsible) */}
              <CollapsibleGroup title="Jóváhagyottak"  count={approved.length} openByDefault={false} titleClass='text-gray-700'>
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
                        roomNameById={roomNameById}
                        userNameById={userNameById}
                      />
                    </div>
                  ))
                )}
              </CollapsibleGroup>

              {/* Rejected (collapsible) */}
              <CollapsibleGroup title="Elutasítottak" count={rejected.length} openByDefault={false} titleClass='text-gray-700'>
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
                        roomNameById={roomNameById}
                        userNameById={userNameById}
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
                        roomNameById={roomNameById}
                        userNameById={userNameById}
                      />
                    </div>
                  ))}
                </CollapsibleGroup>
              )}
            </div>
          )}
        </main>
      </div>

      {confirmMounted && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 backdrop-blur-[1px] transition-opacity duration-200 ${confirmVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <div
            className={`w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 transition-all duration-200 ${confirmVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'}`}
          >
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900">{confirmDialog.title}</h3>
              <p className="mt-2 text-sm text-gray-700">{confirmDialog.message}</p>
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button
                onClick={closeConfirm}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Mégse
              </button>
              <button
                onClick={handleConfirm}
                className={`px-3 py-2 rounded-md border transition-colors ${confirmDialog.variant === 'danger'
                  ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                  : confirmDialog.variant === 'success'
                    ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                    : 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
                  }`}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />

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