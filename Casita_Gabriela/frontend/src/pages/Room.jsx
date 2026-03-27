// src/pages/Room.jsx
// Room component — updated so lightbox controls (X, prev, next) are always in front of the image.
// Prev/Next are fixed to the screen edges (left/right center), Close (X) is fixed top-right.
// Buttons have very high z-index and pointer-events enabled so they never get occluded by the image.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import Footer from "../components/Footer";
import api from "../services/api";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parseISOToLocalDate = (isoStr) => {
  if (!isoStr) return null;
  const [y, m, d] = isoStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const dateToDayNumber = (date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return d.getTime();
};

const isoFromDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const iso = (d) => isoFromDate(d);

/* ---------- MonthCalendar (unchanged) ---------- */
const MonthCalendar = ({ monthDate, bookings = [], onDayClick, selectedRange, disabled = false }) => {
  const start = startOfMonth(monthDate);
  const last = endOfMonth(monthDate);
  const daysInMonth = last.getDate();
  const startWeekday = (start.getDay() + 6) % 7; // hétfő kezdés
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(start.getFullYear(), start.getMonth(), d);
    cells.push(date);
  }

  const isBooked = (date) => {
    if (!date) return false;
    const dayNum = dateToDayNumber(date);
    return bookings.some((b) => {
      const startNum = dateToDayNumber(parseISOToLocalDate(b.arrival_date || b.arrivalDate));
      const endNum = dateToDayNumber(parseISOToLocalDate(b.departure_date || b.departureDate));
      return dayNum >= startNum && dayNum < endNum;
    });
  };

  const inSelectedRange = (date) => {
    if (!date || !selectedRange || !selectedRange.start) return false;
    const dNum = dateToDayNumber(date);
    const sNum = dateToDayNumber(parseISOToLocalDate(selectedRange.start));
    if (!selectedRange.end) return dNum === sNum;
    const eNum = dateToDayNumber(parseISOToLocalDate(selectedRange.end));
    return dNum >= sNum && dNum <= eNum;
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
        {["H", "K", "Sze", "Cs", "P", "Szo", "V"].map((d) => (
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
              onClick={() => !booked && !disabled && onDayClick(dayIso)}
              disabled={booked || disabled}
              className={`h-12 rounded-md flex flex-col items-center justify-center text-sm transition
                ${booked ? "bg-gray-200 text-gray-500 cursor-not-allowed" : selected ? "bg-[#6FD98C] text-white" : "bg-white text-gray-800 hover:bg-gray-100"}
              `}
              title={date.toLocaleDateString()}
            >
              <div className="font-medium">{date.getDate()}</div>
              <div className="text-[10px] text-gray-500">{date.toLocaleString("hu-HU", { month: "short" })}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ---------- Room page ---------- */
const Room = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Crossfade preview: bottom/top layers
  const [bottomIndex, setBottomIndex] = useState(0);
  const [topIndex, setTopIndex] = useState(null);
  const [topKey, setTopKey] = useState(0);
  const [topVisible, setTopVisible] = useState(false);
  const [loadedMap, setLoadedMap] = useState({});
  const [initialImageLoaded, setInitialImageLoaded] = useState(false);

  const [activeThumbIndex, setActiveThumbIndex] = useState(0);
  const imageContainerRef = useRef(null);

  // Lightbox crossfade
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lbBottomIndex, setLbBottomIndex] = useState(0);
  const [lbTopIndex, setLbTopIndex] = useState(null);
  const [lbTopKey, setLbTopKey] = useState(0);
  const [lbTopVisible, setLbTopVisible] = useState(false);

  // drag state for preview and lightbox (kept simple)
  const previewDrag = useRef({ active: false, startX: 0, currentX: 0, threshold: 60 });
  const lbDrag = useRef({ active: false, startX: 0, currentX: 0, threshold: 60 });

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [acceptedAszf, setAcceptedAszf] = useState(false);
  const [acceptedAdat, setAcceptedAdat] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(new Date());

  const isLoggedIn = !!localStorage.getItem("token");
  const currentUserId = localStorage.getItem("user_id") ? Number(localStorage.getItem("user_id")) : null;

  const animTimeoutRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    fetchRoom();
    fetchBookings();
    const interval = setInterval(() => fetchBookings(), 5000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRoom = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/rooms/${id}`);
      const data = res.data;
      const roomData = {
        ...data,
        images: Array.isArray(data.images) ? data.images : data.images ? [data.images] : ["/blob.png"],
        space: data.space ?? 1,
        reviews: data.reviews || [],
      };
      if (!mountedRef.current) return;
      setRoom(roomData);
      setBottomIndex(0);
      setTopIndex(null);
      setActiveThumbIndex(0);
      setLoadedMap({});
      setInitialImageLoaded(false);

      const first = roomData.images?.[0];
      if (first) {
        const img = new Image();
        img.src = first;
        img.onload = () => {
          if (!mountedRef.current) return;
          setLoadedMap((m) => ({ ...m, 0: true }));
          setInitialImageLoaded(true);
        };
        img.onerror = () => {
          if (!mountedRef.current) return;
          setLoadedMap((m) => ({ ...m, 0: true }));
          setInitialImageLoaded(true);
        };
      } else {
        setInitialImageLoaded(true);
      }
    } catch (err) {
      console.error("Error fetching room:", err);
      if (mountedRef.current) setRoom(null);
      setInitialImageLoaded(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await api.get(`/bookings?room_id=${id}`);
      if (!mountedRef.current) return;
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      if (mountedRef.current) setBookings([]);
    }
  };

  const prefetchImage = (src, index) => {
    if (!src) return;
    if (loadedMap[index]) return;
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (!mountedRef.current) return;
      setLoadedMap((m) => ({ ...m, [index]: true }));
    };
    img.onerror = () => {
      if (!mountedRef.current) return;
      setLoadedMap((m) => ({ ...m, [index]: true }));
    };
  };

  // preview crossfade
  const changeImage = (newIndex) => {
    if (!room) return;
    setActiveThumbIndex(newIndex);
    setTopKey((k) => k + 1);
    setTopIndex(newIndex);
    setTopVisible(false);
    prefetchImage(room.images?.[newIndex], newIndex);
  };

  const onTopLoaded = (index) => {
    if (!mountedRef.current) return;
    requestAnimationFrame(() => {
      setTopVisible(true);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
      animTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setBottomIndex(index);
        setTopIndex(null);
        setTopVisible(false);
      }, 340);
    });
  };

  // Lightbox logic
  const openLightbox = (index) => {
    setLbBottomIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
    prefetchImage(room.images?.[index], index);
  };
  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
    setLbTopIndex(null);
    setLbTopVisible(false);
  };
  const lightboxChange = (newIndex) => {
    if (!room) return;
    setLbTopKey((k) => k + 1);
    setLbTopIndex(newIndex);
    setLbTopVisible(false);
    prefetchImage(room.images?.[newIndex], newIndex);
  };
  const onLbTopLoaded = (index) => {
    if (!mountedRef.current) return;
    requestAnimationFrame(() => {
      setLbTopVisible(true);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
      animTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setLbBottomIndex(index);
        setLbTopIndex(null);
        setLbTopVisible(false);
      }, 340);
    });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") lightboxChange((lbBottomIndex - 1 + (room?.images?.length || 1)) % (room?.images?.length || 1));
      if (e.key === "ArrowRight") lightboxChange((lbBottomIndex + 1) % (room?.images?.length || 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, lbBottomIndex, room]);

  const isRangeUnavailable = (startStr, endStr) => {
    if (!startStr || !endStr) return false;
    const start = dateToDayNumber(parseISOToLocalDate(startStr));
    const end = dateToDayNumber(parseISOToLocalDate(endStr));
    if (end <= start) return true;
    return bookings.some((b) => {
      const bStart = dateToDayNumber(parseISOToLocalDate(b.arrival_date || b.arrivalDate));
      const bEnd = dateToDayNumber(parseISOToLocalDate(b.departure_date || b.departureDate));
      return start < bEnd && end > bStart;
    });
  };

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = dateToDayNumber(parseISOToLocalDate(checkIn));
    const end = dateToDayNumber(parseISOToLocalDate(checkOut));
    const diffDays = Math.round((end - start) / MS_PER_DAY);
    return diffDays > 0 ? diffDays : 0;
  }, [checkIn, checkOut]);

  const totalPrice = useMemo(() => {
    if (!nights || !guests || !room) return 0;
    return nights * guests * room.price;
  }, [nights, guests, room]);

  const formatPrice = (value) => value.toLocaleString("hu-HU", { maximumFractionDigits: 0 });

  const handleDayClick = (dayIso) => {
    const clickedDate = parseISOToLocalDate(dayIso);
    const clickedNum = dateToDayNumber(clickedDate);
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(dayIso);
      setCheckOut("");
      return;
    }
    const startNum = dateToDayNumber(parseISOToLocalDate(checkIn));
    if (clickedNum <= startNum) {
      setCheckIn(dayIso);
      setCheckOut("");
      return;
    }
    const overlaps = bookings.some((b) => {
      const bStart = dateToDayNumber(parseISOToLocalDate(b.arrival_date || b.arrivalDate));
      const bEnd = dateToDayNumber(parseISOToLocalDate(b.departure_date || b.departureDate));
      return startNum < bEnd && clickedNum >= bStart;
    });
    if (overlaps) {
      setCheckOut("");
      return;
    }
    setCheckOut(dayIso);
  };

  const handleBooking = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (!checkIn || !checkOut) {
      alert("Kérlek válassz érkezési és távozási dátumot.");
      return;
    }
    if (dateToDayNumber(parseISOToLocalDate(checkOut)) <= dateToDayNumber(parseISOToLocalDate(checkIn))) {
      alert("A távozási dátumnak később kell lennie, mint az érkezési dátumnak.");
      return;
    }
    if (isRangeUnavailable(checkIn, checkOut)) {
      alert("A kiválasztott időszakban a szoba nem elérhető. Kérlek válassz másik időpontot.");
      return;
    }
    if (!acceptedAszf || !acceptedAdat) {
      alert("Kérlek fogadd el az ÁSZF-et és az Adatkezelési Tájékoztatót.");
      return;
    }
    const payload = {
      arrival_date: checkIn,
      departure_date: checkOut,
      people: guests,
      booking_date: new Date().toISOString().slice(0, 10),
      status: "pending",
      user_id: currentUserId || null,
      room_id: Number(id),
    };
    try {
      const res = await api.post("/bookings", payload);
      console.log("Booking response:", res.status, res.data);
      alert("Foglalás sikeresen leadva. A foglalás státusza: függőben.");
      fetchBookings();
      setCheckIn("");
      setCheckOut("");
      setGuests(1);
      setAcceptedAszf(false);
      setAcceptedAdat(false);
      setCalendarOpen(false);
    } catch (err) {
      console.error("Booking error full:", err);
      const status = err?.response?.status;
      const serverMsg = err?.response?.data || err?.message;
      alert(`Hiba történt a foglalás során (HTTP ${status || "??"}): ${JSON.stringify(serverMsg)}`);
    }
  };

  // --- Pointer / drag handlers for preview (kept minimal) ---
  const onPreviewPointerDown = (e) => {
    const pointerX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    previewDrag.current.active = true;
    previewDrag.current.startX = pointerX;
    previewDrag.current.currentX = pointerX;
    if (e.target.setPointerCapture && e.pointerId) {
      try { e.target.setPointerCapture(e.pointerId); } catch {}
    }
  };
  const onPreviewPointerMove = (e) => {
    if (!previewDrag.current.active) return;
    const pointerX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? previewDrag.current.currentX;
    previewDrag.current.currentX = pointerX;
  };
  const onPreviewPointerUp = () => {
    if (!previewDrag.current.active) return;
    previewDrag.current.active = false;
    const delta = previewDrag.current.currentX - previewDrag.current.startX;
    const threshold = previewDrag.current.threshold;
    if (delta > threshold) {
      const prev = (bottomIndex - 1 + (room?.images?.length || 1)) % (room?.images?.length || 1);
      changeImage(prev);
    } else if (delta < -threshold) {
      const next = (bottomIndex + 1) % (room?.images?.length || 1);
      changeImage(next);
    }
  };

  // --- Pointer / drag handlers for lightbox ---
  const onLbPointerDown = (e) => {
    const pointerX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    lbDrag.current.active = true;
    lbDrag.current.startX = pointerX;
    lbDrag.current.currentX = pointerX;
    if (e.target.setPointerCapture && e.pointerId) {
      try { e.target.setPointerCapture(e.pointerId); } catch {}
    }
  };
  const onLbPointerMove = (e) => {
    if (!lbDrag.current.active) return;
    const pointerX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? lbDrag.current.currentX;
    lbDrag.current.currentX = pointerX;
  };
  const onLbPointerUp = () => {
    if (!lbDrag.current.active) return;
    lbDrag.current.active = false;
    const delta = lbDrag.current.currentX - lbDrag.current.startX;
    const threshold = lbDrag.current.threshold;
    if (delta > threshold) {
      lightboxChange((lbBottomIndex - 1 + (room?.images?.length || 1)) % (room?.images?.length || 1));
    } else if (delta < -threshold) {
      lightboxChange((lbBottomIndex + 1) % (room?.images?.length || 1));
    }
  };

  // If still loading initial data or first image, show original loading screen
  if (loading || !initialImageLoaded) {
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

  const images = room.images && room.images.length > 0 ? room.images : ["/blob.png"];

  return (
    <div className="flex flex-col min-h-screen w-dvw bg-[#0b1f13] text-[#F1FBF4] spacer layerAdmin">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h1 className="text-3xl font-mono tracking-wide text-black">{room.name}</h1>

            {/* Preview: magasabb (h-96), crossfade két réteggel */}
            <div className="w-full bg-[#FFFECE] rounded-xl overflow-hidden shadow-md/20 relative">
              <div
                ref={imageContainerRef}
                className="relative w-full h-96 bg-[#f6f6f6] flex items-center justify-center touch-none"
                onPointerDown={onPreviewPointerDown}
                onPointerMove={onPreviewPointerMove}
                onPointerUp={onPreviewPointerUp}
                onPointerCancel={onPreviewPointerUp}
                onTouchStart={onPreviewPointerDown}
                onTouchMove={onPreviewPointerMove}
                onTouchEnd={onPreviewPointerUp}
                style={{ zIndex: 100, position: "relative", userSelect: "none" }}
              >
                {/* Bottom (véglegesített) */}
                <img
                  key={`bottom-${bottomIndex}`}
                  src={images[bottomIndex]}
                  alt={`${room.name} ${bottomIndex + 1}`}
                  draggable={false}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "translateZ(0)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    zIndex: 100,
                    transition: "opacity 320ms ease",
                    opacity: topIndex !== null && topVisible ? 0 : 1,
                  }}
                  onLoad={() => {
                    setLoadedMap((m) => ({ ...m, [bottomIndex]: true }));
                  }}
                />

                {/* Top (pending) */}
                {topIndex !== null && (
                  <img
                    key={`top-${topIndex}-${topKey}`}
                    src={images[topIndex]}
                    alt={`${room.name} ${topIndex + 1}`}
                    draggable={false}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: "translateZ(0)",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      zIndex: 110,
                      transition: "opacity 320ms ease",
                      opacity: topVisible ? 1 : 0,
                    }}
                    onLoad={() => onTopLoaded(topIndex)}
                  />
                )}

                {/* Fullscreen ikon */}
                <div className="absolute top-3 right-3 pointer-events-auto" style={{ zIndex: 120 }}>
                  <button
                    type="button"
                    onClick={() => openLightbox(bottomIndex)}
                    className="bg-white/95 text-black rounded-full p-2 shadow hover:scale-105 transform transition"
                    title="Nagyítás"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 3H5a2 2 0 00-2 2v3m0 8v3a2 2 0 002 2h3m8-16h3a2 2 0 012 2v3M16 21h3a2 2 0 002-2v-3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 flex-wrap">
              {images.map((img, index) => {
                const active = index === activeThumbIndex;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => changeImage(index)}
                    onDoubleClick={() => openLightbox(index)}
                    className={`w-20 h-16 rounded-md overflow-hidden border transform transition-all duration-200 ${active ? "border-[#6FD98C]" : "border-transparent"}`}
                    style={{
                      transform: active ? "scale(1.06)" : undefined,
                      transition: "transform 120ms ease",
                    }}
                  >
                    <img src={img} alt={`${room.name} kép ${index + 1}`} className="w-full h-full object-cover" draggable={false} />
                  </button>
                );
              })}
            </div>

            {/* Description */}
            <div className="bg-[#FFFECE] text-black rounded-xl p-4 shadow-md">
              <h2 className="font-semibold text-lg mb-2">Leírás</h2>
              <p className="text-sm leading-relaxed">{room.description}</p>
            </div>

            {/* Reviews */}
            <div className="bg-[#FFFECE] text-black rounded-xl p-4 shadow-md flex flex-col gap-4">
              <h2 className="font-semibold text-lg">Legjobb vélemények</h2>
              {(room.reviews || []).slice(0, 4).map((review) => (
                <div key={review.id} className="border-b last:border-b-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-500">
                      {"★".repeat(review.stars)}
                      {"☆".repeat(5 - review.stars)}
                    </span>
                    <span className="text-xs text-gray-600">{review.stars}/5</span>
                  </div>
                  <p className="text-sm text-gray-800">{review.comment}</p>
                </div>
              ))}
              <div className="pt-2">
                <button type="button" className="bg-[#6FD98C] text-white px-4 py-2 rounded hover:bg-[#5FCB80] transition-all duration-200 text-sm">
                  Vélemény írása
                </button>
              </div>
            </div>
          </div>

          {/* Right column (booking) */}
          <div className="flex flex-col gap-6">
            <div className="bg-[#FFFECE] text-black rounded-xl p-4 shadow-md">
              <h2 className="font-semibold text-lg">Foglalás</h2>
              <div className="mt-2">
                <div className="flex gap-2 items-center">
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-600">Érkezés</label>
                    <div className="text-sm font-medium">{checkIn || "-"}</div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-600">Távozás</label>
                    <div className="text-sm font-medium">{checkOut || "-"}</div>
                  </div>
                </div>

                <div className="mt-3">
                  <button type="button" onClick={() => setCalendarOpen((s) => !s)} className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                    {calendarOpen ? "Naptár bezárása" : "Naptár megnyitása"}
                  </button>
                </div>

                {calendarOpen && (
                  <div className="mt-4 p-4 bg-white text-black rounded-lg shadow">
                    <div className="flex items-center justify-between mb-3">
                      <button type="button" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))} className="px-2 py-1 border rounded">
                        Előző
                      </button>
                      <div className="font-medium">{visibleMonth.toLocaleString("hu-HU", { month: "long", year: "numeric" })}</div>
                      <button type="button" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))} className="px-2 py-1 border rounded">
                        Következő
                      </button>
                    </div>

                    <MonthCalendar monthDate={visibleMonth} bookings={bookings} onDayClick={handleDayClick} selectedRange={{ start: checkIn, end: checkOut }} />

                    <div className="mt-3 flex gap-2 justify-end">
                      <button type="button" onClick={() => { setCheckIn(""); setCheckOut(""); }} className="px-3 py-2 border rounded">Törlés</button>
                      <button type="button" onClick={() => setCalendarOpen(false)} className="px-3 py-2 border rounded">Bezár</button>
                    </div>
                  </div>
                )}
              </div>

              {isRangeUnavailable(checkIn, checkOut) && <p className="text-sm text-red-600 mt-2">A kiválasztott időszak átfed egy meglévő foglalással. Válassz másik időpontot.</p>}

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
                disabled={!acceptedAszf || !acceptedAdat || !nights || isRangeUnavailable(checkIn, checkOut)}
                onClick={handleBooking}
                className={`mt-3 w-full px-4 py-2 rounded text-sm font-semibold ${!acceptedAszf || !acceptedAdat || !nights || isRangeUnavailable(checkIn, checkOut) ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-[#6FD98C] text-white hover:bg-[#5FCB80]"}`}
              >
                {isLoggedIn ? "Foglalás leadása" : "Bejelentkezés a foglaláshoz"}
              </button>

              <div className="mt-3 flex items-center justify-between text-sm text-gray-700">
                <span>{nights > 0 ? `${nights} éj, ${guests} fő` : "Válassz dátumot"}</span>
                <span className="font-semibold text-[#0b1f13]">{totalPrice > 0 ? `${formatPrice(totalPrice)} Ft` : ""}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Lightbox: backdrop + modal */}
      {lightboxOpen && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 z-[900] bg-black/70"
            onClick={closeLightbox}
            aria-hidden="true"
          />

          {/* modal container (centered) */}
          <div
            className="fixed inset-0 z-[910] flex items-center justify-center pointer-events-none"
            aria-hidden="false"
          >
            <div
              className="relative w-full max-w-6xl mx-4 h-[90vh] bg-transparent rounded overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={onLbPointerDown}
              onPointerMove={onLbPointerMove}
              onPointerUp={onLbPointerUp}
              onPointerCancel={onLbPointerUp}
              onTouchStart={onLbPointerDown}
              onTouchMove={onLbPointerMove}
              onTouchEnd={onLbPointerUp}
              style={{ touchAction: "pan-y" }}
            >
              {/* Bottom (végleges) lightbox kép: magasság kitöltése */}
              <img
                key={`lb-bottom-${lbBottomIndex}`}
                src={images[lbBottomIndex]}
                alt={`Nagyítás ${lbBottomIndex + 1}`}
                draggable={false}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  height: "100%", // kitölti a modal magasságát
                  width: "auto",
                  objectFit: "contain",
                  transition: "opacity 320ms ease",
                  opacity: lbTopIndex !== null && lbTopVisible ? 0 : 1,
                  zIndex: 920, // image z-index lower than controls
                }}
                onLoad={() => setLoadedMap((m) => ({ ...m, [lbBottomIndex]: true }))}
              />

              {/* Top (pending) lightbox kép */}
              {lbTopIndex !== null && (
                <img
                  key={`lb-top-${lbTopIndex}-${lbTopKey}`}
                  src={images[lbTopIndex]}
                  alt={`Nagyítás ${lbTopIndex + 1}`}
                  draggable={false}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    height: "100%",
                    width: "auto",
                    objectFit: "contain",
                    transition: "opacity 320ms ease",
                    opacity: lbTopVisible ? 1 : 0,
                    zIndex: 920,
                  }}
                  onLoad={() => onLbTopLoaded(lbTopIndex)}
                />
              )}
            </div>
          </div>

          {/* Controls: fixed and always above the image (very high z-index) */}
          {/* Close X - fixed top-right of viewport */}
          <button
            onClick={closeLightbox}
            aria-label="Bezár"
            style={{
              position: "fixed",
              top: 16,
              right: 16,
              zIndex: 99999,
            }}
            className="bg-white/95 text-black rounded-full p-3 shadow-lg hover:scale-105 transform transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Prev - fixed left center */}
          <button
            onClick={() => lightboxChange((lbBottomIndex - 1 + images.length) % images.length)}
            aria-label="Előző"
            style={{
              position: "fixed",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 99998,
            }}
            className="bg-white/90 text-black rounded-full p-3 shadow-lg hover:scale-105 transform transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next - fixed right center */}
          <button
            onClick={() => lightboxChange((lbBottomIndex + 1) % images.length)}
            aria-label="Következő"
            style={{
              position: "fixed",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 99998,
            }}
            className="bg-white/90 text-black rounded-full p-3 shadow-lg hover:scale-105 transform transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

export default Room;
