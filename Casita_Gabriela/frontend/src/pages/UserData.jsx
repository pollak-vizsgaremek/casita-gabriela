import React, { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router";
import Sidebar from "../components/Sidebar";
import Toast, { useToast } from "../components/Toast";
import api from "../services/api";

export default function UserData() {
// Felhasználói adatok szerkesztő oldal: profiladatok és jelszó módosítás
	const CONFIRM_ANIMATION_MS = 220;
	const location = useLocation();
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [saving, setSaving] = useState(false);
	const [success, setSuccess] = useState(false);
	const [confirmMounted, setConfirmMounted] = useState(false);
	const [confirmVisible, setConfirmVisible] = useState(false);
	const closeConfirmTimeoutRef = useRef(null);
	const openConfirmRafRef = useRef(null);
	const [confirmDialog, setConfirmDialog] = useState({
		open: false,
		title: "",
		message: "",
		confirmLabel: "Megerősítés",
		variant: "primary",
		onConfirm: null,
	});
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const { toasts, pushToast, removeToast } = useToast();

	useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

	// Betöltjük a felhasználó adatait a szerverről
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

	useEffect(() => {
		return () => {
			if (closeConfirmTimeoutRef.current) clearTimeout(closeConfirmTimeoutRef.current);
			if (openConfirmRafRef.current) cancelAnimationFrame(openConfirmRafRef.current);
		};
	}, []);

	const [oldPassword, setOldPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
	const [passwordErrors, setPasswordErrors] = useState([]);
	const [fieldErrors, setFieldErrors] = useState({});

	const getFieldError = (name, rawValue) => {
		const value = String(rawValue || "").trim();

		if (name === "name") {
			const nameParts = value.split(/\s+/).filter(Boolean);
			if (nameParts.length < 2 || nameParts.some(p => p.length < 2)) {
				return "Helyes formátum: vezetéknév + keresztnév, szóközzel elválasztva (pl. Kis Péter).";
			}
			return "";
		}

		if (name === "email") {
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
				return "Helyes email formátum: pelda@domain.hu.";
			}
			return "";
		}

		if (name === "phone_number") {
			if (!/^(\+36\d{9}|\d{9})$/.test(value)) {
				return "Helyes formátum: 9 számjegy (pl. 301234567) vagy +36 előtaggal (pl. +36301234567).";
			}
			return "";
		}

		if (name === "address") {
			if (value.length < 10 || !/\d/.test(value) || !/\s/.test(value)) {
				return "Helyes formátum: legalább 10 karakter, legyen benne szóköz és házszám (pl. Fő utca 12).";
			}
			return "";
		}

		if (name === "identity_card") {
			const pattern1 = /^[0-9]{6}[A-Za-z]{2}$/;
			const pattern2 = /^[A-Za-z][0-9]{6}[A-Za-z]$/;
			if (!(pattern1.test(value) || pattern2.test(value))) {
				return "Helyes formátum: 6 szám + 2 betű (pl. 123456AB) vagy betű + 6 szám + betű (pl. A123456B).";
			}
			return "";
		}

		return "";
	};

	const validateUserFields = (nextUser = user) => {
		if (!nextUser) return true;
		const nextErrors = {};
		const fieldsToValidate = ["name", "email", "phone_number", "address", "identity_card"];

		fieldsToValidate.forEach((fieldName) => {
			const err = getFieldError(fieldName, nextUser[fieldName]);
			if (err) nextErrors[fieldName] = err;
		});

		setFieldErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const getPasswordErrors = (pw) => {
		const errs = [];
		if (!pw || pw.length < 8) errs.push('Legalább 8 karakter hosszú legyen');
		if (!/[A-Za-z]/.test(pw || '')) errs.push('Tartalmazzon legalább egy betűt');
		if (!/[0-9]/.test(pw || '')) errs.push('Tartalmazzon legalább egy számjegyet');
		return errs;
	};

	// Jelszó validációs szabályok (kliens oldali gyors ellenőrzés)

	const handleChange = e => {
		const { name, value } = e.target;
		const nextUser = { ...user, [name]: value };
		setUser(nextUser);

		const err = getFieldError(name, value);
		setFieldErrors(prev => {
			if (!err && !prev[name]) return prev;
			return { ...prev, [name]: err };
		});
	};

	// Űrlapmezők változáskezelője: frissíti a user objektumot és validál

	const performSave = async () => {
		setSaving(true);
		setSuccess(false);
		try {
			const oldPw = oldPassword.trim();
			const newPw = newPassword.trim();
			const newPwConfirm = newPasswordConfirm.trim();
			const wantsPasswordChange = !!oldPw || !!newPw || !!newPwConfirm;

			if (wantsPasswordChange && !newPw) {
				pushToast("Hiba", "Új jelszó nélkül nem lehet jelszót módosítani.", "error");
				setSaving(false);
				return;
			}
			if (wantsPasswordChange && !newPwConfirm) {
				pushToast("Hiba", "Kérlek, add meg újra az új jelszót.", "error");
				setSaving(false);
				return;
			}
			if (wantsPasswordChange && !oldPw) {
				pushToast("Hiba", "A jelenlegi jelszó megadása kötelező a jelszó módosításához.", "error");
				setSaving(false);
				return;
			}
			if (newPw && newPwConfirm && newPw !== newPwConfirm) {
				setPasswordErrors(["Az új jelszó és az új jelszó megerősítése nem egyezik."]);
				pushToast("Hiba", "Az új jelszavak nem egyeznek.", "error");
				setSaving(false);
				return;
			}

			const payload = {
				name: user.name,
				email: user.email,
				phone_number: user.phone_number,
				address: user.address,
				identity_card: user.identity_card,
			};
			if (newPw) {
				const errs = getPasswordErrors(newPw);
				if (errs.length) {
					setPasswordErrors(errs);
					setSaving(false);
					return;
				}
				payload.oldPassword = oldPw;
				payload.password = newPw;
			}
			await api.put("/user/data", payload);
			pushToast("Adatok mentve", "Az adatok sikeresen frissítve.", "success");
			setOldPassword("");
			setNewPassword("");
			setNewPasswordConfirm("");
			setPasswordErrors([]);
		} catch (err) {
			const msg = err.response?.data?.error || "Nem sikerült menteni az adatokat.";
			pushToast("Hiba", msg, "error");
		}
		setSaving(false);
	};

	// Mentés művelet: szerverhívás a profiladatok frissítéséhez (jelszóval is)

	const openConfirm = ({ title, message, confirmLabel = "Megerősítés", variant = "primary", onConfirm }) => {
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

	// Megerősítő dialógus megnyitása animált módon

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
				variant: "primary",
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

	const handleSubmit = async e => {
		e.preventDefault();
		if (saving) return;

		if (!validateUserFields()) {
			pushToast("Hiba", "Kérlek, javítsd a hibás mezőket mentés előtt.", "error");
			return;
		}

		const oldPw = oldPassword.trim();
		const newPw = newPassword.trim();
		const newPwConfirm = newPasswordConfirm.trim();
		const wantsPasswordChange = !!oldPw || !!newPw || !!newPwConfirm;

		if (wantsPasswordChange && !newPw) {
			setPasswordErrors(["Új jelszó megadása kötelező, ha jelenlegi jelszót adsz meg."]);
			pushToast("Hiba", "Új jelszó megadása kötelező.", "error");
			return;
		}
		if (wantsPasswordChange && !newPwConfirm) {
			setPasswordErrors(["Új jelszó megerősítése kötelező."]);
			pushToast("Hiba", "Kérlek, add meg újra az új jelszót.", "error");
			return;
		}
		if (wantsPasswordChange && !oldPw) {
			setPasswordErrors([]);
			pushToast("Hiba", "A jelenlegi jelszó megadása kötelező az új jelszóhoz.", "error");
			return;
		}
		if (newPw && newPwConfirm && newPw !== newPwConfirm) {
			setPasswordErrors(["Az új jelszó és az új jelszó megerősítése nem egyezik."]);
			pushToast("Hiba", "Az új jelszavak nem egyeznek.", "error");
			return;
		}
		if (newPw) {
			const errs = getPasswordErrors(newPw);
			setPasswordErrors(errs);
			if (errs.length) {
				pushToast("Hiba", "Az új jelszó nem felel meg a követelményeknek.", "error");
				return;
			}
		} else {
			setPasswordErrors([]);
		}

		openConfirm({
			title: "Adatok módosítása",
			message: "Biztosan menteni szeretnéd a módosított adatokat?",
			confirmLabel: "Mentés",
			variant: "primary",
			onConfirm: () => performSave(),
		});
	};

	// Űrlap beküldés: előellenőrzés, jelszólogika és mentés megerősítése

	return (
		<div className="flex min-h-screen w-dvw bg-[#f7faf7]">
			<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userPanel />

			<div className="flex-1 ml-0 md:ml-64">
				<main className="px-4 sm:px-6 pt-54 md:pt-5 pb-10">
					<div className="w-full max-w-3xl">
					<h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-900">Adataim</h2>
					{loading ? (
						<div className="text-gray-700">Betöltés...</div>
					) : error ? (
						<div className="text-red-500">{error}</div>
					) : user ? (
						<form className="space-y-4 bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6" onSubmit={handleSubmit}>
							<div>
								<label className="block mb-1 font-medium text-gray-700">Név</label>
								<input
									type="text"
									name="name"
									value={user.name || ""}
									onChange={handleChange}
									className={`w-full border rounded-lg px-3 py-2 text-gray-900 ${fieldErrors.name ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"}`}
									required
								/>
								{fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
							</div>
							<div>
								<label className="block mb-1 font-medium text-gray-700">Email</label>
								<input
									type="email"
									name="email"
									value={user.email || ""}
									onChange={handleChange}
									className={`w-full border rounded-lg px-3 py-2 text-gray-900 ${fieldErrors.email ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"}`}
									required
								/>
								{fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
							</div>
							<div>
								<label className="block mb-1 font-medium text-gray-700">Telefonszám</label>
								<input
									type="text"
									name="phone_number"
									value={user.phone_number || ""}
									onChange={handleChange}
									className={`w-full border rounded-lg px-3 py-2 text-gray-900 ${fieldErrors.phone_number ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"}`}
									required
								/>
								{fieldErrors.phone_number && <p className="mt-1 text-sm text-red-600">{fieldErrors.phone_number}</p>}
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
									className={`w-full border rounded-lg px-3 py-2 text-gray-900 ${fieldErrors.address ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"}`}
									required
								/>
								{fieldErrors.address && <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>}
							</div>
							<div>
								<label className="block mb-1 font-medium text-gray-700">Személyi igazolvány szám</label>
								<input
									type="text"
									name="identity_card"
									value={user.identity_card || ""}
									onChange={handleChange}
									className={`w-full border rounded-lg px-3 py-2 text-gray-900 ${fieldErrors.identity_card ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50"}`}
								/>
								{fieldErrors.identity_card && <p className="mt-1 text-sm text-red-600">{fieldErrors.identity_card}</p>}
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
								onChange={e => {
									const nextNew = e.target.value;
									setNewPassword(nextNew);
									if (newPasswordConfirm.trim() && nextNew.trim() !== newPasswordConfirm.trim()) {
										setPasswordErrors(["Az új jelszó és az új jelszó megerősítése nem egyezik."]);
									} else {
										setPasswordErrors(getPasswordErrors(nextNew));
									}
								}}
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
						<div>
							<label className="block mb-1 font-medium text-gray-700">Új jelszó megerősítése</label>
							<input
								type="password"
								value={newPasswordConfirm}
								onChange={e => {
									setNewPasswordConfirm(e.target.value);
									if (newPassword.trim() && e.target.value.trim() && newPassword.trim() !== e.target.value.trim()) {
										setPasswordErrors(["Az új jelszó és az új jelszó megerősítése nem egyezik."]);
									} else {
										setPasswordErrors(getPasswordErrors(newPassword));
									}
								}}
								className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-gray-50"
							/>
						</div>
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
							<Link to="/forgot-password" className="text-sm text-gray-500 hover:underline">
								Elfelejtett jelszó?
							</Link>
							<button
								type="submit"
								className="w-full sm:w-auto bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg disabled:opacity-50"
								disabled={saving}
							>
								{saving ? "Mentés..." : "Mentés"}
							</button>
						</div>
							{success && <div className="text-green-600 mt-2">Sikeres mentés!</div>}
						</form>
					) : null}
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
								disabled={saving}
							>
								Mégse
							</button>
							<button
								onClick={handleConfirm}
								className={`px-3 py-2 rounded-md border transition-colors ${confirmDialog.variant === "danger" ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" : "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"}`}
								disabled={saving}
							>
								{saving ? "Mentés..." : confirmDialog.confirmLabel}
							</button>
						</div>
					</div>
				</div>
			)}
			<Toast toasts={toasts} removeToast={removeToast} />
		</div>
	);
}
