import React, { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useLocation } from "react-router";
import api from "../services/api";
import Toast, { useToast } from "../components/Toast";

// Értékelések kezelő admin oldal: lista, szűrés és törlés

const Reviews = () => {
  const CONFIRM_ANIMATION_MS = 220;
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmMounted, setConfirmMounted] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const closeConfirmTimeoutRef = useRef(null);
  const openConfirmRafRef = useRef(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Megerősítés',
    variant: 'danger',
    onConfirm: null,
  });
  const { toasts, pushToast, removeToast } = useToast();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const fetchReviews = async (roomId = '') => {
    setLoading(true);
    try {
      const params = roomId ? { room_id: roomId } : undefined;
      const res = await api.get(`/room_reviews`, { params });
      setReviews(res.data || []);
    } catch (err) {
      console.error("Error fetching reviews", err);
      alert("Nem sikerült lekérni az értékeléseket.");
    } finally {
      setLoading(false);
    }
  };

  // Lekéri az értékeléseket; opcionálisan szoba szerint szűrve

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data || []);
    } catch (err) {
      console.error('Error fetching rooms for review filter', err);
    }
  };

  // Lekéri a szobákat a szűrő feltöltéséhez

  useEffect(() => {
    fetchRooms();
    fetchReviews();
  }, []);

  useEffect(() => {
    return () => {
      if (closeConfirmTimeoutRef.current) clearTimeout(closeConfirmTimeoutRef.current);
      if (openConfirmRafRef.current) cancelAnimationFrame(openConfirmRafRef.current);
    };
  }, []);

  useEffect(() => {
    fetchReviews(selectedRoomId);
  }, [selectedRoomId]);

  const openConfirm = ({ title, message, confirmLabel = 'Megerősítés', variant = 'danger', onConfirm }) => {
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

  // Megerősítő modal megnyitása és animált megjelenítés beállítása

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
        variant: 'danger',
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

  const deleteReview = async (id) => {
    try {
      await api.delete(`/room_reviews/${id}`);
      await fetchReviews(selectedRoomId);
      pushToast('Sikeres törlés', 'Az értékelés sikeresen törölve.', 'success');
    } catch (err) {
      console.error('Delete review error', err);
      alert('Nem sikerült törölni az értékelést.');
    }
  };

  // Törli az értékelést a szerverről, majd frissíti a listát

  const requestDeleteReview = (id) => {
    openConfirm({
      title: 'Értékelés törlése',
      message: 'Biztosan törölni szeretnéd ezt az értékelést?',
      confirmLabel: 'Törlés',
      variant: 'danger',
      onConfirm: () => deleteReview(id),
    });
  };

  // Megnyit egy törlés megerősítő dialógust

  return (
    <div className="flex min-h-screen w-dvw bg-[#f7faf7]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 ml-0 md:ml-64">

        {/* Mobil fejléc: menü gomb és oldal cím */}
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
          <div className="text-lg font-semibold">Értékelések kezelése</div>
          <div style={{ width: 36 }} />
        </header>

        {/* Fő tartalom: szűrő és értékelések lista */}
        <main className="px-5 pt-5">
          <h1 className="text-2xl font-semibold mb-4 text-gray-900">Értékelések kezelése</h1>

          {/* Szűrő: választható szoba szerinti megjelenítés */}
          <div className="mb-4 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">Szűrés szoba szerint</label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Összes szoba</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div>Betöltés...</div>
          ) : (
            <div className="space-y-4">
              {/* Lista: minden értékelés kártyaként jelenik meg */}
              {reviews.length === 0 && <div className="text-gray-600">Nincsenek értékelések.</div>}
              {reviews.map((r) => (
                <div key={r.id} className="bg-white p-4 rounded shadow flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                  {/* Felhasználó és pontszám */}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900 wrap-anywhere">
                      {r.user ? r.user.name : r.user_id ? `id:${r.user_id}` : 'Ismeretlen'}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-yellow-500 font-bold">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</div>
                      <div className="text-sm text-gray-600">{r.stars}/5</div>
                    </div>
                    {/* Vélemény szövege */}
                    <p className="mt-2 text-gray-800 wrap-anywhere whitespace-pre-wrap">{r.comment}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      <div> {r.room ? r.room.name : r.room_id}</div>
                      <div className="text-gray-400">ID: {r.id}</div>
                    </div>
                  </div>
                  <div className="sm:ml-4 shrink-0 self-start">
                    {/* Törlés gomb, megerősítés megnyitásával */}
                    <button onClick={() => requestDeleteReview(r.id)} className="bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded hover:bg-red-200 transition-colors">Törlés</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {confirmMounted && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 backdrop-blur-[1px] transition-opacity duration-200 ${confirmVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className={`w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 transition-all duration-200 ${confirmVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'}`}>
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
                className={`px-3 py-2 rounded-md border transition-colors ${confirmDialog.variant === 'danger' ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' : 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'}`}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Reviews;
