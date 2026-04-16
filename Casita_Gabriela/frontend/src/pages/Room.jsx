// src/pages/Room.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "axios";
import Footer from "../components/Footer";

const BACKEND_BASE = "http://localhost:6969";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parseISOToLocalDate = (isoStr) => {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  if (isNaN(d)) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
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

/* ---------- Simple Error Toast system ---------- */
const ErrorToast = ({ toasts, removeToast }) => {
  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-3 items-end">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="max-w-sm w-full bg-white/95 text-black rounded-lg shadow-lg border border-gray-200 overflow-hidden"
          role="alert"
        >
          <div className="p-3 flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12A9 9 0 1112 3a9 9 0 019 9z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{t.title || "Hiba"}</div>
              <div className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{t.message}</div>
            </div>
            <div className="ml-3">
              <button onClick={() => removeToast(t.id)} className="text-gray-500 hover:text-gray-700 p-1 rounded" aria-label="Bezár">
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ---------- MonthCalendar (fél‑napos megjelenítéssel, enyhébb színek) ---------- */
const MonthCalendar = ({ monthDate, bookings = [], onDayClick, selectedRange, disabled = false, minDate = null, calendarMap = {} }) => {
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

  const inSelectedRange = (date) => {
    if (!date || !selectedRange || !selectedRange.start) return false;
    const dNum = dateToDayNumber(date);
    const sNum = dateToDayNumber(parseISOToLocalDate(selectedRange.start));
    if (!selectedRange.end) return dNum === sNum;
    const eNum = dateToDayNumber(parseISOToLocalDate(selectedRange.end));
    return dNum >= sNum && dNum <= eNum;
  };

  const isBeforeMin = (date) => {
    if (!minDate || !date) return false;
    return dateToDayNumber(date) < dateToDayNumber(minDate);
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
          const entry = calendarMap[dayIso] || { left: null, right: null };
          const bookingLeft = entry.left;
          const bookingRight = entry.right;
          const startIso = selectedRange?.start || null;
          const endIso = selectedRange?.end || null;
          const isStart = startIso === dayIso;
          const isEnd = endIso === dayIso;
          const between =
            startIso && endIso &&
            dateToDayNumber(date) > dateToDayNumber(parseISOToLocalDate(startIso)) &&
            dateToDayNumber(date) < dateToDayNumber(parseISOToLocalDate(endIso));
          const selectedLeft = isEnd || between;
          const selectedRight = isStart || between || (!endIso && isStart);
          const bookingLeftClass =
            bookingLeft === "approved" ? "bg-red-100" : bookingLeft === "pending" ? "bg-yellow-50" : "bg-transparent";
          const bookingRightClass =
            bookingRight === "approved" ? "bg-red-100" : bookingRight === "pending" ? "bg-yellow-50" : "bg-transparent";
          const selectedClass = "bg-green-200";
          const leftClass = selectedLeft ? selectedClass : bookingLeftClass;
          const rightClass = selectedRight ? selectedClass : bookingRightClass;
          const beforeMin = isBeforeMin(date);
          const isDisabled = beforeMin || disabled;
          const baseClass = beforeMin ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-800 hover:bg-gray-100";

          return (
            <button
              key={dayIso}
              type="button"
              onClick={() => !isDisabled && onDayClick(dayIso)}
              disabled={isDisabled}
              className={`h-12 rounded-md flex flex-col items-center justify-center text-sm transition ${baseClass}`}
              title={date.toLocaleDateString()}
              style={{ border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <div className="w-full h-full flex items-stretch relative">
                <div className={`w-1/2 h-full flex flex-col items-center justify-center border-r border-gray-200 relative`}>
                  <div className={`absolute inset-0 ${leftClass} rounded-l-md`} style={{ opacity: leftClass === "bg-transparent" ? 0 : 1 }}></div>
                  <div className="relative z-10 w-full text-center">
                    <div className="font-medium">{date.getDate()}</div>
                    <div className="text-[10px] text-gray-500">{date.toLocaleString("hu-HU", { month: "short" })}</div>
                  </div>
                </div>
                <div className={`w-1/2 h-full flex flex-col items-center justify-center relative`}>
                  <div className={`absolute inset-0 ${rightClass} rounded-r-md`} style={{ opacity: rightClass === "bg-transparent" ? 0 : 1 }}></div>
                  <div className="relative z-10 w-full text-center"></div>
                </div>
              </div>
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
  const [successMessage, setSuccessMessage] = useState("");
  const [bottomIndex, setBottomIndex] = useState(0);
  const [topIndex, setTopIndex] = useState(null);
  const [topKey, setTopKey] = useState(0);
  const [topVisible, setTopVisible] = useState(false);
  const [loadedMap, setLoadedMap] = useState({});
  const [initialImageLoaded, setInitialImageLoaded] = useState(false);
  const [activeThumbIndex, setActiveThumbIndex] = useState(0);
  const imageContainerRef = useRef(null);

  // Lightbox state (simple, no scaling)
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lbBottomIndex, setLbBottomIndex] = useState(0);
  const [lbTopIndex, setLbTopIndex] = useState(null);
  const [lbTopKey, setLbTopKey] = useState(0);
  const [lbTopVisible, setLbTopVisible] = useState(false);

  const previewDrag = useRef({ active: false, startX: 0, currentX: 0, threshold: 60 });
  const lbDrag = useRef({ active: false, startX: 0, currentX: 0, threshold: 60 });

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [acceptedAszf, setAcceptedAszf] = useState(false);
  const [acceptedAdat, setAcceptedAdat] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const isLoggedIn = !!localStorage.getItem("token");
  const currentUserId = localStorage.getItem("user_id") ? Number(localStorage.getItem("user_id")) : null;
  const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
  const isFirstTimeUser = currentUser?.isFirstTimeUser === true;
  const animTimeoutRef = useRef(null);
  const mountedRef = useRef(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const genErrorCode = (prefix) => `${prefix}_${Date.now().toString(36).slice(-6)}`;

  useEffect(() => {
    mountedRef.current = true;
    fetchRoom();
    fetchBookings();
    const interval = setInterval(() => fetchBookings(), 5000);
    const t = setTimeout(() => setPageLoaded(true), 80);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      clearTimeout(t);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const pushToast = (title, message, status = null, code = null, ttl = 7000) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 9);
    const toast = { id, title, message, status, code };
    setToasts((s) => [...s, toast]);
    setTimeout(() => {
      setToasts((s) => s.filter((t) => t.id !== id));
    }, ttl);
  };

  const removeToast = (id) => {
    setToasts((s) => s.filter((t) => t.id !== id));
  };

  const fetchRoom = async () => {
    const ERR = genErrorCode("ERR_ROOM_FETCH");
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_BASE}/rooms/${id}`);
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
      const status = err?.response?.status || null;
      const serverData = err?.response?.data || err?.message;
      console.error(ERR, "Error fetching room:", { status, serverData, err });
      pushToast("Hiba a szoba betöltésekor", `Kód: ${ERR}\n${String(serverData).slice(0, 200)}`, status, ERR);
      if (mountedRef.current) setRoom(null);
      setInitialImageLoaded(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const fetchBookings = async () => {
    const ERR = genErrorCode("ERR_BOOKINGS_FETCH");
    try {
      const res = await axios.get(`${BACKEND_BASE}/booking?room_id=${id}`);
      if (!mountedRef.current) return;
      const data = Array.isArray(res.data) ? res.data : [];
      const normalized = data.map((b) => ({
        ...b,
        arrival_date: b.arrival_date ? new Date(b.arrival_date).toISOString().slice(0, 10) : b.arrival_date,
        departure_date: b.departure_date ? new Date(b.departure_date).toISOString().slice(0, 10) : b.departure_date,
      }));
      setBookings(normalized);
    } catch (err) {
      const status = err?.response?.status || null;
      const serverData = err?.response?.data || err?.message;
      console.error(ERR, "Error fetching bookings:", { status, serverData, err });
      pushToast("Hiba a foglalások lekérésekor", `Kód: ${ERR}\n${String(serverData).slice(0, 200)}`, status, ERR);
      if (mountedRef.current) setBookings([]);
    }
  };

  const prefetchImage = useCallback((src, index) => {
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
  }, [loadedMap]);

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

  const lightboxChange = useCallback((newIndex) => {
    if (!room) return;
    setLbTopKey((k) => k + 1);
    setLbTopIndex(newIndex);
    setLbTopVisible(false);
    prefetchImage(room.images?.[newIndex], newIndex);
    setTimeout(() => setLbBottomIndex(newIndex), 260);
  }, [room, prefetchImage]);

  const openLightbox = (index) => {
    if (!room) return;
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
      }, 240);
    });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") {
        const len = room?.images?.length || 1;
        lightboxChange((lbBottomIndex - 1 + len) % len);
      }
      if (e.key === "ArrowRight") {
        const len = room?.images?.length || 1;
        lightboxChange((lbBottomIndex + 1) % len);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, lbBottomIndex, room, lightboxChange]);

  // Build calendarMap (half-day coloring)
  const calendarMap = useMemo(() => {
    const map = {};
    const normalizeStatus = (s) => {
      if (!s) return null;
      const st = s.toString().toLowerCase();
      if (st.includes("approved")) return "approved";
      if (st.includes("pend")) return "pending";
      return null;
    };
    bookings.forEach((b) => {
      const status = normalizeStatus(b.status);
      if (!b.arrival_date || !b.departure_date) return;
      const start = parseISOToLocalDate(b.arrival_date);
      const end = parseISOToLocalDate(b.departure_date);
      if (!start || !end) return;
      if (dateToDayNumber(end) <= dateToDayNumber(start)) return;
      const startIso = isoFromDate(start);
      if (!map[startIso]) map[startIso] = { left: null, right: null };
      const setRight = (existing, incoming) => {
        if (!incoming) return existing;
        if (existing === "approved") return existing;
        return incoming;
      };
      map[startIso].right = setRight(map[startIso].right, status);
      const endIso = isoFromDate(end);
      if (!map[endIso]) map[endIso] = { left: null, right: null };
      const setLeft = (existing, incoming) => {
        if (!incoming) return existing;
        if (existing === "approved") return existing;
        return incoming;
      };
      map[endIso].left = setLeft(map[endIso].left, status);
      let cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      cur.setDate(cur.getDate() + 1);
      while (dateToDayNumber(cur) < dateToDayNumber(end)) {
        const curIso = isoFromDate(cur);
        if (!map[curIso]) map[curIso] = { left: null, right: null };
        map[curIso].left = setLeft(map[curIso].left, status);
        map[curIso].right = setRight(map[curIso].right, status);
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [bookings]);

  const checkRangeStatus = (startStr, endStr) => {
    if (!startStr || !endStr) return { blocked: false, pending: false };
    const start = dateToDayNumber(parseISOToLocalDate(startStr));
    const end = dateToDayNumber(parseISOToLocalDate(endStr));
    if (end <= start) return { blocked: true, pending: false };
    let blocked = false;
    let pending = false;
    bookings.forEach((b) => {
      const bStart = dateToDayNumber(parseISOToLocalDate(b.arrival_date || b.arrivalDate));
      const bEnd = dateToDayNumber(parseISOToLocalDate(b.departure_date || b.departureDate));
      const overlap = start < bEnd && end > bStart;
      if (!overlap) return;
      const status = (b.status || "").toString().toLowerCase();
      const approvedStatuses = ["approved"];
      if (approvedStatuses.includes(status)) blocked = true;
      else if (status.includes("pend")) pending = true;
      else pending = true;
    });
    return { blocked, pending };
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

  const discountedPrice = useMemo(() => {
    if (!totalPrice) return 0;
    return isFirstTimeUser ? Math.round(totalPrice * 0.85) : totalPrice;
  }, [totalPrice, isFirstTimeUser]);

  const formatPrice = (value) => value.toLocaleString("hu-HU", { maximumFractionDigits: 0 });

  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const handleDayClick = (dayIso) => {
    const clickedDate = parseISOToLocalDate(dayIso);
    if (!clickedDate) return;
    if (dateToDayNumber(clickedDate) < dateToDayNumber(today)) return;
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
    const tentativeStart = checkIn;
    const tentativeEnd = dayIso;
    const status = checkRangeStatus(tentativeStart, tentativeEnd);
    if (status.blocked) {
      pushToast("Nem elérhető", "A kiválasztott időszak egy jóváhagyott foglalással átfed.");
      setCheckOut("");
      return;
    }
    if (status.pending) {
      pushToast("Függőben lévő foglalás", "A kiválasztott időszakra már van egy függő foglalás.");
      setCheckOut("");
      return;
    }
    setCheckOut(dayIso);
  };

  const clearSelection = () => {
    setCheckIn("");
    setCheckOut("");
  };

  const sendClientErrorReport = async (payload) => {
    try {
      await axios.post(`${BACKEND_BASE}/client-error`, payload, { headers: { "Content-Type": "application/json" } });
    } catch (err) {
      console.debug("Client error report failed (ok to ignore):", err?.message || err);
    }
  };

  const handleBooking = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (!checkIn || !checkOut) {
      pushToast("Hiányzó dátum", "Kérlek válassz érkezési és távozási dátumot.");
      return;
    }
    if (dateToDayNumber(parseISOToLocalDate(checkOut)) <= dateToDayNumber(parseISOToLocalDate(checkIn))) {
      pushToast("Dátum hiba", "A távozási dátumnak később kell lennie, mint az érkezési dátumnak.");
      return;
    }
    const rangeStatus = checkRangeStatus(checkIn, checkOut);
    if (rangeStatus.blocked) {
      const ERR = genErrorCode("ERR_BOOKING_BLOCKED");
      console.warn(ERR, "Attempt to book blocked range", { checkIn, checkOut });
      pushToast("Nem elérhető", `A kiválasztott időszak egy jóváhagyott foglalással átfed. (Kód: ${ERR})`);
      return;
    }
    if (rangeStatus.pending) {
      const ERR = genErrorCode("ERR_BOOKING_PENDING");
      console.warn(ERR, "Attempt to book range with pending overlap", { checkIn, checkOut });
      pushToast("Függőben lévő foglalás", `A kiválasztott időszakra már van egy függő foglalás — folytathatod a foglalást, de ez csak egy figyelmeztetés. (Kód: ${ERR})`);
     
    }
    if (!acceptedAszf || !acceptedAdat) {
      pushToast("Elfogadás szükséges", "Kérlek fogadd el az ÁSZF-et és az Adatkezelési Tájékoztatót.");
      return;
    }
    const payload = {
      arrival_date: checkIn,
      departure_date: checkOut,
      people: guests,
      booking_date: new Date(),
      status: "pending",
      user_id: currentUserId || null,
      room_id: Number(id),
    };
    const endpoints = ["/booking", "/bookings"];
    let lastError = null;
    for (const ep of endpoints) {
      const ERR_POST = genErrorCode("ERR_BOOKING_POST");
      try {
        const url = `${BACKEND_BASE}${ep}`;
            const res = await axios.post(url, payload, { headers: { "Content-Type": "application/json" } });
        setSuccessMessage("Foglalás sikeresen leadva!");
        setTimeout(() => setSuccessMessage(""), 4000);
        fetchBookings();
        clearSelection();
        setGuests(1);
        setAcceptedAszf(false);
        setAcceptedAdat(false);
            // If booking applied first-time discount, update local cached user
            try {
              const respPrice = res?.data?.price;
              if (respPrice && respPrice.discountApplied && currentUser) {
                const updated = { ...currentUser, isFirstTimeUser: false };
                localStorage.setItem('user', JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: updated, token: localStorage.getItem('token') } }));
              }
            } catch (e) {
              console.debug('Updating local first-time flag failed', e);
            }
        return;
      } catch (err) {
        lastError = { err, endpoint: ep, code: ERR_POST };
        const status = err?.response?.status || null;
        const serverData = err?.response?.data || err?.message;
        console.warn(ERR_POST, `Booking attempt to ${ep} failed:`, { status, serverData });
        if (status && status !== 404) {
          pushToast("Foglalás hiba", `Hiba történt a foglalás során. (Kód: ${ERR_POST})`);
          sendClientErrorReport({ code: ERR_POST, endpoint: ep, status, serverData, payload, timestamp: new Date().toISOString() });
          return;
        }
      }
    }
    const errObj = lastError?.err;
    const tried = endpoints.join(", ");
    const status = errObj?.response?.status || null;
    const serverData = errObj?.response?.data;
    const ERR_FINAL = lastError?.code || genErrorCode("ERR_BOOKING_FINAL");
    pushToast("Foglalás hiba", `Sikertelen foglalás. Kérlek próbáld újra. (Kód: ${ERR_FINAL})`);
    console.error(ERR_FINAL, "Booking final error:", { status, serverData, tried, payload });
    sendClientErrorReport({
      code: ERR_FINAL,
      triedEndpoints: endpoints,
      status,
      serverData: typeof serverData === "string" ? serverData : serverData,
      payload,
      timestamp: new Date().toISOString(),
    });
  };

  const onPreviewPointerDown = (e) => {
    const pointerX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    previewDrag.current.active = true;
    previewDrag.current.startX = pointerX;
    previewDrag.current.currentX = pointerX;
    if (e.target.setPointerCapture && e.pointerId) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (err) {
        console.debug("pointer capture not available", err);
      }
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

  const onLbPointerDown = (e) => {
    const pointerX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    lbDrag.current.active = true;
    lbDrag.current.startX = pointerX;
    lbDrag.current.currentX = pointerX;
    if (e.target.setPointerCapture && e.pointerId) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (err) {
        console.debug("pointer capture not available", err);
      }
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
      const len = room?.images?.length || 1;
      lightboxChange((lbBottomIndex - 1 + len) % len);
    } else if (delta < -threshold) {
      const len = room?.images?.length || 1;
      lightboxChange((lbBottomIndex + 1) % len);
    }
  };

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
  const currentRangeStatus = checkRangeStatus(checkIn, checkOut);

  // New: booking enabled only when dates selected and both checkboxes accepted
  const canBook = !!(checkIn && checkOut && acceptedAszf && acceptedAdat);

  return (
    <>
      <div className={`flex flex-col min-h-screen w-dvw bg-[#0b1f13] text-[#F1FBF4] spacer layerAdmin transition-all duration-500 ${pageLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <h1 className={`text-3xl font-mono tracking-wide text-black transform transition-all duration-500 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>{room.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                {room.reviews && room.reviews.length ? (
                  <>
                    <div className="text-yellow-500">
                      {(() => {
                        const reviews = room.reviews || [];
                        const avgRounded = Math.round(reviews.reduce((s, r) => s + (r.stars || 0), 0) / reviews.length);
                        return "★".repeat(avgRounded) + "☆".repeat(5 - avgRounded)
                      })()}
                    </div>
                    <div className="text-sm text-gray-700 font-medium">{(Math.round((room.reviews.reduce((s, r) => s + (r.stars || 0), 0) / room.reviews.length) * 10) / 10)}/5</div>
                    <div className="text-sm text-gray-600">({room.reviews.length} vélemény)</div>
                  </>
                ) : (
                  <div className="text-sm text-gray-500">Nincsenek vélemények</div>
                )}
              </div>
              <div className={`w-full bg-[#FFFECE] rounded-xl overflow-hidden shadow-md/20 relative transform transition-all duration-600 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
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
              <div className="flex gap-3 flex-wrap">
                {images.map((img, index) => {
                  const active = index === activeThumbIndex;
                  const delay = `${index * 40}ms`;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => { changeImage(index); setActiveThumbIndex(index); }}
                      onDoubleClick={() => openLightbox(index)}
                      className={`w-20 h-16 rounded-md overflow-hidden border transform transition-all duration-200 ${active ? "border-[#6FD98C]" : "border-transparent"}`}
                      style={{
                        transform: active ? "scale(1.06)" : undefined,
                        transition: "transform 120ms ease, opacity 360ms ease",
                        opacity: pageLoaded ? 1 : 0,
                        transitionDelay: pageLoaded ? delay : "0ms",
                      }}
                    >
                      <img src={img} alt={`${room.name} kép ${index + 1}`} className="w-full h-full object-cover" draggable={false} />
                    </button>
                  );
                })}
              </div>
              <div className={`bg-[#FFFECE] text-black rounded-xl p-4 shadow-md transform transition-all duration-500 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} style={{ transitionDelay: pageLoaded ? '160ms' : '0ms' }}>
                <h2 className="font-semibold text-lg mb-2">Leírás</h2>
                <p className="text-sm leading-relaxed">{room.description}</p>
              </div>
              <div className={`bg-[#FFFECE] text-black rounded-xl p-4 shadow-md flex flex-col gap-4 transform transition-all duration-500 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} style={{ transitionDelay: pageLoaded ? '200ms' : '0ms' }}>
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
                  {!showReviewForm ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!isLoggedIn) {
                          pushToast('Bejelentkezés szükséges', 'A vélemény írásáshoz be kell jelentkezned.');
                          return;
                        }
                        setReviewStars(0);
                        setReviewComment("");
                        setShowReviewForm(true);
                      }}
                      className="bg-[#6FD98C] text-white px-4 py-2 rounded hover:bg-[#5FCB80] transition-all duration-200 text-sm"
                    >
                      Vélemény írása
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {[1,2,3,4,5].map((s) => {
                          const filled = reviewStars >= s;
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setReviewStars(s)}
                              aria-label={`${s} csillag`}
                              className={`text-3xl leading-none ${filled ? 'text-yellow-400' : 'text-gray-300'} focus:outline-none`}
                            >
                              {filled ? '★' : '☆'}
                            </button>
                          );
                        })}
                      </div>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full p-2 rounded border"
                        rows={3}
                        maxLength={200}
                        placeholder="Írd ide a véleményed (max 200 karakter)"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={reviewSubmitting}
                          onClick={async () => {
                            if (!reviewComment.trim()) {
                              pushToast('Hiba', 'A vélemény szövege nem lehet üres.');
                              return;
                            }
                            try {
                              setReviewSubmitting(true);
                              await axios.post(`${BACKEND_BASE}/room_reviews`, {
                                room_id: room.id,
                                stars: reviewStars,
                                comment: reviewComment,
                              }, {
                                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                              });
                              setReviewComment('');
                              setReviewStars(5);
                              setShowReviewForm(false);
                              pushToast('Köszönjük', 'Véleményed rögzítve lett.');
                              await fetchRoom();
                            } catch (err) {
                              console.error('POST review error', err);
                              pushToast('Hiba', 'Nem sikerült rögzíteni a véleményt.');
                            } finally {
                              setReviewSubmitting(false);
                            }
                          }}
                          className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-60"
                        >
                          Küldés
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowReviewForm(false)}
                          className="bg-gray-200 text-black px-3 py-1 rounded"
                        >
                          Mégse
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              {/* Booking card */}
              <div className={`bg-[#FFFECE] text-black rounded-xl p-4 shadow-md transform transition-all duration-500 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} style={{ transitionDelay: pageLoaded ? '220ms' : '0ms' }}>
                {successMessage && (
                  <div className="mb-4 p-3 rounded-md bg-[#d4edda] border border-[#c3e6cb] text-[#155724] font-semibold text-sm">
                    ✔ {successMessage}
                  </div>
                )}
                <h2 className="font-semibold text-lg">Foglalás</h2>
                <div className="mt-4">
                  <div className="flex gap-2 items-center mb-3">
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600">Érkezés</label>
                      <div className="text-sm font-medium">{checkIn || "-"}</div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600">Távozás</label>
                      <div className="text-sm font-medium">{checkOut || "-"}</div>
                    </div>
                  </div>
                  <div className="mt-3 bg-white text-black rounded-lg shadow p-4">
                    <div className="flex items-center justify-center mb-3">
                      <div className="font-medium text-sm">
                        {visibleMonth.toLocaleString("hu-HU", { year: "numeric", month: "long" })}
                      </div>
                    </div>
                    <MonthCalendar
                      monthDate={visibleMonth}
                      bookings={bookings}
                      onDayClick={handleDayClick}
                      selectedRange={{ start: checkIn, end: checkOut }}
                      disabled={false}
                      minDate={today}
                      calendarMap={calendarMap}
                    />
                    <div className="mt-4 flex items-center">
                      <div className="flex-1 flex justify-start">
                        <button
                          type="button"
                          onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
                          className="px-3 py-2 border rounded bg-white hover:bg-gray-50"
                        >
                          Előző
                        </button>
                      </div>
                      <div className="flex-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
                          className="px-3 py-2 border rounded bg-white hover:bg-gray-50"
                        >
                          Következő
                        </button>
                      </div>
                      <div className="flex-1 flex justify-end">
                        <button
                          type="button"
                          onClick={clearSelection}
                          className="px-3 py-2 border rounded bg-white hover:bg-gray-50 text-red-600 font-medium"
                        >
                          Törlés
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {currentRangeStatus.blocked && <p className="text-sm text-red-600 mt-2">A kiválasztott időszak átfed egy jóváhagyott foglalással.</p>}
                {currentRangeStatus.pending && <p className="text-sm text-yellow-600 mt-2">A kiválasztott időszakra már van függő foglalás.</p>}
                <div className="mt-4 flex items-center gap-3">
                  <div>
                    <label className="text-xs text-gray-600">Vendégek</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Math.max(1, Number(e.target.value || 1)))}
                      className="ml-2 w-28 p-1 rounded border bg-white text-black"
                    >
                      {Array.from({ length: room?.space ?? 1 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n} személy</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 text-right">
                    <div className="text-sm">Éjszakák: <strong>{nights}</strong></div>
                    <div className="text-lg font-semibold">
                      {isFirstTimeUser && totalPrice > 0 ? (
                        <div className="flex flex-col items-end">
                          <div className="text-sm text-gray-500 line-through">{formatPrice(totalPrice)} Ft</div>
                          <div className="text-lg font-semibold text-red-600">{formatPrice(discountedPrice)} Ft</div>
                          <div className="text-xs text-green-700">15% kedvezmény első foglalásod alkalmával</div>
                        </div>
                      ) : (
                        <div>{formatPrice(totalPrice)} Ft</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 items-center">
                  <label className="inline-flex items-center">
                    <input type="checkbox" checked={acceptedAszf} onChange={(e) => setAcceptedAszf(e.target.checked)} className="mr-2" />
                    <span>Elfogadom az <a href="/aszf" className="text-blue-600 underline">ÁSZF-et</a></span>
                  </label>
                </div>

                <div className="mt-2 flex gap-2 items-center">
                  <label className="inline-flex items-center">
                    <input type="checkbox" checked={acceptedAdat} onChange={(e) => setAcceptedAdat(e.target.checked)} className="mr-2" />
                    <span>Elfogadom az <a href="/adatkezeles" className="text-blue-600 underline">Adatkezelési tájékoztatót</a></span>
                  </label>
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleBooking}
                    disabled={!canBook}
                    className={`w-full py-2 rounded transition ${
                      canBook
                        ? "bg-[#6FD98C] text-white cursor-pointer hover:bg-[#5FCB80]"
                        : "bg-gray-400 text-white cursor-not-allowed"
                    }`}
                  >
                    Foglalás leadása
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* Replaced lightbox: full-screen modal copied from the first code (simple full-screen overlay with centered image) */}
      {lightboxOpen && (
        <>
          <div className="fixed inset-0 z-900 bg-black/70" onClick={closeLightbox} aria-hidden="true" />
          <div className="fixed inset-0 z-910 flex items-center justify-center pointer-events-none" aria-hidden="false">
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
                  height: "100%",
                  width: "auto",
                  objectFit: "contain",
                  transition: "opacity 320ms ease",
                  opacity: lbTopIndex !== null && lbTopVisible ? 0 : 1,
                  zIndex: 920,
                }}
                onLoad={() => setLoadedMap((m) => ({ ...m, [lbBottomIndex]: true }))}
              />
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
          <button
            onClick={closeLightbox}
            aria-label="Bezár"
            style={{ position: "fixed", top: 16, right: 16, zIndex: 99999 }}
            className="bg-white/95 text-black rounded-full p-3 shadow-lg hover:scale-105 transform transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={() => lightboxChange((lbBottomIndex - 1 + images.length) % images.length)}
            aria-label="Előző"
            style={{ position: "fixed", left: 12, top: "50%", transform: "translateY(-50%)", zIndex: 99998 }}
            className="bg-white/90 text-black rounded-full p-3 shadow-lg hover:scale-105 transform transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => lightboxChange((lbBottomIndex + 1) % images.length)}
            aria-label="Következő"
            style={{ position: "fixed", right: 12, top: "50%", transform: "translateY(-50%)", zIndex: 99998 }}
            className="bg-white/90 text-black rounded-full p-3 shadow-lg hover:scale-105 transform transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      <ErrorToast toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default Room;
