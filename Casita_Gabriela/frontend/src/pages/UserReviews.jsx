import React, { useEffect, useState } from "react";
import { useLocation } from "react-router";
import Sidebar from "../components/Sidebar";
import Toast, { useToast } from "../components/Toast";
import api from "../services/api";

export default function UserReviews() {
	const location = useLocation();
	const [reviews, setReviews] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [deleting, setDeleting] = useState(null);
	const [confirmId, setConfirmId] = useState(null);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const { toasts, pushToast, removeToast } = useToast();

	useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

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
			setReviews(reviews.filter(r => r.id !== id));
			pushToast("Értékelés törölve", "Az értékelés sikeresen törölve.", "success");
		} catch {
			pushToast("Hiba", "Nem sikerült törölni az értékelést.", "error");
		}
		setDeleting(null);
	};

	return (
		<div className="flex min-h-screen w-dvw bg-[#f7faf7]">
			<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userPanel />

			<div className="flex-1 ml-0 md:ml-64">
				{/* MOBILE HEADER */}
				<header className="flex items-center justify-between px-5 py-4 border-b bg-white md:hidden">
					<button onClick={() => setSidebarOpen(s => !s)} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200" aria-label="Menü">
						<svg className="h-6 w-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
					</button>
					<div className="text-lg font-semibold">Értékeléseim</div>
					<div style={{ width: 36 }} />
				</header>

				<main className="px-5 pt-5">
					<h2 className="text-2xl font-semibold mb-4 text-gray-900">Értékeléseim</h2>
					{loading ? (
						<div className="text-gray-700">Betöltés...</div>
					) : error ? (
						<div className="text-red-500">{error}</div>
					) : reviews.length === 0 ? (
						<div className="text-gray-700">Nincs egyetlen értékelés sem.</div>
					) : (
						<div className="space-y-4">
							{reviews.map(r => (
								<div key={r.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between">
									<div className="text-gray-800 space-y-1">
										<div><b>Szoba:</b> {r.roomName}</div>
										<div><b>Értékelés:</b> {r.rating} / 5</div>
										<div><b>Szöveg:</b> {r.text}</div>
										<div><b>Dátum:</b> {r.date}</div>
									</div>
								{confirmId === r.id ? (
									<div className="mt-3 md:mt-0 flex flex-col items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
										<span className="text-red-700 text-sm font-medium">Biztosan törlöd?</span>
										<div className="flex gap-2">
											<button
												className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm disabled:opacity-50"
												onClick={() => { handleDelete(r.id); setConfirmId(null); }}
												disabled={deleting === r.id}
											>
												{deleting === r.id ? "Törlés..." : "Igen"}
											</button>
											<button
												className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-lg text-sm"
												onClick={() => setConfirmId(null)}
											>
												Mégse
											</button>
										</div>
									</div>
								) : (
									<button
										className="mt-3 md:mt-0 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
										onClick={() => setConfirmId(r.id)}
									>
										Értékelés törlése
									</button>
								)}
								</div>
							))}
						</div>
					)}
				</main>
			</div>
			<Toast toasts={toasts} removeToast={removeToast} />
		</div>
	);
}
