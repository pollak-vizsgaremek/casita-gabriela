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

  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);

  // extraImages: { id: string, file: File|null, preview: dataUrl|string }
  const [extraImages, setExtraImages] = useState([]);

  const [ratings, setRatings] = useState([]);
  const [reservations, setReservations] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const [expandedApproved, setExpandedApproved] = useState(false);
  const [expandedRejected, setExpandedRejected] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRoom();
      fetchReservations();
      fetchRatings();
      const interval = setInterval(() => fetchReservations(), 5000);
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
        if (Array.isArray(room.images)) {
          setMainImagePreview(room.images[0] || null);
          const extras = room.images.slice(1).map((img, idx) => ({
            id: `db-${idx}`,
            file: null,
            preview: img,
          }));
          setExtraImages(extras);
        } else {
          setMainImagePreview(room.images);
          setExtraImages([]);
        }
      } else {
        setMainImagePreview(null);
        setExtraImages([]);
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
      console.warn('No ratings endpoint or error fetching ratings:', err);
      setRatings([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // MAIN IMAGE handlers
  const handleMainImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setMainImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveMainImage = () => {
    setMainImageFile(null);
    setMainImagePreview(null);
  };

  // EXTRA IMAGES handlers (moved to right panel)
  const handleAddExtraImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newExtras = files.map((file, idx) => {
      const tempId = `new-${Date.now()}-${idx}`;
      const reader = new FileReader();
      const obj = { id: tempId, file, preview: null };
      reader.onloadend = () => {
        setExtraImages((prev) =>
          prev.map((p) => (p.id === tempId ? { ...p, preview: reader.result } : p))
        );
      };
      reader.readAsDataURL(file);
      return obj;
    });
    setExtraImages((prev) => [...prev, ...newExtras]);
    e.target.value = '';
  };

  const handleRemoveExtraImage = (idToRemove) => {
    setExtraImages((prev) => prev.filter((img) => img.id !== idToRemove));
  };

  const moveExtraImage = (id, direction) => {
    setExtraImages((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const newArr = [...prev];
      const swapIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= newArr.length) return prev;
      const tmp = newArr[swapIdx];
      newArr[swapIdx] = newArr[idx];
      newArr[idx] = tmp;
      return newArr;
    });
  };

  // Compose images array to send to backend: main first, then extras
  const collectImagesBase64 = () => {
    const imagesBase64 = [];
    const extractBase64 = (data) => {
      if (!data) return null;
      if (typeof data !== 'string') return null;
      if (data.includes(',')) return data.split(',')[1];
      return data;
    };

    if (mainImagePreview) {
      const mainBase = extractBase64(mainImagePreview);
      if (mainBase) imagesBase64.push(mainBase);
    }

    extraImages.forEach((img) => {
      if (img.preview) {
        const b = extractBase64(img.preview);
        if (b) imagesBase64.push(b);
      }
    });

    return imagesBase64;
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
      const imagesBase64 = collectImagesBase64();
      const roomData = {
        name: formData.title,
        description: formData.description,
        price: parseInt(formData.price, 10),
        category: formData.type,
        space: parseInt(formData.capacity, 10),
      };
      if (imagesBase64.length > 0) {
        roomData.images = imagesBase64;
      }

      if (isEditing) {
        await api.put(`/rooms/${id}`, roomData);
        setMessage('Szoba sikeresen frissítve!');
      } else {
        await api.post('/rooms', roomData);
        setMessage('Szoba sikeresen létrehozva!');
        setFormData({ title: '', description: '', type: '', capacity: '', price: '' });
        setMainImageFile(null);
        setMainImagePreview(null);
        setExtraImages([]);
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
      setTimeout(() => navigate('/Admin'), 1500);
    } catch (err) {
      console.error('Error deleting room:', err);
      let errorMsg = 'Hiba a szoba törlése során. Próbálja újra!';
      if (err.response?.data?.error) errorMsg = err.response.data.error;
      else if (err.response?.data?.message) errorMsg = err.response.data.message;
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Reservations: update status
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

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-screen w-dvw bg-[#0b1f13]">
        <p className="text-gray-500">Betöltés...</p>
      </div>
    );
  }

  return (
    <div className="w-full spacer layerAdmin p-8 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-8 fade-in">
        {/* Left: Room editor (without extra images controls) */}
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

            <div className="flex flex-col gap-2">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Mentés...' : (isEditing ? 'Szoba Frissítése' : 'Szoba Hozzáadása')}
              </button>

              {isEditing && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-full mt-2 px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Törlés...' : 'Szoba Törlése'}
                </button>
              )}
            </div>

            {message && (
              <div className={`mt-4 p-3 rounded-lg text-center font-medium ${message.includes('sikeresen') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Right: main image preview + extra images controls (moved here) */}
        <div className="bg-[#FFFECE] p-8 rounded-lg shadow-md/40 flex flex-col items-center justify-start gap-6 fade-in">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Szoba Képe</h2>

          <div className="w-full">
            {mainImagePreview ? (
              <img src={mainImagePreview} alt="Szoba előnézete" className="w-full h-80 object-cover rounded-lg" />
            ) : (
              <div className="w-full h-80 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
                <p className="text-gray-500">Nincs kép</p>
              </div>
            )}
          </div>

          <div className="w-full flex gap-3 justify-center">
            <button onClick={() => document.getElementById('mainImageInput')?.click()} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Kép Cseréje</button>
            <button onClick={handleRemoveMainImage} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Kép Eltávolítása</button>
          </div>

          <input id="mainImageInput" type="file" accept="image/*" onChange={handleMainImageChange} className="hidden" />

          {/* Extra images controls moved here, under main image */}
          <div className="w-full mt-4 bg-white p-4 rounded-md border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600">További képek (nem indexképek)</p>
              <div className="flex gap-2">
                <button
                  onClick={() => document.getElementById('extraImagesInput')?.click()}
                  className="px-3 py-1 bg-green-500 text-white rounded-md text-sm"
                >
                  Képek hozzáadása
                </button>
                <button
                  onClick={() => setExtraImages([])}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm"
                >
                  Összes törlése
                </button>
              </div>
            </div>

            <input id="extraImagesInput" type="file" accept="image/*" multiple onChange={handleAddExtraImages} className="hidden" />

            {extraImages.length === 0 ? (
              <p className="text-gray-500 text-sm">Nincsenek további képek</p>
            ) : (
              <div className="space-y-3">
                {extraImages.map((img, idx) => (
                  <div key={img.id} className="flex items-center gap-3 bg-gray-50 p-2 rounded-md">
                    <div className="w-20 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {img.preview ? (
                        <img src={img.preview} alt={`extra-${idx}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Feltöltés...</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{img.file?.name || `Kép ${idx + 1}`}</p>
                      <div className="text-xs text-gray-500">Előnézet</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveExtraImage(img.id, 'left')}
                        disabled={idx === 0}
                        className="px-2 py-1 bg-white border rounded disabled:opacity-50"
                        title="Balra"
                      >
                        ◀
                      </button>
                      <button
                        onClick={() => moveExtraImage(img.id, 'right')}
                        disabled={idx === extraImages.length - 1}
                        className="px-2 py-1 bg-white border rounded disabled:opacity-50"
                        title="Jobbra"
                      >
                        ▶
                      </button>
                      <button
                        onClick={() => handleRemoveExtraImage(img.id)}
                        className="px-2 py-1 bg-red-500 text-white rounded"
                        title="Eltávolít"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* quick gallery preview */}
          <div className="w-full mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Elrendezett további képek</h3>
            <div className="grid grid-cols-3 gap-2">
              {extraImages.length === 0 ? (
                <div className="col-span-3 text-gray-500 text-sm">Nincsenek további képek</div>
              ) : (
                extraImages.map((img) => (
                  <div key={img.id} className="w-full h-24 overflow-hidden rounded-md border">
                    {img.preview ? <img src={img.preview} alt="extra" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100" />}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ratings */}
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

        {/* Reservations */}
        <div className="bg-[#FFFECE] p-8 rounded-lg shadow-md/40 fade-in">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Foglalások</h2>

          {/* Pending (special color, not collapsible) */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Jóváhagyásra vár</h3>
            {pending.length === 0 ? (
              <p className="text-gray-500 text-sm">Nincsenek függő foglalások</p>
            ) : (
              <div className="space-y-3">
                {pending.map((r) => (
                  <div key={r.id} className="bg-white border-l-4 border-yellow-400 p-3 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{r.guest_name || r.user_name || 'Ismeretlen'}</p>
                        <p className="text-xs text-gray-600">{r.email || r.user_email || ''}</p>
                        <p className="text-xs text-gray-600">{r.phone_number || r.phone || ''}</p>
                        <p className="text-xs text-gray-600 mt-1">{r.arrival_date} → {r.departure_date} • {r.people || r.guests} fő</p>
                        <p className="text-xs text-gray-500 mt-2">Foglalás dátum: {r.booking_date || r.created_at || '-'}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => handleApprove(r.id)} className="px-3 py-1 bg-green-500 text-white rounded-md">Jóváhagy</button>
                        <button onClick={() => handleReject(r.id)} className="px-3 py-1 bg-red-500 text-white rounded-md">Elutasít</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved (collapsible) */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Jóváhagyott</h3>
              <button onClick={() => setExpandedApproved((s) => !s)} className="text-sm text-blue-600 underline">
                {expandedApproved ? 'Elrejt' : `Megnyit (${approved.length})`}
              </button>
            </div>
            {expandedApproved && (
              <div className="mt-3 space-y-3">
                {approved.length === 0 ? <p className="text-gray-500 text-sm">Nincs jóváhagyott foglalás</p> : approved.map((r) => (
                  <div key={r.id} className="bg-white p-3 rounded-md border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{r.guest_name || r.user_name || 'Ismeretlen'}</p>
                        <p className="text-xs text-gray-600">{r.arrival_date} → {r.departure_date} • {r.people || r.guests} fő</p>
                        <p className="text-xs text-gray-500 mt-2">Foglalás dátum: {r.booking_date || r.created_at || '-'}</p>
                      </div>
                      <div>
                        <select
                          value={r.status || 'approved'}
                          onChange={(e) => updateReservationStatus(r.id, e.target.value)}
                          className="border px-2 py-1 rounded"
                        >
                          <option value="pending">Jóváhagyásra vár</option>
                          <option value="approved">Jóváhagyott</option>
                          <option value="rejected">Elutasított</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rejected (collapsible) */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Elutasított</h3>
              <button onClick={() => setExpandedRejected((s) => !s)} className="text-sm text-blue-600 underline">
                {expandedRejected ? 'Elrejt' : `Megnyit (${rejected.length})`}
              </button>
            </div>
            {expandedRejected && (
              <div className="mt-3 space-y-3">
                {rejected.length === 0 ? <p className="text-gray-500 text-sm">Nincs elutasított foglalás</p> : rejected.map((r) => (
                  <div key={r.id} className="bg-white p-3 rounded-md border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{r.guest_name || r.user_name || 'Ismeretlen'}</p>
                        <p className="text-xs text-gray-600">{r.arrival_date} → {r.departure_date} • {r.people || r.guests} fő</p>
                        <p className="text-xs text-gray-500 mt-2">Foglalás dátum: {r.booking_date || r.created_at || '-'}</p>
                      </div>
                      <div>
                        <select
                          value={r.status || 'rejected'}
                          onChange={(e) => updateReservationStatus(r.id, e.target.value)}
                          className="border px-2 py-1 rounded"
                        >
                          <option value="pending">Jóváhagyásra vár</option>
                          <option value="approved">Jóváhagyott</option>
                          <option value="rejected">Elutasított</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminKezeles;
