// src/pages/AdminKezeles.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import api from '../services/api';

const AdminKezeles = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    capacity: '',
    price: '',
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [ratings, setRatings] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // UI state for expanding approved/rejected lists
  const [expandedApproved, setExpandedApproved] = useState(false);
  const [expandedRejected, setExpandedRejected] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRoom();
      fetchReservations();
      fetchRatings();
      const interval = setInterval(() => {
        fetchReservations();
      }, 5000);
      return () => clearInterval(interval);
    } else {
      setInitialLoad(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRoom = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/rooms/${id}`);
      const room = response.data;
      setFormData({
        title: room.name || '',
        description: room.description || '',
        type: room.category || '',
        capacity: room.space || '',
        price: room.price || '',
      });
      if (room.images) {
        setImagePreview(Array.isArray(room.images) ? room.images[0] : room.images);
      }
      setIsEditing(true);
    } catch (err) {
      console.error('Error fetching room:', err);
      setMessage('Hiba a szoba betöltése során.');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const res = await api.get(`/bookings?room_id=${id}`);
      setReservations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  };

  const fetchRatings = async () => {
    try {
      const res = await api.get(`/room_reviews?room_id=${id}`);
      setRatings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      // ha nincs külön endpoint, akkor üres marad
      console.warn('No ratings endpoint or error fetching ratings:', err);
      setRatings([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImage = () => {
    document.getElementById('imageInput')?.click();
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.type || !formData.capacity || !formData.price) {
      setMessage('Kérjük töltse ki az összes mezőt!');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      let imageBase64 = null;
      if (image) {
        if (imagePreview.includes(',')) {
          imageBase64 = imagePreview.split(',')[1];
        } else {
          imageBase64 = imagePreview;
        }
      } else if (imagePreview && imagePreview.includes(',')) {
        imageBase64 = imagePreview.split(',')[1];
      }

      const roomData = {
        name: formData.title,
        description: formData.description,
        price: parseInt(formData.price),
        category: formData.type,
        space: parseInt(formData.capacity),
      };

      if (imageBase64) {
        roomData.images = imageBase64;
      }

      if (isEditing) {
        await api.put(`/rooms/${id}`, roomData);
        setMessage('Szoba sikeresen frissítve!');
      } else {
        await api.post('/rooms', roomData);
        setMessage('Szoba sikeresen létrehozva!');
        setFormData({ title: '', description: '', type: '', capacity: '', price: '' });
        setImage(null);
        setImagePreview(null);
      }
      fetchRoom();
    } catch (err) {
      console.error('Full error object:', err);
      let errorMsg = 'Hiba a szoba mentése során. Próbálja újra!';
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    if (!window.confirm('Biztosan törölni szeretné ezt a szobát?')) return;
    setLoading(true);
    setMessage('');
    try {
      await api.delete(`/rooms/${id}`);
      setMessage('Szoba sikeresen törölve!');
      setTimeout(() => {
        navigate('/Admin');
      }, 1500);
    } catch (err) {
      console.error('Error deleting room:', err);
      let errorMsg = 'Hiba a szoba törlése során. Próbálja újra!';
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Foglalás státusz frissítése (approve/reject vagy manuális select)
  const updateReservationStatus = async (bookingId, newStatus) => {
    try {
      await api.put(`/bookings/${bookingId}`, { status: newStatus });
      setReservations((prev) => prev.map((r) => (r.id === bookingId ? { ...r, status: newStatus } : r)));
      fetchReservations();
    } catch (err) {
      console.error('Error updating booking status:', err);
      alert('Hiba a státusz frissítésekor.');
    }
  };

  const handleApprove = async (bookingId) => {
    if (!window.confirm('Biztosan jóváhagyod a foglalást?')) return;
    await updateReservationStatus(bookingId, 'approved');
  };

  const handleReject = async (bookingId) => {
    if (!window.confirm('Biztosan elutasítod a foglalást?')) return;
    await updateReservationStatus(bookingId, 'rejected');
  };

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-screen w-dvw bg-[#0b1f13]">
        <p className="text-gray-500">Betöltés...</p>
      </div>
    );
  }

  // csoportosítás státusz szerint
  const pending = reservations.filter((r) => {
    const s = (r.status || '').toString().toLowerCase();
    return s === 'pending' || s === 'jóváhagyásra vár' || !s;
  });
  const approved = reservations.filter((r) => {
    const s = (r.status || '').toString().toLowerCase();
    return s === 'approved' || s === 'jóváhagyott';
  });
  const rejected = reservations.filter((r) => {
    const s = (r.status || '').toString().toLowerCase();
    return s === 'rejected' || s === 'elutasított';
  });

  return (
    <div className=" w-full spacer layerAdmin p-8 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-8 fade-in">
        {/* Szoba szerkesztő + képcsere (megtartva) */}
        <div className="bg-[#FFFECE] p-8 rounded-lg shadow-md/40 fade-in">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Szoba Cím</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="Pl. Szép Megtekintésű Szoba"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Szoba Leírása</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none text-gray-900 bg-white"
                placeholder="Írja le a szoba jellemzőit..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Szoba Típusa</label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="Pl. Dupla"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Férőhely</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="Pl. 2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Ár (Ft/fő/éj)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="Pl. 100"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-6 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Mentés...' : (isEditing ? 'Szoba Frissítése' : 'Szoba Hozzáadása')}
            </button>

            {isEditing && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="w-full mt-3 px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Törlés...' : 'Szoba Törlése'}
              </button>
            )}

            {message && (
              <div className={`mt-4 p-3 rounded-lg text-center font-medium ${message.includes('sikeresen') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message}
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#FFFECE] p-8 rounded-lg shadow-md/40 flex flex-col items-center justify-center fade-in">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Szoba Képe</h2>

          {imagePreview ? (
            <div className="w-full space-y-4">
              <img src={imagePreview} alt="Szoba előnézete" className="w-full h-80 object-cover rounded-lg" />
              <div className="flex gap-3 justify-center">
                <button onClick={handleAddImage} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">Kép Cseréje</button>
                <button onClick={handleRemoveImage} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">Kép Eltávolítása</button>
              </div>
            </div>
          ) : (
            <div onClick={handleAddImage} className="w-full h-80 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition bg-white">
              <div className="text-center">
                <p className="text-gray-500 font-medium mb-2">Kattintson a kép hozzáadásához</p>
                <p className="text-gray-400 text-sm">vagy húzza ide</p>
              </div>
            </div>
          )}

          <input id="imageInput" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </div>
      </div>

      {/* Értékelések (megtartva) */}
      <div className="max-w-6xl mx-auto space-y-8 fade-in">
        <div className="bg-[#FFFECE] p-8 rounded-lg shadow-md/40 fade-in">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Értékelések</h2>
          {ratings.length === 0 ? (
            <p className="text-gray-500 text-sm">Nincs értékelés</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ratings.map((rating, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">{rating.name}</p>
                  <p className="text-sm text-gray-600">{rating.comment}</p>
                  <p className="text-xs text-yellow-500 mt-1">★ {rating.score}/5</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Foglalások rész (megtartva és kibővítve) */}
        <div className="bg-[#FFFECE] p-8 rounded-lg shadow-md/40 fade-in">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Foglalások</h2>
          {reservations.length === 0 ? (
            <p className="text-gray-500 text-sm">Nincsenek foglalások</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {reservations.map((res, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">{res.guest_name || res.user_name || 'Ismeretlen'}</p>
                  <p className="text-xs text-gray-600">{res.arrival_date} → {res.departure_date} • {res.people || res.guests} fő</p>
                  <p className="text-xs text-gray-500 mt-2">Státusz: <span className="font-semibold">{res.status || 'pending'}</span></p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminKezeles;
