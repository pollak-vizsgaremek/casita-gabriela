import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router";
import Sidebar from "../components/Sidebar";
import Toast, { useToast } from "../components/Toast";
import api from "../services/api";

export default function UserData() {
	const location = useLocation();
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [saving, setSaving] = useState(false);
	const [success, setSuccess] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const { toasts, pushToast, removeToast } = useToast();

	useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

	useEffect(() => {
		api.get("/user/data")
			.then(res => {
				setUser(res.data);
				setLoading(false);
			})
			.catch(() => {
				setError("Nem sikerült betölteni az adatokat.");
				setLoading(false);
			});
	}, []);

	const [oldPassword, setOldPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [passwordErrors, setPasswordErrors] = useState([]);

	const getPasswordErrors = (pw) => {
		const errs = [];
		if (!pw || pw.length < 8) errs.push('Legalább 8 karakter hosszú legyen');
		if (!/[A-Za-z]/.test(pw || '')) errs.push('Tartalmazzon legalább egy betűt');
		if (!/[0-9]/.test(pw || '')) errs.push('Tartalmazzon legalább egy számjegyet');
		return errs;
	};

	const handleChange = e => {
		setUser({ ...user, [e.target.name]: e.target.value });
	};

	const handleSubmit = async e => {
		e.preventDefault();
		setSaving(true);
		setSuccess(false);
		try {
			const payload = {
				name: user.name,
				email: user.email,
				phone_number: user.phone_number,
				address: user.address,
			};
			if (newPassword.trim()) {
				const errs = getPasswordErrors(newPassword);
				if (errs.length) {
					setPasswordErrors(errs);
					setSaving(false);
					return;
				}
				payload.oldPassword = oldPassword;
				payload.password = newPassword;
			}
			await api.put("/user/data", payload);
			pushToast("Adatok mentve", "Az adatok sikeresen frissítve.", "success");
			setOldPassword("");
			setNewPassword("");
		} catch (err) {
			const msg = err.response?.data?.error || "Nem sikerült menteni az adatokat.";
			pushToast("Hiba", msg, "error");
		}
		setSaving(false);
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
					<div className="text-lg font-semibold">Adataim</div>
					<div style={{ width: 36 }} />
				</header>

				<main className="px-5 pt-5 pb-10">
					<h2 className="text-2xl font-semibold mb-4 text-gray-900">Adataim</h2>
					{loading ? (
						<div className="text-gray-700">Betöltés...</div>
					) : error ? (
						<div className="text-red-500">{error}</div>
					) : user ? (
						<form className="max-w-md space-y-4" onSubmit={handleSubmit}>
							<div>
								<label className="block mb-1 font-medium text-gray-700">Név</label>
								<input
									type="text"
									name="name"
									value={user.name || ""}
									onChange={handleChange}
									className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-gray-50"
									required
								/>
							</div>
							<div>
								<label className="block mb-1 font-medium text-gray-700">Email</label>
								<input
									type="email"
									name="email"
									value={user.email || ""}
									onChange={handleChange}
									className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-gray-50"
									required
								/>
							</div>
							<div>
								<label className="block mb-1 font-medium text-gray-700">Telefonszám</label>
								<input
									type="text"
									name="phone_number"
									value={user.phone_number || ""}
									onChange={handleChange}
									className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-gray-50"
									required
								/>
							</div>
							<div>
								<label className="block mb-1 font-medium text-gray-700">Születési dátum</label>
								<input
									type="date"
								value={user.birth_date ? user.birth_date.slice(0, 10) : ""}
								className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-500 bg-gray-100 cursor-not-allowed"
								disabled
								/>
							</div>
							<div>
								<label className="block mb-1 font-medium text-gray-700">Lakcím</label>
								<input
									type="text"
									name="address"
									value={user.address || ""}
									onChange={handleChange}
									className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-gray-50"
									required
								/>
							</div>
							<div>
								<label className="block mb-1 font-medium text-gray-700">Személyi igazolvány szám</label>
								<input
									type="text"
									value={user.identity_card || ""}
									className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-500 bg-gray-100 cursor-not-allowed"
									disabled
								/>
							</div>
						<hr className="my-2 border-gray-200" />
						<p className="text-sm text-gray-500">Jelszó módosításához add meg a jelenlegi jelszavad is.</p>
						<div>
							<label className="block mb-1 font-medium text-gray-700">Jelenlegi jelszó</label>
							<input
								type="password"
								value={oldPassword}
								onChange={e => setOldPassword(e.target.value)}
								className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-gray-50"
							/>
						</div>
						<div>
							<label className="block mb-1 font-medium text-gray-700">Új jelszó</label>
							<input
								type="password"
								value={newPassword}
								onChange={e => { setNewPassword(e.target.value); setPasswordErrors(getPasswordErrors(e.target.value)); }}
								className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-gray-50"
							/>
							{passwordErrors.length > 0 && (
								<ul className="text-sm text-gray-700 mt-1 mb-1 list-disc list-inside">
									{passwordErrors.map((pe, idx) => (
										<li key={idx}>{pe}</li>
									))}
								</ul>
							)}
						</div>
						<div className="flex items-center justify-between">
							<Link to="/forgot-password" className="text-sm text-gray-500 hover:underline">
								Elfelejtett jelszó?
							</Link>
							<button
								type="submit"
								className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
								disabled={saving}
							>
								{saving ? "Mentés..." : "Mentés"}
							</button>
						</div>
							{success && <div className="text-green-600 mt-2">Sikeres mentés!</div>}
						</form>
					) : null}
				</main>
			</div>
			<Toast toasts={toasts} removeToast={removeToast} />
		</div>
	);
}
