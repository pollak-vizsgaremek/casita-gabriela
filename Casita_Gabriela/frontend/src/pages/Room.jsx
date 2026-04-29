// src/pages/Room.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import axios from "axios";
import Footer from "../components/Footer";
import { toRoomSlug } from "../utils/roomSlug";

const BACKEND_BASE = "http://localhost:6969";
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const BOOKING_DRAFT_KEY_PREFIX = "room_booking_draft_";

const getBookingDraftKey = (roomId) => `${BOOKING_DRAFT_KEY_PREFIX}${roomId}`;

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

const normalizeBookingStatus = (status) => {
  if (!status) return null;
  const st = status.toString().toLowerCase();

  if (st.includes("approved") || st.includes("accept") || st.includes("confirmed") || st.includes("complete")) {
    return "approved";
  }
  if (st.includes("pend")) return "pending";
  if (st.includes("reject") || st.includes("declin") || st.includes("denied") || st.includes("elutas")) {
    return "rejected";
  }

  return "other";
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
            <div className="shrink-0">
              {t.status === 'success' ? (
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12A9 9 0 1112 3a9 9 0 019 9z" />
                </svg>
              )}
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
  const startWeekday = (start.getDay() + 6) % 7;
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
  const { roomRef } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [room, setRoom] = useState(null);
  const [resolvedRoomId, setResolvedRoomId] = useState(null);
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

  // Lightbox állapot: nagyított kép megjelenítés vezérlése
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
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const bookingInFlightRef = useRef(false);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [bookingDraftHydrated, setBookingDraftHydrated] = useState(false);
  const isLoggedIn = !!localStorage.getItem("token");
  const currentUserId = localStorage.getItem("user_id") ? Number(localStorage.getItem("user_id")) : null;
  const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(currentUser?.isFirstTimeUser === true);
  const animTimeoutRef = useRef(null);
  const mountedRef = useRef(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSliderIndex, setReviewSliderIndex] = useState(0);
  const [expandedReviews, setExpandedReviews] = useState({});
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewValidationErrors, setReviewValidationErrors] = useState({ stars: "", comment: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewStarFilter, setReviewStarFilter] = useState(0);
  const genErrorCode = (prefix) => `${prefix}_${Date.now().toString(36).slice(-6)}`;

  useEffect(() => {
    const maxIndex = Math.max(0, (room?.reviews || []).length - 3);
    setReviewSliderIndex((prev) => Math.min(prev, maxIndex));
  }, [room?.reviews?.length]);

  useEffect(() => {
    if (room?.name) {
      document.title = `${room.name} - Casita Gabriela`;
    } else {
      document.title = "Szoba - Casita Gabriela";
    }
    return () => {
      document.title = "Casita Gabriela";
    };
  }, [room?.name]);

  useEffect(() => {
    mountedRef.current = true;
    fetchRoom();
    const t = setTimeout(() => setPageLoaded(true), 80);
    return () => {
      mountedRef.current = false;
      clearTimeout(t);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomRef]);

  useEffect(() => {
    if (!resolvedRoomId) {
      setBookings([]);
      return;
    }

    fetchBookings(resolvedRoomId);
    const interval = setInterval(() => fetchBookings(resolvedRoomId), 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedRoomId]);

  const bookingKeyId = resolvedRoomId ?? roomRef;
  const bookingDraftKey = useMemo(() => getBookingDraftKey(bookingKeyId), [bookingKeyId]);

  const persistBookingDraft = useCallback(() => {
    if (!bookingKeyId) return;
    const hasDraft = !!(checkIn || checkOut || guests !== 1 || acceptedAszf || acceptedAdat);
    if (!hasDraft) {
      localStorage.removeItem(bookingDraftKey);
      return;
    }
    const monthStartIso = isoFromDate(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1));
    localStorage.setItem(
      bookingDraftKey,
      JSON.stringify({
        checkIn,
        checkOut,
        guests,
        acceptedAszf,
        acceptedAdat,
        visibleMonth: monthStartIso,
        updatedAt: new Date().toISOString(),
      })
    );
  }, [bookingKeyId, bookingDraftKey, checkIn, checkOut, guests, acceptedAszf, acceptedAdat, visibleMonth]);

  useEffect(() => {
    if (!bookingKeyId) {
      setBookingDraftHydrated(true);
      return;
    }
    try {
      const raw = localStorage.getItem(bookingDraftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if (typeof draft?.checkIn === "string") setCheckIn(draft.checkIn);
        if (typeof draft?.checkOut === "string") setCheckOut(draft.checkOut);
        if (typeof draft?.guests === "number" && Number.isFinite(draft.guests)) {
          setGuests(Math.max(1, Math.floor(draft.guests)));
        }
        setAcceptedAszf(Boolean(draft?.acceptedAszf));
        setAcceptedAdat(Boolean(draft?.acceptedAdat));
        const monthDate = parseISOToLocalDate(draft?.visibleMonth);
        if (monthDate) setVisibleMonth(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1));
      }
    } catch (err) {
      console.debug("Could not restore booking draft:", err);
    } finally {
      setBookingDraftHydrated(true);
    }
  }, [bookingKeyId, bookingDraftKey]);

  useEffect(() => {
    if (!bookingDraftHydrated) return;
    persistBookingDraft();
  }, [bookingDraftHydrated, persistBookingDraft]);

  useEffect(() => {
    if (!room?.space) return;
    setGuests((prev) => Math.min(Math.max(1, Number(prev) || 1), room.space));
  }, [room?.space]);

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

      const isNumericRef = /^\d+$/.test(String(roomRef || ""));
      let data = null;

      if (isNumericRef) {
        const res = await axios.get(`${BACKEND_BASE}/rooms/${roomRef}`);
        data = res.data;
      } else {
        const res = await axios.get(`${BACKEND_BASE}/rooms`);
        const rooms = Array.isArray(res.data) ? res.data : [];
        data = rooms.find((r) => toRoomSlug(r?.name) === String(roomRef || "").toLowerCase());
      }

      if (!data) {
        if (mountedRef.current) {
          setRoom(null);
          setResolvedRoomId(null);
          setBookings([]);
        }
        setInitialImageLoaded(true);
        return;
      }

      const roomData = {
        ...data,
        images: Array.isArray(data.images) ? data.images : data.images ? [data.images] : ["/blob.png"],
        space: data.space ?? 1,
        reviews: data.reviews || [],
      };
      if (!mountedRef.current) return;
      setRoom(roomData);
      setResolvedRoomId(roomData.id);
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
      if (mountedRef.current) {
        setRoom(null);
        setResolvedRoomId(null);
      }
      setInitialImageLoaded(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const fetchBookings = async (roomId) => {
    const ERR = genErrorCode("ERR_BOOKINGS_FETCH");
    if (!roomId) {
      setBookings([]);
      return;
    }

    try {
      const res = await axios.get(`${BACKEND_BASE}/booking?room_id=${roomId}`);
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

  // Képváltás és lightbox segédfüggvények következnek
  // (changeImage, onTopLoaded, lightboxChange, open/close, stb.)

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

  // Naptár térkép összeállítása (fél-napos színezéshez)
  const calendarMap = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      const status = normalizeBookingStatus(b.status);
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
      const status = normalizeBookingStatus(b.status);
      if (status === "approved") blocked = true;
      else if (status === "pending") pending = true;
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

  // Árak és kedvezmények kiszámítása az űrlap adatai alapján

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

  const hasBooked = useMemo(() => {
    if (!currentUserId) return false;
    try {
      return bookings.some((b) => {
        const uid = b.user_id ?? b.userId ?? (b.user && b.user.id) ?? null;
        if (!uid) return false;
        if (Number(uid) !== Number(currentUserId)) return false;
        const status = (b.status || '').toString().toLowerCase();
        if (status.includes('approved') || status.includes('complete') || status.includes('completed')) return true;
        // Elfogadottnak számít, ha a foglalás már lejárt (távozás múlt)
        if (b.departure_date) {
          const dep = parseISOToLocalDate(b.departure_date);
          if (dep && dateToDayNumber(dep) <= dateToDayNumber(today)) return true;
        }
        return false;
      });
    } catch (e) {
      return false;
    }
  }, [bookings, currentUserId, today]);

  const alreadyReviewed = useMemo(() => {
    if (!currentUserId) return false;
    const revs = room?.reviews || [];
    return revs.some((r) => {
      const uid = r.user_id ?? r.userId ?? (r.user && r.user.id) ?? null;
      return uid != null && Number(uid) === Number(currentUserId);
    });
  }, [room, currentUserId]);

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
    if (bookingInFlightRef.current) return;

    if (!isLoggedIn) {
      persistBookingDraft();
      navigate("/login", { state: { from: `${location.pathname}${location.search}` } });
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

    bookingInFlightRef.current = true;
    setBookingSubmitting(true);

    try {
    const targetRoomId = Number(resolvedRoomId || room?.id);
    if (!targetRoomId) {
      pushToast("Foglalás hiba", "Nem található a szoba azonosítója.");
      return;
    }

    const payload = {
      arrival_date: checkIn,
      departure_date: checkOut,
      people: guests,
      booking_date: new Date(),
      status: "pending",
      user_id: currentUserId || null,
      room_id: targetRoomId,
    };
    const endpoints = ["/booking", "/bookings"];
    let lastError = null;
    for (const ep of endpoints) {
      const ERR_POST = genErrorCode("ERR_BOOKING_POST");
      try {
        const url = `${BACKEND_BASE}${ep}`;
            const res = await axios.post(url, payload, { headers: { "Content-Type": "application/json" } });
            // Sikeres foglalás után a felhasználó már nem számít első alkalmasnak, így a kedvezmény nem érvényes
            try {
              if (currentUser) {
                const updated = { ...currentUser, isFirstTimeUser: false };
                localStorage.setItem('user', JSON.stringify(updated));
                setIsFirstTimeUser(false);
                window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: updated, token: localStorage.getItem('token') } }));
              }
            } catch (e) {
              console.debug('Updating local first-time flag failed', e);
            }
        localStorage.removeItem(bookingDraftKey);
        // A létrehozott foglalást továbbadjuk a sikeroldalnak (id és összeg megjelenítésére)
        navigate('/booking-success', { state: { bookingData: res?.data?.booking ?? res?.data } });
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
    } finally {
      bookingInFlightRef.current = false;
      if (mountedRef.current) setBookingSubmitting(false);
    }
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

  const validateReviewForm = () => {
    const errors = { stars: "", comment: "" };

    if (!reviewStars || reviewStars < 1) {
      errors.stars = "Kérlek adj meg csillagos értékelést (1-5).";
    }
    if (!reviewComment.trim()) {
      errors.comment = "Kérlek írj rövid véleményt is a közzétételhez.";
    }

    setReviewValidationErrors(errors);

    if (errors.stars && errors.comment) {
      pushToast("Hiányzó adatok", "Kérlek válassz csillagokat és írj véleményt is közzététel előtt.");
      return false;
    }
    if (errors.stars) {
      pushToast("Hiányzó értékelés", "Kérlek válassz 1-5 csillagot a vélemény közzétételéhez.");
      return false;
    }
    if (errors.comment) {
      pushToast("Hiányzó szöveg", "Kérlek írj véleményt is a közzététel előtt.");
      return false;
    }

    return true;
  };

  const submitReview = async () => {
    if (!validateReviewForm()) return;

    try {
      setReviewSubmitting(true);
      const res = await axios.post(`${BACKEND_BASE}/room_reviews`, {
        room_id: room.id,
        stars: reviewStars,
        comment: reviewComment.trim(),
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setReviewComment('');
      setReviewStars(0);
      setReviewValidationErrors({ stars: "", comment: "" });
      setShowReviewForm(false);
      pushToast('Köszönjük', 'Véleményed rögzítve lett.', 'success');
      if (res.data && res.data.review && room) {
        setRoom((prevRoom) => ({
          ...prevRoom,
          reviews: [res.data.review, ...(prevRoom.reviews || [])]
        }));
      }
    } catch (err) {
      console.error('POST review error', err);
      pushToast('Hiba', 'Nem sikerült rögzíteni a véleményt.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Vélemény beküldés logika: POST kérés, helyi állapot frissítése és toast

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
  const allReviews = room?.reviews || [];
  const filteredReviews = reviewStarFilter === 0
    ? allReviews
    : allReviews.filter((review) => Number(review?.stars || 0) === reviewStarFilter);
  const isReviewFilterActive = reviewStarFilter !== 0;
  const averageReviewScore = allReviews.length
    ? Math.round((allReviews.reduce((sum, review) => sum + Number(review?.stars || 0), 0) / allReviews.length) * 10) / 10
    : 0;

  // Foglalás csak akkor engedélyezett, ha dátumok ki vannak választva és a checkboxok elfogadva
  const canBook = !!(checkIn && checkOut && acceptedAszf && acceptedAdat);
  const bookingButtonEnabled = !bookingSubmitting && (isLoggedIn ? canBook : true);
  const bookingButtonLabel = bookingSubmitting
    ? "Foglalás küldése..."
    : (isLoggedIn ? "Foglalás leadása" : "Jelentkezz be a foglaláshoz");

  return (
    <>
      <div
        className={`flex flex-col min-h-screen w-dvw bg-[#0b1f13] text-[#F1FBF4] layerAdmin transition-all duration-500 ${pageLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'cover', backgroundAttachment: 'fixed' }}
      >
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            <div className="lg:col-span-2 flex flex-col gap-5 sm:gap-6">
              <div className={`bg-[#FFFECE] text-black rounded-2xl border border-[#efe9b6] px-4 sm:px-5 py-3.5 sm:py-4 shadow-lg/20 transform transition-all duration-500 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <h1 className="text-2xl sm:text-3xl font-mono tracking-wide text-black m-0 mb-1">{room.name}</h1>
                <p className="text-xs sm:text-sm text-gray-600 mb-3">{room.category}</p>
                {room.reviews && room.reviews.length ? (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="text-yellow-500">
                      {(() => {
                        const reviews = room.reviews || [];
                        const avgRounded = Math.round(reviews.reduce((s, r) => s + (r.stars || 0), 0) / reviews.length);
                        return "★".repeat(avgRounded) + "☆".repeat(5 - avgRounded)
                      })()}
                    </div>
                    <div className="font-medium bg-white/90 text-gray-800 px-2 py-0.5 rounded">{(Math.round((room.reviews.reduce((s, r) => s + (r.stars || 0), 0) / room.reviews.length) * 10) / 10)}/5</div>
                    <div className="text-gray-600">({room.reviews.length} vélemény)</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Nincsenek vélemények</div>
                )}
              </div>
              {/* Képgaléria: nagy kép és overlay gombok */}
              <div className={`w-full bg-[#FFFECE] rounded-2xl border border-[#efe9b6] overflow-hidden shadow-lg/20 relative transform transition-all duration-600 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                <div
                  ref={imageContainerRef}
                  className="relative w-full h-72 sm:h-96 bg-[#f6f6f6] flex items-center justify-center touch-none"
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
                      className="bg-white/95 text-black rounded-full p-2.5 shadow-md hover:shadow-lg hover:scale-105 transform transition"
                      title="Nagyítás"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 3H5a2 2 0 00-2 2v3m0 8v3a2 2 0 002 2h3m8-16h3a2 2 0 012 2v3M16 21h3a2 2 0 002-2v-3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2.5 sm:gap-3 flex-wrap justify-center sm:justify-start">
                {images.map((img, index) => {
                  const active = index === activeThumbIndex;
                  const delay = `${index * 40}ms`;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => { changeImage(index); setActiveThumbIndex(index); }}
                      onDoubleClick={() => openLightbox(index)}
                      className={`w-20 h-16 rounded-lg overflow-hidden border transform transition-all duration-200 ${active ? "border-[#6FD98C] shadow-md" : "border-transparent hover:border-[#b9c8bf]"}`}
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
              <div className={`bg-[#FFFECE] text-black rounded-2xl border border-[#efe9b6] p-4 sm:p-5 shadow-lg/20 transform transition-all duration-500 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} style={{ transitionDelay: pageLoaded ? '160ms' : '0ms' }}>
                <h2 className="font-semibold text-lg mb-2">Leírás</h2>
                <p className="text-sm leading-relaxed text-gray-800">{room.description}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-sm border border-[#e7e7d8]">
                  <span className="font-medium text-gray-700">Klíma:</span>
                  <span className={`${Number(room.ac_availablity) > 0 ? 'text-green-700' : 'text-red-600'} font-semibold`}>
                    {Number(room.ac_availablity) > 0 ? 'Elérhető' : 'Nem elérhető'}
                  </span>
                </div>
              </div>
              <div className={`hidden lg:flex bg-[#FFFECE] text-black rounded-2xl border border-[#efe9b6] p-4 sm:p-5 shadow-lg/20 flex-col gap-4 transform transition-all duration-500 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} style={{ transitionDelay: pageLoaded ? '200ms' : '0ms' }}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-lg">Vélemények</h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-[#e7e7d8] px-2.5 py-1 text-xs font-semibold text-gray-800">
                        <span className="text-yellow-500">★</span>
                        <span>{averageReviewScore}/5</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewStarFilter(0)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${reviewStarFilter === 0 ? 'bg-[#6FD98C] text-white border-[#6FD98C]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                      >
                        <span>Összes </span>
                        <span className="text-gray-500">({allReviews.length})</span>
                      </button>
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = allReviews.filter((r) => Number(r?.stars || 0) === star).length;
                        return (
                          <button
                            key={`desktop-filter-${star}`}
                            type="button"
                            onClick={() => setReviewStarFilter(star)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${reviewStarFilter === star ? 'bg-[#6FD98C] text-white border-[#6FD98C]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                          >
                            <span>{star}</span>
                            <span className="text-yellow-500">★</span>
                            <span className="text-gray-500">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="w-full self-start">
                    {!showReviewForm ? (
                      <>
                        {!alreadyReviewed ? (
                          <>
                            {!isLoggedIn ? (
                              <button
                                type="button"
                                onClick={() => pushToast('Bejelentkezés szükséges', 'A vélemény írásáshoz be kell jelentkezned.')}
                                className="bg-[#6FD98C] text-white px-5 py-2 rounded-full hover:bg-[#5FCB80] transition-all duration-200 text-sm shadow-md hover:shadow-lg"
                              >
                                Vélemény írása
                              </button>
                            ) : !hasBooked ? (
                              <div className="flex flex-col items-start">
                                <button type="button" disabled className="bg-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm cursor-not-allowed">
                                  Vélemény írása
                                </button>
                                <div className="text-sm text-gray-500 mt-2">Előbb foglalj ennél a szobánál, hogy véleményt írj.</div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewStars(0);
                                  setReviewComment("");
                                  setReviewValidationErrors({ stars: "", comment: "" });
                                  setShowReviewForm(true);
                                }}
                                className="bg-[#6FD98C] text-white px-5 py-2 rounded-full hover:bg-[#5FCB80] transition-all duration-200 text-sm shadow-md hover:shadow-lg"
                              >
                                Vélemény írása
                              </button>
                            )}
                          </>
                        ) : (
                          <button type="button" disabled className="bg-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm cursor-not-allowed">
                            Már írtál véleményt
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col gap-2 bg-white rounded-lg p-4 border border-gray-200 mx-0">
                        <div className="flex items-center gap-2">
                          {[1,2,3,4,5].map((s) => {
                            const filled = reviewStars >= s;
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => {
                                  setReviewStars(s);
                                  setReviewValidationErrors((prev) => ({ ...prev, stars: "" }));
                                }}
                                aria-label={`${s} csillag`}
                                className={`text-3xl leading-none ${filled ? 'text-yellow-400' : 'text-gray-300'} focus:outline-none`}
                              >
                                {filled ? '★' : '☆'}
                              </button>
                            );
                          })}
                        </div>
                        {reviewValidationErrors.stars && (
                          <div className="text-xs text-red-600">{reviewValidationErrors.stars}</div>
                        )}
                        <textarea
                          value={reviewComment}
                          onChange={(e) => {
                            setReviewComment(e.target.value.slice(0, 200));
                            if (e.target.value.trim()) {
                              setReviewValidationErrors((prev) => ({ ...prev, comment: "" }));
                            }
                          }}
                          className="w-full p-3 rounded border border-gray-300 bg-white"
                          rows={5}
                          maxLength={200}
                          placeholder="Írd ide a véleményed (max 200 karakter)"
                        />
                        {reviewValidationErrors.comment && (
                          <div className="text-xs text-red-600">{reviewValidationErrors.comment}</div>
                        )}
                        <div className="text-xs text-gray-600 text-right">
                          {reviewComment.length}/200 karakter
                        </div>
                        <div className="flex gap-2 justify-start">
                          <button
                            type="button"
                            disabled={reviewSubmitting}
                            onClick={submitReview}
                            className="bg-blue-600 text-white px-4 py-2 rounded-full disabled:opacity-60 hover:bg-blue-700 transition-colors text-sm"
                          >
                            Küldés
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowReviewForm(false);
                              setReviewValidationErrors({ stars: "", comment: "" });
                            }}
                            className="bg-gray-200 text-black px-4 py-2 rounded-full hover:bg-gray-300 transition-colors text-sm"
                          >
                            Mégse
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {filteredReviews.length > 0 ? (
                  isReviewFilterActive ? (
                    <div className="flex flex-col gap-3">
                      {filteredReviews.map((review) => {
                        const isExpanded = !!expandedReviews[review.id];
                        const fullComment = review.comment || "";
                        const isLong = fullComment.length > 180;

                        return (
                          <article
                            key={`desktop-filtered-${review.id}`}
                            className="w-full bg-white rounded-xl border border-[#e7e7d8] p-4 shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            <div className="font-semibold text-gray-900 mb-2 text-sm">{review.user?.name || 'Névtelen'}</div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-yellow-500 text-lg">
                                {"★".repeat(review.stars)}
                                {"☆".repeat(5 - review.stars)}
                              </span>
                              <span className="text-xs text-gray-600 font-medium">{review.stars}/5</span>
                            </div>
                            <p className={`text-sm text-gray-700 leading-relaxed wrap-anywhere ${isLong && !isExpanded ? 'line-clamp-4' : ''}`}>
                              {fullComment}
                            </p>
                            {isLong && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedReviews((prev) => ({
                                    ...prev,
                                    [review.id]: !prev[review.id],
                                  }))
                                }
                                className="mt-2 self-start text-xs font-medium text-blue-700 hover:text-blue-900 underline"
                              >
                                {isExpanded ? 'Kevesebb' : 'Tovább olvasom'}
                              </button>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setReviewSliderIndex(Math.max(0, reviewSliderIndex - 1))}
                          disabled={reviewSliderIndex === 0 || allReviews.length <= 3}
                          className="h-10 w-10 shrink-0 rounded-full border border-gray-300 bg-white text-gray-700 flex items-center justify-center shadow-sm hover:shadow-md hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Előző vélemények"
                        >
                          <span className="text-lg leading-none">←</span>
                        </button>

                        <div className="relative overflow-hidden flex-1">
                          <div
                            className="flex gap-3 transition-transform duration-500 ease-out"
                            style={{
                              transform: `translateX(calc(-${reviewSliderIndex} * ((100% - 1.5rem) / 3 + 0.75rem)))`,
                            }}
                          >
                            {allReviews.map((review) => {
                              const isExpanded = !!expandedReviews[review.id];
                              const fullComment = review.comment || "";
                              const isLong = fullComment.length > 140;

                              return (
                                <div
                                  key={review.id}
                                  className={`shrink-0 w-[calc((100%-1.5rem)/3)] bg-white rounded-xl border border-[#e7e7d8] p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col ${isExpanded ? 'min-h-68 h-auto' : 'h-68'}`}
                                >
                                  <div className="font-semibold text-gray-900 mb-2 text-sm">{review.user?.name || 'Névtelen'}</div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-yellow-500 text-lg">
                                      {"★".repeat(review.stars)}
                                      {"☆".repeat(5 - review.stars)}
                                    </span>
                                    <span className="text-xs text-gray-600 font-medium">{review.stars}/5</span>
                                  </div>
                                  <p className={`text-sm text-gray-700 leading-relaxed wrap-anywhere overflow-hidden transition-[max-height] duration-300 ease-in-out ${isLong ? (isExpanded ? 'max-h-96' : 'max-h-18') : 'max-h-96'}`}>
                                    {fullComment}
                                  </p>
                                  {isLong && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedReviews((prev) => ({
                                          ...prev,
                                          [review.id]: !prev[review.id],
                                        }))
                                      }
                                      className="mt-2 self-start text-xs font-medium text-blue-700 hover:text-blue-900 underline"
                                    >
                                      {isExpanded ? 'Kevesebb' : 'Tovább olvasom'}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                          <button
                            type="button"
                            onClick={() => setReviewSliderIndex(Math.min(allReviews.length - 3, reviewSliderIndex + 1))}
                            disabled={reviewSliderIndex >= allReviews.length - 3 || allReviews.length <= 3}
                            className="h-10 w-10 shrink-0 rounded-full border border-gray-300 bg-white text-gray-700 flex items-center justify-center shadow-sm hover:shadow-md hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Következő vélemények"
                          >
                            <span className="text-lg leading-none">→</span>
                          </button>
                      </div>

                      {allReviews.length > 3 && (
                        <div className="text-xs text-gray-600 text-center">
                          {reviewSliderIndex + 1} / {Math.max(1, allReviews.length - 2)}
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="text-sm text-gray-500">Nincsenek vélemények</div>
                )}
              </div>
            </div>
            {/* Jobb oldali panel: foglalási kártya és kapcsolódó vezérlők */}
            <div className="flex flex-col gap-5 sm:gap-6 lg:sticky lg:top-24 lg:self-start">
              {/* Booking card */}
              <div className={`bg-[#FFFECE] text-black rounded-2xl border border-[#efe9b6] px-3 sm:px-4 py-1 shadow-lg/20 transform transition-all duration-500 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} style={{ transitionDelay: pageLoaded ? '220ms' : '0ms' }}>
                <h2 className="font-semibold text-lg">Foglalás</h2>
                <div className="mt-2">
                  <div className="flex gap-2 items-center mb-2">
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600">Érkezés</label>
                      <div className="text-sm font-medium">{checkIn || "-"}</div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-600">Távozás</label>
                      <div className="text-sm font-medium">{checkOut || "-"}</div>
                    </div>
                  </div>
                  <div className="mt-2 bg-white text-black rounded-xl border border-[#e7e7d8] shadow-sm p-2">
                    <div className="flex items-center justify-center mb-2">
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
                    <div className="mt-2 flex items-center">
                      <div className="flex-1 flex justify-start">
                        <button
                          type="button"
                          onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
                          className="px-3 py-2 border rounded-lg bg-white hover:bg-gray-50 transition text-sm"
                        >
                          Előző
                        </button>
                      </div>
                      <div className="flex-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
                          className="px-3 py-2 border rounded-lg bg-white hover:bg-gray-50 transition text-sm"
                        >
                          Következő
                        </button>
                      </div>
                      <div className="flex-1 flex justify-end">
                        <button
                          type="button"
                          onClick={clearSelection}
                          className="px-3 py-2 border rounded-lg bg-white hover:bg-gray-50 transition text-red-600 font-medium text-sm"
                        >
                          Törlés
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {currentRangeStatus.blocked && <p className="text-sm text-red-600 mt-2">A kiválasztott időszak átfed egy jóváhagyott foglalással.</p>}
                {currentRangeStatus.pending && !bookingSubmitting && <p className="text-sm text-yellow-600 mt-2">A kiválasztott időszakra már van függő foglalás.</p>}
                <div className="mt-2 flex items-center gap-2">
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

                <div className="mt-2 flex gap-2 items-center">
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

                <div className="mt-2">
                  <button
                    onClick={handleBooking}
                    disabled={!bookingButtonEnabled}
                    className={`w-full py-2 rounded-lg font-semibold transition ${
                      bookingButtonEnabled
                        ? "bg-[#6FD98C] text-white cursor-pointer hover:bg-[#5FCB80]"
                        : "bg-gray-400 text-white cursor-not-allowed"
                    }`}
                  >
                    {bookingButtonLabel}
                  </button>
                </div>
                {successMessage && (
                  <div className="mt-2 p-2 rounded-md bg-[#d4edda] border border-[#c3e6cb] text-[#155724] font-semibold text-sm">
                    ✔ {successMessage}
                  </div>
                )}
              </div>

              {/* Vélemények – mobil nézet */}
              <div className={`lg:hidden bg-[#FFFECE] text-black rounded-2xl border border-[#efe9b6] p-4 shadow-lg/20 flex flex-col gap-4 transform transition-all duration-500 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} style={{ transitionDelay: pageLoaded ? '240ms' : '0ms' }}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-lg">Vélemények</h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-[#e7e7d8] px-2.5 py-1 text-xs font-semibold text-gray-800">
                        <span className="text-yellow-500">★</span>
                        <span>{averageReviewScore}/5</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewStarFilter(0)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${reviewStarFilter === 0 ? 'bg-[#6FD98C] text-white border-[#6FD98C]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                      >
                        <span>Összes </span>
                        <span className="text-gray-500">({allReviews.length})</span>
                      </button>
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = allReviews.filter((r) => Number(r?.stars || 0) === star).length;
                        return (
                          <button
                            key={`mobile-filter-${star}`}
                            type="button"
                            onClick={() => setReviewStarFilter(star)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${reviewStarFilter === star ? 'bg-[#6FD98C] text-white border-[#6FD98C]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                          >
                            <span>{star}</span>
                            <span className="text-yellow-500">★</span>
                            <span className="text-gray-500">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="w-full self-start">
                    {!showReviewForm ? (
                      <>
                        {!alreadyReviewed ? (
                          <>
                            {!isLoggedIn ? (
                              <button
                                type="button"
                                onClick={() => pushToast('Bejelentkezés szükséges', 'A vélemény írásáshoz be kell jelentkezned.')}
                                className="bg-[#6FD98C] text-white px-5 py-2 rounded-full hover:bg-[#5FCB80] transition-all duration-200 text-sm shadow-md hover:shadow-lg"
                              >
                                Vélemény írása
                              </button>
                            ) : !hasBooked ? (
                              <div className="flex flex-col items-start">
                                <button type="button" disabled className="bg-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm cursor-not-allowed">
                                  Vélemény írása
                                </button>
                                <div className="text-sm text-gray-500 mt-2">Előbb foglalj ennél a szobánál, hogy véleményt írj.</div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewStars(0);
                                  setReviewComment("");
                                  setReviewValidationErrors({ stars: "", comment: "" });
                                  setShowReviewForm(true);
                                }}
                                className="bg-[#6FD98C] text-white px-5 py-2 rounded-full hover:bg-[#5FCB80] transition-all duration-200 text-sm shadow-md hover:shadow-lg"
                              >
                                Vélemény írása
                              </button>
                            )}
                          </>
                        ) : (
                          <button type="button" disabled className="bg-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm cursor-not-allowed">
                            Már írtál véleményt
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col gap-2 bg-white rounded-lg p-4 border border-gray-200 mx-0">
                        <div className="flex items-center gap-2">
                          {[1,2,3,4,5].map((s) => {
                            const filled = reviewStars >= s;
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => {
                                  setReviewStars(s);
                                  setReviewValidationErrors((prev) => ({ ...prev, stars: "" }));
                                }}
                                aria-label={`${s} csillag`}
                                className={`text-3xl leading-none ${filled ? 'text-yellow-400' : 'text-gray-300'} focus:outline-none`}
                              >
                                {filled ? '★' : '☆'}
                              </button>
                            );
                          })}
                        </div>
                        {reviewValidationErrors.stars && (
                          <div className="text-xs text-red-600">{reviewValidationErrors.stars}</div>
                        )}
                        <textarea
                          value={reviewComment}
                          onChange={(e) => {
                            setReviewComment(e.target.value.slice(0, 200));
                            if (e.target.value.trim()) {
                              setReviewValidationErrors((prev) => ({ ...prev, comment: "" }));
                            }
                          }}
                          className="w-full p-3 rounded border border-gray-300 bg-white"
                          rows={5}
                          maxLength={200}
                          placeholder="Írd ide a véleményed (max 200 karakter)"
                        />
                        {reviewValidationErrors.comment && (
                          <div className="text-xs text-red-600">{reviewValidationErrors.comment}</div>
                        )}
                        <div className="text-xs text-gray-600 text-right">
                          {reviewComment.length}/200 karakter
                        </div>
                        <div className="flex gap-2 justify-start">
                          <button
                            type="button"
                            disabled={reviewSubmitting}
                            onClick={submitReview}
                            className="bg-blue-600 text-white px-4 py-2 rounded-full disabled:opacity-60 hover:bg-blue-700 transition-colors text-sm"
                          >
                            Küldés
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowReviewForm(false);
                              setReviewValidationErrors({ stars: "", comment: "" });
                            }}
                            className="bg-gray-200 text-black px-4 py-2 rounded-full hover:bg-gray-300 transition-colors text-sm"
                          >
                            Mégse
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {filteredReviews.length > 0 ? (
                  isReviewFilterActive ? (
                    <div className="flex flex-col gap-3">
                      {filteredReviews.map((review) => {
                        const isExpanded = !!expandedReviews[review.id];
                        const fullComment = review.comment || "";
                        const isLong = fullComment.length > 160;

                        return (
                          <article
                            key={`mobile-filtered-${review.id}`}
                            className="bg-white rounded-xl border border-[#e7e7d8] p-4 shadow-sm transition-all duration-300 flex flex-col"
                          >
                            <div className="font-semibold text-gray-900 mb-2 text-sm">{review.user?.name || 'Névtelen'}</div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-yellow-500 text-lg">
                                {"★".repeat(review.stars)}
                                {"☆".repeat(5 - review.stars)}
                              </span>
                              <span className="text-xs text-gray-600 font-medium">{review.stars}/5</span>
                            </div>
                            <p className={`text-sm text-gray-700 leading-relaxed wrap-anywhere ${isLong && !isExpanded ? 'line-clamp-4' : ''}`}>
                              {fullComment}
                            </p>
                            {isLong && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedReviews((prev) => ({
                                    ...prev,
                                    [review.id]: !prev[review.id],
                                  }))
                                }
                                className="mt-2 self-start text-xs font-medium text-blue-700 hover:text-blue-900 underline"
                              >
                                {isExpanded ? 'Kevesebb' : 'Tovább olvasom'}
                              </button>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="relative -mx-4">
                      <div className="flex gap-4 overflow-x-auto px-[calc((100vw-16rem)/2)] pb-3 snap-x snap-mandatory scrollbar-hide">
                        {allReviews.map((review) => {
                        const isExpanded = !!expandedReviews[review.id];
                        const fullComment = review.comment || "";
                        const isLong = fullComment.length > 140;

                          return (
                            <article
                              key={review.id}
                              className="shrink-0 w-64 snap-center bg-white rounded-xl border border-[#e7e7d8] p-4 shadow-sm transition-all duration-300 flex flex-col"
                            >
                            <div className="font-semibold text-gray-900 mb-2 text-sm">{review.user?.name || 'Névtelen'}</div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-yellow-500 text-lg">
                                {"★".repeat(review.stars)}
                                {"☆".repeat(5 - review.stars)}
                              </span>
                              <span className="text-xs text-gray-600 font-medium">{review.stars}/5</span>
                            </div>
                            <p className={`text-sm text-gray-700 leading-relaxed wrap-anywhere overflow-hidden transition-[max-height] duration-300 ease-in-out ${isLong ? (isExpanded ? 'max-h-96' : 'max-h-24') : 'max-h-96'}`}>
                              {fullComment}
                            </p>
                            {isLong && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedReviews((prev) => ({
                                    ...prev,
                                    [review.id]: !prev[review.id],
                                  }))
                                }
                                className="mt-2 self-start text-xs font-medium text-blue-700 hover:text-blue-900 underline"
                              >
                                {isExpanded ? 'Kevesebb' : 'Tovább olvasom'}
                              </button>
                            )}
                            </article>
                          );
                        })}
                      </div>

                      <div className="pointer-events-none absolute left-0 top-0 bottom-3 w-8 bg-linear-to-r from-[#FFFECE] via-[#FFFECE]/80 to-transparent" />
                      <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-8 bg-linear-to-l from-[#FFFECE] via-[#FFFECE]/80 to-transparent" />
                    </div>
                  )
                ) : (
                  <div className="text-sm text-gray-500">Nincsenek vélemények</div>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* Lightbox: teljes képernyős modál - egyszerű teljes képernyős átfedés középre igazított képpel */}
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
