// src/pages/AdminKezeles.jsx

import React, { useState, useEffect, useRef } from 'react';
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

  const [categories, setCategories] = useState([]);

  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);

  const [extraImages, setExtraImages] = useState([]); // {id, file|null, preview}
  const [ratings, setRatings] = useState([]);
  const [reservations, setReservations] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const mainInputRef = useRef(null);
  const extraInputRef = useRef(null);

  const [collapsedSections, setCollapsedSections] = useState({
    pending: false,
    approved: true,
    rejected: true,
  });

  // Drag overlay state (global for the page)
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounter = useRef(0);

  useEffect(() => {
    loadCategories();

    if (id) {
      fetchRoom();
      fetchReservations();
      fetchRatings();

      const interval = setInterval(() => fetchReservations(), 5000);
      return () => clearInterval(interval);
    } else {
      setInitialLoad(false);
    }

    // global drag listeners to show overlay when dragging files over the window
    const onDragEnter = (e) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes('Files')) {
        setIsDraggingFile(true);
      }
    };
    const onDragLeave = (e) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDraggingFile(false);
      }
    };
    const onDragOver = (e) => {
      e.preventDefault();
    };
    const onDrop = (e) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDraggingFile(false);
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load distinct categories from existing rooms
  const loadCategories = async () => {
    try {
      const res = await api.get('/rooms');
      const rooms = Array.isArray(res.data) ? res.data : [];
      const cats = Array.from(new Set(rooms.map((r) => r.category).filter(Boolean)));
      setCategories(cats);
    } catch (err) {
      console.warn('Nem sikerült betölteni a kategóriákat:', err);
      setCategories([]);
    }
  };

  const fetchRoom = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setMessage('');
      const response = await api.get(`/rooms/${id}`);
      const room = response.data;
      const parsedImages = parseImagesFromServer(room.images);

      setFormData({
        title: room.name || '',
        description: room.description || '',
        type: room.category || '',
        capacity: room.space || '',
        price: room.price || '',
      });

      if (parsedImages.length > 0) {
        setMainImagePreview(parsedImages[0]);
        setMainImageFile(null);
        const extras = parsedImages.slice(1).map((p, idx) => ({ id: `db-${idx}`, file: null, preview: p }));
        setExtraImages(extras);
      } else {
        setMainImagePreview(null);
        setMainImageFile(null);
        setExtraImages([]);
      }

      setIsEditing(true);
    } catch (err) {
      console.error('Error fetching room:', err);
      setMessage('Nem sikerült betölteni a szobát.');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchReservations = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/bookings?room_id=${id}`);
      setReservations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  };

  const fetchRatings = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/room_reviews?room_id=${id}`);
      setRatings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('No ratings endpoint or error fetching ratings:', err);
      setRatings([]);
    }
  };

  // Helpers
  const normalizePreview = (s) => {
    if (!s) return null;
    if (s.startsWith('data:')) return s;
    if (s.startsWith('http')) return s;
    if (s.startsWith('/')) return `${window.location.origin}${s}`;
    return s;
  };

  const parseImagesFromServer = (imagesField) => {
    if (!imagesField) return [];
    try {
      if (Array.isArray(imagesField)) {
        return imagesField.map(normalizePreview).filter(Boolean);
      }
      if (typeof imagesField === 'string') {
        try {
          const parsed = JSON.parse(imagesField);
          if (Array.isArray(parsed)) return parsed.map(normalizePreview).filter(Boolean);
          return [normalizePreview(parsed)];
        } catch (e) {
          return [normalizePreview(imagesField)];
        }
      }
      return [];
    } catch (err) {
      console.error('parseImagesFromServer error:', err);
      return [];
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Main image drag & drop
  const handleMainDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleMainFile(file);
    dragCounter.current = 0;
    setIsDraggingFile(false);
  };

  const handleMainFile = (file) => {
    setMainImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setMainImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleMainFile(file);
  };

  const handleRemoveMainImage = () => {
    setMainImageFile(null);
    setMainImagePreview(null);
  };

  // Extra images drag & drop
  const handleExtraDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) handleAddExtraFiles(files);
    dragCounter.current = 0;
    setIsDraggingFile(false);
  };

  const handleAddExtraFiles = (files) => {
    const newExtras = files.map((file, idx) => {
      const tempId = `new-${Date.now()}-${idx}`;
      const obj = { id: tempId, file, preview: null };
      const reader = new FileReader();
      reader.onloadend = () => {
        setExtraImages((prev) => prev.map((p) => (p.id === tempId ? { ...p, preview: reader.result } : p)));
      };
      reader.readAsDataURL(file);
      return obj;
    });
    setExtraImages((prev) => [...prev, ...newExtras]);
  };

  const handleExtraInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) handleAddExtraFiles(files);
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

  // Upload files to backend /upload-images endpoint; returns array of paths
  const uploadFilesToServer = async (files) => {
    if (!files || files.length === 0) return [];
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    try {
      const res = await api.post('/upload-images', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res?.data?.paths && Array.isArray(res.data.paths)) return res.data.paths;
      return [];
    } catch (err) {
      console.warn('Upload failed:', err);
      return [];
    }
  };

  // Collect images to send: upload new files first and combine with existing route previews
  const collectImagesForSave = async () => {
    const imagesToSave = [];

    // main image
    if (mainImageFile) {
      const paths = await uploadFilesToServer([mainImageFile]);
      if (paths.length) imagesToSave.push(paths[0]);
    } else if (mainImagePreview) {
      imagesToSave.push(mainImagePreview.startsWith(window.location.origin) ? mainImagePreview.replace(window.location.origin, '') : mainImagePreview);
    }

    // extras
    for (const ex of extraImages) {
      if (ex.file) {
        const paths = await uploadFilesToServer([ex.file]);
        if (paths.length) imagesToSave.push(paths[0]);
      } else if (ex.preview) {
        imagesToSave.push(ex.preview.startsWith(window.location.origin) ? ex.preview.replace(window.location.origin, '') : ex.preview);
      }
    }

    return imagesToSave;
  };

  // --- handleSubmit: mentés után mindig lekérdezzük a friss szobaobjektumot ---
  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!formData.title || !formData.description || !formData.type || !formData.capacity || !formData.price) {
      setMessage('Kérlek töltsd ki az összes mezőt!');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const imagesPaths = await collectImagesForSave();

      const roomData = {
        name: formData.title,
        description: formData.description,
        price: parseInt(formData.price, 10),
        category: formData.type,
        space: parseInt(formData.capacity, 10),
        images: imagesPaths.length ? imagesPaths : null,
      };

      if (isEditing && id) {
        // PUT update existing
        await api.put(`/rooms/${id}`, roomData);

        // mindig frissítsük a szerverről a szoba adatait
        const fresh = await api.get(`/rooms/${id}`);
        const parsed = parseImagesFromServer(fresh.data.images);
        setFormData({
          title: fresh.data.name || '',
          description: fresh.data.description || '',
          type: fresh.data.category || '',
          capacity: fresh.data.space || '',
          price: fresh.data.price || '',
        });
        setMainImagePreview(parsed[0] || null);
        setExtraImages(parsed.slice(1).map((p, idx) => ({ id: `db-${idx}`, file: null, preview: p })));
        setMessage('Sikeresen frissítetted a szobát!');
      } else {
        // POST create new
        const res = await api.post('/rooms', roomData);
        const createdRoom = res?.data?.room || res?.data;

        if (createdRoom?.id) {
          // ne navigáljunk el: beállítjuk editing és lekérjük az új adatot
          setIsEditing(true);

          // rövid késleltetés, majd lekérés, hogy a backend commitolása után kapjuk az adatot
          setTimeout(async () => {
            try {
              const fresh = await api.get(`/rooms/${createdRoom.id}`);
              const parsed = parseImagesFromServer(fresh.data.images);
              setFormData({
                title: fresh.data.name || '',
                description: fresh.data.description || '',
                type: fresh.data.category || '',
                capacity: fresh.data.space || '',
                price: fresh.data.price || '',
              });
              setMainImagePreview(parsed[0] || null);
              setExtraImages(parsed.slice(1).map((p, idx) => ({ id: `db-${idx}`, file: null, preview: p })));
              setMessage('Sikeresen létrehoztad a szobát!');
            } catch (err) {
              setIsEditing(true);
              setMessage('Sikeresen létrehoztad a szobát! (nem sikerült azonnal lekérni a részleteket)');
            }
          }, 300);
        } else {
          // fallback
          setFormData({ title: '', description: '', type: '', capacity: '', price: '' });
          setMainImageFile(null);
          setMainImagePreview(null);
          setExtraImages([]);
          setIsEditing(false);
          setMessage('Sikeresen létrehoztad a szobát!');
        }
      }

      await loadCategories();
    } catch (err) {
      console.error('Full error object:', err);
      let errorMsg = 'Hiba a szoba mentése során. Próbáld újra!';
      if (err.response?.data?.error) errorMsg = err.response.data.error;
      else if (err.response?.data?.message) errorMsg = err.response.data.message;
      else if (err.message) errorMsg = err.message;
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  // --- vége handleSubmit ---

  const handleDelete = async () => {
    if (!isEditing || !id) return;
    if (!window.confirm('Biztosan törölni akarod ezt a szobát?')) return;
    setLoading(true);
    setMessage('');
    try {
      await api.delete(`/rooms/${id}`);
      setMessage('Sikeresen törölted a szobát!');
      // törlés után ürítsd a formot
      setFormData({ title: '', description: '', type: '', capacity: '', price: '' });
      setMainImageFile(null);
      setMainImagePreview(null);
      setExtraImages([]);
      setIsEditing(false);
    } catch (err) {
      console.error('Error deleting room:', err);
      let errorMsg = 'Hiba a szoba törlése során. Próbáld újra!';
      if (err.response?.data?.error) errorMsg = err.response.data.error;
      else if (err.response?.data?.message) errorMsg = err.response.data.message;
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Reservations helpers (unchanged)
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

  const toggleSection = (key) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-screen w-dvw bg-[#0b1f13]">
        <p className="text-gray-500">Betöltés...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Drag overlay: pointerEvents none so it never blocks clicks */}
      <div
        aria-hidden
        style={{
          transition: 'opacity 180ms ease',
          opacity: isDraggingFile ? 0.18 : 0,
          pointerEvents: 'none',
        }}
        className="fixed inset-0 bg-blue-500 z-40"
      />

      <div
        className="w-full spacer layerAdmin p-8 bg-gray-50 min-h-screen"
        style={{ backgroundAttachment: 'scroll', backgroundSize: 'cover', backgroundPosition: 'center', pointerEvents: 'auto' }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-8 fade-in">
          {/* Left: Room editor */}
          <div className="bg-[#FFFECE] p-8 rounded-lg shadow-md/40 fade-in">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Szoba címe</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  readOnly={false}
                  tabIndex={0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                  placeholder="Pl. Szép Megtekintésű Szoba"
                  style={{ color: '#111827' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Szoba leírása</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  readOnly={false}
                  tabIndex={0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none text-gray-900 placeholder-gray-400 bg-white"
                  placeholder="Írd le a szoba jellemzőit..."
                  style={{ color: '#111827' }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Szoba típusa</label>

                  {/* Writable input + datalist (original behavior) */}
                  <input
                    name="type"
                    list="categories-list"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Írj be vagy válassz..."
                    style={{ color: '#111827' }}
                  />
                  <datalist id="categories-list">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Férőhely</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    readOnly={false}
                    tabIndex={0}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
                    placeholder="Pl. 2"
                    style={{ color: '#111827' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Ár (Ft/fő/éj)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    readOnly={false}
                    tabIndex={0}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
                    placeholder="Pl. 100"
                    style={{ color: '#111827' }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full mt-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Mentés...' : (isEditing ? 'Szoba frissítése' : 'Szoba hozzáadása')}
                </button>

                {isEditing && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="w-full mt-2 px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Törlés...' : 'Szoba törlése'}
                  </button>
                )}
              </div>

              {message && (
                <div className={`mt-4 p-3 rounded-lg text-center font-medium ${message.toLowerCase().includes('sikeresen') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>

          {/* Right: main image preview + extra images controls */}
          <div
            className="bg-[#FFFECE] p-8 rounded-lg shadow-md/40 flex flex-col items-center justify-start gap-6 fade-in"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Szoba képe</h2>

            <div
              className={`w-full transition-shadow duration-150 ${isDraggingFile ? 'ring-4 ring-blue-300' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleMainDrop}
              onDragEnter={(e) => {
                e.preventDefault();
                dragCounter.current += 1;
                if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes('Files')) {
                  setIsDraggingFile(true);
                }
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                dragCounter.current -= 1;
                if (dragCounter.current <= 0) {
                  dragCounter.current = 0;
                  setIsDraggingFile(false);
                }
              }}
            >
              {mainImagePreview ? (
                <img src={mainImagePreview} alt="Szoba előnézete" className="w-full h-80 object-cover rounded-lg" />
              ) : (
                <div className="w-full h-80 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
                  <p className="text-gray-500">Nincs kép — húzd ide vagy használd a gombot</p>
                </div>
              )}
            </div>

            <div className="w-full flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => mainInputRef.current?.click()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {mainImagePreview ? 'Kép cseréje' : 'Kép feltöltése'}
              </button>

              {mainImagePreview && (
                <button type="button" onClick={handleRemoveMainImage} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Kép eltávolítása</button>
              )}
            </div>

            <input ref={mainInputRef} id="mainImageInput" type="file" accept="image/*" onChange={handleMainImageChange} className="hidden" />

            <div
              className={`w-full mt-4 bg-white p-4 rounded-md border border-gray-200 transition-shadow duration-150 ${isDraggingFile ? 'ring-4 ring-blue-300' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleExtraDrop}
              onDragEnter={(e) => {
                e.preventDefault();
                dragCounter.current += 1;
                if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes('Files')) {
                  setIsDraggingFile(true);
                }
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                dragCounter.current -= 1;
                if (dragCounter.current <= 0) {
                  dragCounter.current = 0;
                  setIsDraggingFile(false);
                }
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">További képek (nem indexképek)</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => extraInputRef.current?.click()}
                    className="px-3 py-1 bg-green-500 text-white rounded-md text-sm"
                  >
                    Képek hozzáadása
                  </button>

                  <button
                    type="button"
                    onClick={() => setExtraImages([])}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm"
                  >
                    Összes törlése
                  </button>
                </div>
              </div>

              <input ref={extraInputRef} id="extraImagesInput" type="file" accept="image/*" multiple onChange={handleExtraInputChange} className="hidden" />

              {extraImages.length === 0 ? (
                <p className="text-gray-500 text-sm">Nincsenek további képek — húzd ide vagy használd a gombot</p>
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
                          type="button"
                          onClick={() => moveExtraImage(img.id, 'left')}
                          disabled={idx === 0}
                          className="px-2 py-1 bg-white border rounded disabled:opacity-50"
                          title="Balra"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          onClick={() => moveExtraImage(img.id, 'right')}
                          disabled={idx === extraImages.length - 1}
                          className="px-2 py-1 bg-white border rounded disabled:opacity-50"
                          title="Jobbra"
                        >
                          ▶
                        </button>
                        <button
                          type="button"
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

        {/* Ratings and Reservations (unchanged layout but collapsible sections) */}
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

          <div className="bg-[#FFFECE] p-8 rounded-lg shadow-md/40 fade-in">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Foglalások</h2>

            {/* Pending */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Jóváhagyásra vár</h3>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => toggleSection('pending')} className="text-sm text-blue-600 underline">
                    {collapsedSections.pending ? 'Megnyit' : 'Bezár'}
                  </button>
                </div>
              </div>

              {!collapsedSections.pending && (
                <>
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
                              <p className="text-xs text-gray-500 mt-2">Foglalás dátuma: {r.booking_date || r.created_at || '-'}</p>
                            </div>

                            <div className="flex flex-col gap-2">
                              <button type="button" onClick={() => handleApprove(r.id)} className="px-3 py-1 bg-green-500 text-white rounded-md">Jóváhagy</button>
                              <button type="button" onClick={() => handleReject(r.id)} className="px-3 py-1 bg-red-500 text-white rounded-md">Elutasít</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Approved */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Jóváhagyott</h3>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => toggleSection('approved')} className="text-sm text-blue-600 underline">
                    {collapsedSections.approved ? 'Megnyit' : 'Bezár'}
                  </button>
                </div>
              </div>

              {!collapsedSections.approved && (
                <div className="mt-3 space-y-3">
                  {approved.length === 0 ? <p className="text-gray-500 text-sm">Nincs jóváhagyott foglalás</p> : approved.map((r) => (
                    <div key={r.id} className="bg-white p-3 rounded-md border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{r.guest_name || r.user_name || 'Ismeretlen'}</p>
                          <p className="text-xs text-gray-600">{r.arrival_date} → {r.departure_date} • {r.people || r.guests} fő</p>
                          <p className="text-xs text-gray-500 mt-2">Foglalás dátuma: {r.booking_date || r.created_at || '-'}</p>
                        </div>

                        <div>
                          <select
                            value={r.status || 'approved'}
                            onChange={(e) => updateReservationStatus(r.id, e.target.value)}
                            className="border px-2 py-1 rounded text-gray-900"
                            style={{ color: '#111827' }}
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

            {/* Rejected */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Elutasított</h3>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => toggleSection('rejected')} className="text-sm text-blue-600 underline">
                    {collapsedSections.rejected ? 'Megnyit' : 'Bezár'}
                  </button>
                </div>
              </div>

              {!collapsedSections.rejected && (
                <div className="mt-3 space-y-3">
                  {rejected.length === 0 ? <p className="text-gray-500 text-sm">Nincs elutasított foglalás</p> : rejected.map((r) => (
                    <div key={r.id} className="bg-white p-3 rounded-md border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{r.guest_name || r.user_name || 'Ismeretlen'}</p>
                          <p className="text-xs text-gray-600">{r.arrival_date} → {r.departure_date} • {r.people || r.guests} fő</p>
                          <p className="text-xs text-gray-500 mt-2">Foglalás dátuma: {r.booking_date || r.created_at || '-'}</p>
                        </div>

                        <div>
                          <select
                            value={r.status || 'rejected'}
                            onChange={(e) => updateReservationStatus(r.id, e.target.value)}
                            className="border px-2 py-1 rounded text-gray-900"
                            style={{ color: '#111827' }}
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
    </div>
  );
};

export default AdminKezeles;
