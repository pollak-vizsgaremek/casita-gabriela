import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import Sidebar from "../components/Sidebar";
import Toast, { useToast } from "../components/Toast";
import api from "../services/api";

export default function UserReviews() {
	const CONFIRM_ANIMATION_MS = 220;
	const location = useLocation();
	const [reviews, setReviews] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [deleting, setDeleting] = useState(null);
	const [confirmMounted, setConfirmMounted] = useState(false);
	const [confirmVisible, setConfirmVisible] = useState(false);
	const closeConfirmTimeoutRef = useRef(null);
	const openConfirmRafRef = useRef(null);
	const [confirmDialog, setConfirmDialog] = useState({
		open: false,
		title: "",
		message: "",
		confirmLabel: "Megerősítés",
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
		api.get("/user/reviews")
			.then(res => {
				setReviews(res.data);
				setLoading(false);
			})
			.catch(() => {
				setError("Nem sikerült betölteni az értékeléseket.");
				setLoading(false);
			});
	}, []);

	const handleDelete = async (id) => {
		setDeleting(id);
		try {
			await api.delete(`/user/reviews/${id}`);
			setReviews(prev => prev.filter(r => r.id !== id));
			pushToast("Értékelés törölve", "Az értékelés sikeresen törölve.", "success");
		} catch {
			pushToast("Hiba", "Nem sikerült törölni az értékelést.", "error");
		}
		setDeleting(null);
	};

	const openConfirm = ({ title, message, confirmLabel = "Megerősítés", variant = "danger", onConfirm }) => {
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
				title: "",
				message: "",
				confirmLabel: "Megerősítés",
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

	const requestDeleteReview = (reviewId) => {
		openConfirm({
			title: "Értékelés törlése",
			message: "Biztosan törölni szeretnéd ezt az értékelést?",
			confirmLabel: "Törlés",
			variant: "danger",
			onConfirm: () => handleDelete(reviewId),
		});
	};

	return (
		<div className="flex min-h-screen w-dvw bg-[#f7faf7]">
			<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userPanel />

			<div className="flex-1 ml-0 md:ml-64">
				<main className="px-4 sm:px-6 pt-54 md:pt-5 pb-10">
					<div className="w-full max-w-5xl">
					<h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-900">Értékeléseim</h2>
					{loading ? (
						<div className="text-gray-700">Betöltés...</div>
					) : error ? (
						<div className="text-red-500">{error}</div>
					) : reviews.length === 0 ? (
						<div className="text-gray-700">Nincs egyetlen értékelés sem.</div>
					) : (
						<div className="space-y-4">
							{reviews.map(r => (
						<div key={r.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
								<div className="min-w-0 flex-1 text-gray-800">
									<div><b>Szoba:</b> {r.roomName}</div>
									<div className="flex items-center gap-3 mt-1">
										<div className="text-yellow-500 font-bold">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
										<div className="text-sm text-gray-600">{r.rating}/5</div>
									</div>
									<div><b>Szöveg:</b> <p className="mt-1 text-gray-800 wrap-anywhere whitespace-pre-wrap">{r.text}</p></div>
									<div><b>Dátum:</b> {r.date || "Nincs adat"}</div>
								</div>
								<button
									className="w-full sm:w-auto mt-1 sm:mt-0 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg sm:ml-4 shrink-0 self-start disabled:opacity-50"
									onClick={() => requestDeleteReview(r.id)}
									disabled={deleting === r.id}
								>
									{deleting === r.id ? "Törlés..." : "Értékelés törlése"}
								</button>
								</div>
							))}
						</div>
					)}
					</div>
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
							<button
								onClick={closeConfirm}
								className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
							>
								Mégse
							</button>
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
