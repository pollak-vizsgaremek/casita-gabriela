import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useLocation } from "react-router";
import api from "../services/api";

const Reviews = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data || []);
    } catch (err) {
      console.error('Error fetching rooms for review filter', err);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchReviews();
  }, []);

  useEffect(() => {
    fetchReviews(selectedRoomId);
  }, [selectedRoomId]);

  const deleteReview = async (id) => {
    if (!window.confirm("Biztosan törölni szeretnéd ezt az értékelést?")) return;
    try {
      await api.delete(`/room_reviews/${id}`);
      await fetchReviews(selectedRoomId);
      alert('Értékelés törölve.');
    } catch (err) {
      console.error('Delete review error', err);
      alert('Nem sikerült törölni az értékelést.');
    }
  };

  return (
    <div className="flex min-h-screen w-dvw bg-[#f7faf7]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 ml-0 md:ml-64 p-6">
        <h1 className="text-2xl font-semibold mb-4 text-gray-900">Értékelések kezelése</h1>

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
            {reviews.length === 0 && <div className="text-gray-600">Nincsenek értékelések.</div>}
            {reviews.map((r) => (
              <div key={r.id} className="bg-white p-4 rounded shadow flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="text-yellow-500 font-bold">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</div>
                    <div className="text-sm text-gray-600">{r.stars}/5</div>
                  </div>
                  <p className="mt-2 text-gray-800">{r.comment}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    <div>Szoba: {r.room ? r.room.name : r.room_id}</div>
                    <div>Író: {r.user ? r.user.name : r.user_id ? `id:${r.user_id}` : 'Ismeretlen'}</div>
                    <div className="text-gray-400">ID: {r.id}</div>
                  </div>
                </div>
                <div>
                  <button onClick={() => deleteReview(r.id)} className="bg-red-500 text-white px-3 py-1 rounded">Törlés</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;