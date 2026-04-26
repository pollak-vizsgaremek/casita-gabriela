import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import Sidebar from "../components/Sidebar";
import Toast, { useToast } from "../components/Toast";
import api from "../services/api";

export default function UserBooking() {
	const CONFIRM_ANIMATION_MS = 220;
	const DAY_MS = 24 * 60 * 60 * 1000;
	const REJECTED_TRASH_KEY = "userPanelRejectedBookingTrash";
	const location = useLocation();
	const [bookings, setBookings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [canceling, setCanceling] = useState(null);
	const [trashedRejectedBookings, setTrashedRejectedBookings] = useState(() => {
		try {
			const raw = localStorage.getItem(REJECTED_TRASH_KEY);
			if (!raw) return [];
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	});
	const [confirmMounted, setConfirmMounted] = useState(false);
	const [confirmVisible, setConfirmVisible] = useState(false);
	const closeConfirmTimeoutRef = useRef(null);
	const openConfirmRafRef = useRef(null);
	const [confirmDialog, setConfirmDialog] = useState({
		open: false,
		title: "",
		message: "",
		confirmLabel: "Megerősítés",
		cancelLabel: "Mégse",
		showCancel: true,
		variant: "danger",
		onConfirm: null,
	});
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const { toasts, pushToast, removeToast } = useToast();

	useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

	useEffect(() => {
		return () => {
			if (closeConfirmTimeoutRef.current) clearTimeout(closeConfirmTimeoutRef.current);
			if (openConfirmRafRef.current) cancelAnimationFrame(openConfirmRafRef.current);
		};
	}, []);

	useEffect(() => {
		api.get("/user/bookings")
			.then(res => {
				setBookings(res.data);
				setLoading(false);
			})
			.catch(() => {
				setError("Nem sikerült betölteni a foglalásokat.");
				setLoading(false);
			});
	}, []);

	useEffect(() => {
		try {
			localStorage.setItem(REJECTED_TRASH_KEY, JSON.stringify(trashedRejectedBookings));
		} catch {
			// ignore storage errors
		}
	}, [trashedRejectedBookings]);

	const handleCancel = async (id) => {
		setCanceling(id);
		try {
			await api.delete(`/user/bookings/${id}`);
			setBookings(prev => prev.filter(b => b.id !== id));
			pushToast("Foglalás lemondva", "A foglalás sikeresen törölve.", "success");
		} catch {
			pushToast("Hiba", "Nem sikerült törölni a foglalást.", "error");
		}
		setCanceling(null);
	};

	const openConfirm = ({ title, message, confirmLabel = "Megerősítés", cancelLabel = "Mégse", showCancel = true, variant = "danger", onConfirm }) => {
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
			cancelLabel,
			showCancel,
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
				title: "",
				message: "",
				confirmLabel: "Megerősítés",
				cancelLabel: "Mégse",
				showCancel: true,
				variant: "danger",
				onConfirm: null,
			});
			closeConfirmTimeoutRef.current = null;
		}, CONFIRM_ANIMATION_MS);
	};

	const handleConfirm = () => {
		const callback = confirmDialog.onConfirm;
		closeConfirm();
		if (typeof callback === "function") callback();
	};

	const toStartOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

	const parseBookingDate = (value) => {
		if (!value) return null;
		if (value instanceof Date && !Number.isNaN(value.getTime())) return toStartOfDay(value);
		if (typeof value === "string") {
			const datePart = value.includes("T") ? value.split("T")[0] : value;
			const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
			if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
		}
		const parsed = new Date(value);
		if (Number.isNaN(parsed.getTime())) return null;
		return toStartOfDay(parsed);
	};

	const isRejectedStatus = (status) => {
		const normalized = (status || "").toString().toLowerCase();
		return normalized.includes("rejected") || normalized.includes("elutas");
	};

	const isApprovedStatus = (status) => {
		const normalized = (status || "").toString().toLowerCase();
		return normalized.includes("approved") || normalized.includes("jóvá") || normalized.includes("elfog");
	};

	const getStatusLabelHu = (status) => {
		const normalized = (status || "").toString().toLowerCase();
		if (normalized.includes("pend") || normalized.includes("függ")) return "Függőben";
		if (normalized.includes("approved") || normalized.includes("jóvá") || normalized.includes("elfog")) return "Jóváhagyva";
		if (normalized.includes("rejected") || normalized.includes("elutas")) return "Elutasítva";
		if (normalized.includes("cancel") || normalized.includes("lemond")) return "Lemondva";
		if (normalized.includes("complete") || normalized.includes("completed") || normalized.includes("lezár")) return "Lezárt";
		return status || "-";
	};

	const getBookingPhase = (booking, today) => {
		const start = parseBookingDate(booking.startDate);
		const end = parseBookingDate(booking.endDate);

		if (end && end < today) return "past";
		if (start && start > today) return "future";
		if (start && end && today >= start && today <= end) return "active";
		if (start && today >= start) return "active";
		return "future";
	};

	const requestCancelBooking = (booking) => {
		if (isRejectedStatus(booking.status)) {
			openConfirm({
				title: "Foglalás elutasítva",
				message: "Ezt a foglalást a szállásadó elutasította, ezért sajnáljuk a kellemetlenséget. A törlés gombra kattintva eltávolítjuk a foglalást a listából.",
				confirmLabel: "Rendben, törlés",
				showCancel: false,
				variant: "danger",
				onConfirm: async () => {
					setCanceling(booking.id);
					try {
						await api.delete(`/user/bookings/${booking.id}`);
						setBookings(prev => prev.filter(b => b.id !== booking.id));
						setTrashedRejectedBookings(prev => {
							const exists = prev.some((b) => b.id === booking.id);
							if (exists) return prev;
							return [{ ...booking, trashedAt: new Date().toISOString() }, ...prev];
						});
						pushToast("Foglalás törölve", "Az elutasított foglalás átkerült a törölt elutasított foglalások listájába.", "success");
					} catch {
						pushToast("Hiba", "Nem sikerült törölni az elutasított foglalást.", "error");
					}
					setCanceling(null);
				},
			});
			return;
		}

		const today = toStartOfDay(new Date());
		const phase = getBookingPhase(booking, today);
		if (phase === "past") return;

		const start = parseBookingDate(booking.startDate);
		const daysUntilStart = start ? Math.ceil((start.getTime() - today.getTime()) / DAY_MS) : null;

		let message = "Biztosan le szeretnéd mondani ezt a foglalást?";
		if (phase === "active") {
			message = "Biztosan le szeretnéd mondani ezt a foglalást? A foglalás már aktív, ezért visszatérítés nem lehetséges.";
		} else if (daysUntilStart !== null && daysUntilStart < 14) {
			message = "Biztosan le szeretnéd mondani ezt a foglalást? Már kevesebb mint 2 hét van hátra, ezért visszatérítés nem lehetséges.";
		}

		openConfirm({
			title: "Foglalás lemondása",
			message,
			confirmLabel: "Lemondás",
			variant: "danger",
			onConfirm: () => handleCancel(booking.id),
		});
	};

	const today = toStartOfDay(new Date());
	const trashedRejectedIds = new Set(trashedRejectedBookings.map((b) => b.id));
	const bookingsWithPhase = bookings
		.filter((b) => !trashedRejectedIds.has(b.id))
		.map((b) => ({ ...b, phase: getBookingPhase(b, today), isRejected: isRejectedStatus(b.status) }));
	const futureBookings = bookingsWithPhase
		.filter((b) => b.phase === "future")
		.sort((a, b) => (parseBookingDate(a.startDate)?.getTime() || 0) - (parseBookingDate(b.startDate)?.getTime() || 0));
	const activeBookings = bookingsWithPhase
		.filter((b) => b.phase === "active")
		.sort((a, b) => (parseBookingDate(a.startDate)?.getTime() || 0) - (parseBookingDate(b.startDate)?.getTime() || 0));
	const pastBookings = bookingsWithPhase
		.filter((b) => b.phase === "past")
		.sort((a, b) => (parseBookingDate(b.endDate)?.getTime() || 0) - (parseBookingDate(a.endDate)?.getTime() || 0));
	const trashedRejectedList = [...trashedRejectedBookings]
		.sort((a, b) => (new Date(b.trashedAt || 0).getTime() || 0) - (new Date(a.trashedAt || 0).getTime() || 0));

	const getDisplayedStatus = (b) => {
		if (b.phase === "active") return "Aktív";
		return getStatusLabelHu(b.status);
	};

	const getCardClass = (b) => {
		if (b.isRejected) return "bg-red-50/60 border-red-200";
		if (b.phase === "past") return "bg-gray-100 border-gray-300";
		if (b.phase !== "active" && isApprovedStatus(b.status)) return "bg-emerald-50/70 border-emerald-200";
		return "bg-white border-gray-200";
	};

	const renderBookingCard = (b, { canCancel, canDeleteRejected = true }) => (
		<div key={b.id} className={`${getCardClass(b)} border rounded-xl shadow-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between`}>
			<div className="text-gray-800 space-y-1">
				<div><b>Szoba:</b> {b.roomName}</div>
				<div><b>Érkezés:</b> {b.startDate}</div>
				<div><b>Távozás:</b> {b.endDate}</div>
				<div><b>Vendégek:</b> {b.guests}</div>
				<div><b>Státusz:</b> {getDisplayedStatus(b)}</div>
				{b.isRejected && <div className="text-sm text-red-700">A foglalást a szállásadó elutasította.</div>}
			</div>
			{b.isRejected && canDeleteRejected ? (
				<button
					className="mt-3 md:mt-0 bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 px-4 py-2 rounded-lg disabled:opacity-50"
					onClick={() => requestCancelBooking(b)}
					disabled={canceling === b.id}
				>
					{canceling === b.id ? "Törlés..." : "Foglalás törlése"}
				</button>
			) : canCancel ? (
				<button
					className="mt-3 md:mt-0 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg disabled:opacity-50"
					onClick={() => requestCancelBooking(b)}
					disabled={canceling === b.id}
				>
					{canceling === b.id ? "Lemondás..." : "Foglalás lemondása"}
				</button>
			) : (
				<div className="mt-3 md:mt-0 text-sm text-gray-500">Lezárt foglalás</div>
			)}
		</div>
	);

	return (
		<div className="flex min-h-screen w-dvw bg-[#f7faf7]">
			<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userPanel />

			<div className="flex-1 ml-0 md:ml-64">
				{/* MOBILE HEADER */}
				<header className="flex items-center justify-between px-5 py-4 border-b bg-white md:hidden">
					<button onClick={() => setSidebarOpen(s => !s)} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200" aria-label="Menü">
						<svg className="h-6 w-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
					</button>
					<div className="text-lg font-semibold">Foglalásaim</div>
					<div style={{ width: 36 }} />
				</header>

				<main className="px-5 pt-5">
					<h2 className="text-2xl font-semibold mb-4 text-gray-900">Foglalásaim</h2>
					{loading ? (
						<div className="text-gray-700">Betöltés...</div>
					) : error ? (
						<div className="text-red-500">{error}</div>
					) : bookings.length === 0 ? (
						<div className="text-gray-700">Nincs egyetlen foglalás sem.</div>
					) : (
						<div className="space-y-8">
							<section>
								<h3 className="text-lg font-semibold text-gray-900 mb-3">Jövőbeli foglalások</h3>
								{futureBookings.length === 0 ? (
									<div className="text-gray-600">Nincs jövőbeli foglalás.</div>
								) : (
									<div className="space-y-4">
										{futureBookings.map(b => renderBookingCard(b, { canCancel: true }))}
									</div>
								)}
							</section>

							<section>
								<h3 className="text-lg font-semibold text-gray-900 mb-3">Aktív foglalások</h3>
								{activeBookings.length === 0 ? (
									<div className="text-gray-600">Nincs aktív foglalás.</div>
								) : (
									<div className="space-y-4">
										{activeBookings.map(b => renderBookingCard(b, { canCancel: true }))}
									</div>
								)}
							</section>

							<section>
								<h3 className="text-lg font-semibold text-gray-900 mb-3">Törölt elutasított foglalások</h3>
								{trashedRejectedList.length === 0 ? (
									<div className="text-gray-600">Nincs törölt elutasított foglalás.</div>
								) : (
									<div className="space-y-4">
										{trashedRejectedList.map(b => renderBookingCard({ ...b, isRejected: true }, { canCancel: false, canDeleteRejected: false }))}
									</div>
								)}
							</section>

							<section>
								<h3 className="text-lg font-semibold text-gray-900 mb-3">Korábbi foglalások</h3>
								{pastBookings.length === 0 ? (
									<div className="text-gray-600">Nincs korábbi foglalás.</div>
								) : (
									<div className="space-y-4">
										{pastBookings.map(b => renderBookingCard(b, { canCancel: false }))}
									</div>
								)}
							</section>
						</div>
					)}
				</main>
			</div>

			{confirmMounted && (
				<div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 backdrop-blur-[1px] transition-opacity duration-200 ${confirmVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
					<div className={`w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 transition-all duration-200 ${confirmVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"}`}>
						<div className="p-5">
							<h3 className="text-lg font-semibold text-gray-900">{confirmDialog.title}</h3>
							<p className="mt-2 text-sm text-gray-700">{confirmDialog.message}</p>
						</div>
						<div className="px-5 pb-5 flex justify-end gap-2">
							{confirmDialog.showCancel && (
								<button
									onClick={closeConfirm}
									className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
								>
									{confirmDialog.cancelLabel}
								</button>
							)}
							<button
								onClick={handleConfirm}
								className={`px-3 py-2 rounded-md border transition-colors ${confirmDialog.variant === "danger" ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" : "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"}`}
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
}
