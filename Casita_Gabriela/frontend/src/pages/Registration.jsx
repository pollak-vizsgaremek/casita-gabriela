// Registration.jsx

import React, { useState } from "react";
import { Link } from "react-router-dom"; // navigate eltávolítva, mert nem használtuk
import axios from "axios";
import Footer from "../components/Footer";

const Registration = () => {
const [form, setForm] = useState({
name: "",
email: "",
password: "",
passwordRepeat: "",
phone_number: "",
birth_date: "",
address: "",
identity_card: "",
acceptTerms: false,
acceptPrivacy: false,
});
const [errors, setErrors] = useState([]);
const [passwordErrors, setPasswordErrors] = useState([]);
const [message, setMessage] = useState(null);
const [disabled, setDisabled] = useState(false);

// Jelszó validációs hibák listázása
const getPasswordErrors = (pw) => {
const errs = [];
if (!pw || pw.length < 8) errs.push("Legalább 8 karakter hosszú legyen");
if (!/[A-Za-z]/.test(pw || "")) errs.push("Tartalmazzon legalább egy betűt");
if (!/[0-9]/.test(pw || "")) errs.push("Tartalmazzon legalább egy számjegyet");
return errs;
};

// 18+ ellenőrzés
const isAtLeast18 = (birthDateStr) => {
if (!birthDateStr) return false;
const birthDate = new Date(birthDateStr);
if (isNaN(birthDate.getTime())) return false;
const today = new Date();
const age = today.getFullYear() - birthDate.getFullYear();
const monthDiff = today.getMonth() - birthDate.getMonth();
const dayDiff = today.getDate() - birthDate.getDate();
if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
return age - 1 >= 18;
}
return age >= 18;
};

// Az összes mező validálása, hibák gyűjtése
const validateAll = () => {
const newErrors = [];

// Név ellenőrzés: vezetéknév + keresztnév
const nameParts = form.name.trim().split(" ");
if (nameParts.length < 2 || nameParts.some((p) => p.length < 2)) {
newErrors.push("A név nem megfelelő (vezetéknév + keresztnév).");
}

// Email ellenőrzés
if (!form.email.trim()) newErrors.push("Az email mező üres.");

// Születési dátum ellenőrzés
if (!form.birth_date) {
newErrors.push("A születési dátum mező üres.");
} else if (!isAtLeast18(form.birth_date)) {
newErrors.push("Regisztrációhoz legalább 18 évesnek kell lenned.");
}

// Jelszó ellenőrzés
const pwErrs = getPasswordErrors(form.password);
if (pwErrs.length > 0) newErrors.push("A jelszó nem felel meg a követelményeknek.");
if (form.password !== form.passwordRepeat) newErrors.push("A két jelszó nem egyezik.");

// Telefonszám ellenőrzés (max 12 karakter)
if (!form.phone_number || form.phone_number.trim().length === 0) {
newErrors.push("A telefonszám mező üres.");
} else if (form.phone_number.length > 12) {
newErrors.push("A telefonszám maximum 12 karakter lehet.");
}

// Lakcím ellenőrzés
if (
form.address.length < 10 ||
!/\d/.test(form.address) ||
!form.address.includes(" ")
) {
newErrors.push(
"A lakcím nem megfelelő (min. 10 karakter, tartalmazzon számot és szóközt)."
);
}

// Személyi igazolvány formátum ellenőrzés
const id = form.identity_card.trim();
const pattern1 = /^[0-9]{6}[A-Za-z]{2}$/;
const pattern2 = /^[A-Za-z][0-9]{6}[A-Za-z]$/;
if (!(pattern1.test(id) || pattern2.test(id))) {
newErrors.push("A személyi igazolvány szám formátuma hibás.");
}

// Jelölőnégyzetek ellenőrzése
if (!form.acceptTerms) newErrors.push("Az ÁSZF elfogadása kötelező.");
if (!form.acceptPrivacy) newErrors.push("Az Adatkezelési tájékoztató elfogadása kötelező.");

setErrors(newErrors);
return newErrors.length === 0;
};

// Input változás kezelése, korlátozásokkal
const handleChange = (e) => {
const { name, value, type, checked } = e.target;

// Telefonszám: max 12 karakter, amit a felhasználó beír
if (name === "phone_number") {
const cleaned = value.slice(0, 12);
setForm({ ...form, phone_number: cleaned });
return;
}

// Személyi igazolvány: max 8 karakter
if (name === "identity_card") {
setForm({ ...form, identity_card: value.slice(0, 8) });
return;
}

// Checkbox és egyéb mezők kezelése
setForm({ ...form, [name]: type === "checkbox" ? checked : value });
};

// Űrlap beküldése: register-init végpont meghívása
const handleSubmit = async (e) => {
e.preventDefault();
setErrors([]);
setMessage(null);
if (!validateAll()) return;

try {
// Backend URL összeállítása és POST kérés (nem használjuk a választ, ezért nem tároljuk res változóba)
const backendBase = import.meta.env.VITE_API_BASE || "http://localhost:6969";
await axios.post(`${backendBase}/register-init`, {
name: form.name,
email: form.email,
password: form.password,
phone_number: form.phone_number, // pontosan azt mentjük, amit a felhasználó beírt
birth_date: form.birth_date,
address: form.address,
identity_card: form.identity_card,
});

// Sikeres kezdeményezés: email elküldve
setMessage(
"Megerősítő email elküldve. Kérjük, ellenőrizd a postaládádat és kattints a benne található linkre a regisztráció véglegesítéséhez."
);
setDisabled(true);
} catch (err) {
const serverMsg = err.response?.data?.error || err.response?.data?.message;
setErrors([serverMsg || "Szerverhiba történt. Kérjük próbáld újra később."]);
}
};

return (
<div className="p-0 m-0 gap-0 flex flex-col min-h-screen bg-[#f7f3e9] relative">
<style>{`
input[type="date"] {
appearance: none;
-webkit-appearance: none;
position: relative;
}
input[type="date"]::-webkit-calendar-picker-indicator {
filter: invert(0.3);
cursor: pointer;
}
`}</style>

{/* Háttér videók (nagy és mobil) */}
<video
autoPlay
loop
muted
playsInline
className="absolute top-0 left-0 w-full h-auto hidden lg:block pointer-events-none"
style={{ zIndex: 0 }}
>
<source src="/catBack.mp4" type="video/mp4" />
</video>

<video
autoPlay
loop
muted
playsInline
className="absolute top-0 left-0 w-full h-auto lg:hidden block pointer-events-none origin-top scale-[1.12]"
style={{ zIndex: 0 }}
>
<source src="/catBack.mp4" type="video/mp4" />
</video>

<div className="flex flex-col w-dvw grow relative z-10">
<main className="flex items-center justify-center flex-1 m-0 px-4 py-6 sm:px-4 sm:py-8">
<div className="fade-in text-black bg-white shadow-md rounded-xl p-4 w-[86%] max-w-[420px] lg:w-1/3 flex flex-col items-center mt-48 mb-2 sm:mt-6 sm:mb-6">
<p className="text-black mb-4">Regisztráció</p>

{/* Regisztrációs űrlap */}
<form className="w-full flex flex-col items-center" onSubmit={handleSubmit}>
{/* Teljes név */}
<input
name="name"
type="text"
placeholder="Teljes név"
className="mb-2 p-2 border border-gray-300 rounded w-full"
value={form.name}
onChange={handleChange}
disabled={disabled}
/>

{/* Email */}
<input
name="email"
type="email"
placeholder="Email"
className="mb-2 p-2 border border-gray-300 rounded w-full"
value={form.email}
onChange={handleChange}
disabled={disabled}
/>

{/* Jelszó */}
<input
name="password"
type="password"
placeholder="Jelszó"
className="mb-2 p-2 border border-gray-300 rounded w-full"
value={form.password}
onChange={(e) => {
handleChange(e);
setPasswordErrors(getPasswordErrors(e.target.value));
}}
disabled={disabled}
/>

{/* Jelszó ismét */}
<input
name="passwordRepeat"
type="password"
placeholder="Jelszó újra"
className="mb-2 p-2 border border-gray-300 rounded w-full"
value={form.passwordRepeat}
onChange={handleChange}
disabled={disabled}
/>

{/* Jelszó hibák listázása */}
{passwordErrors.length > 0 && (
<ul className="text-sm text-gray-700 mt-3 mb-4 ml-1 space-y-1.5 list-disc list-inside self-start">
{passwordErrors.map((pe, idx) => (
<li key={idx}>{pe}</li>
))}
</ul>
)}

{/* Telefonszám mező (max 12 karakter) */}
<div className="w-full flex items-center gap-2 mb-2">
<input
name="phone_number"
type="text"
placeholder="Telefonszám"
maxLength={12}
className="p-2 border border-gray-300 rounded w-full"
value={form.phone_number}
onChange={handleChange}
disabled={disabled}
/>
</div>

{/* Születési dátum */}
<input
name="birth_date"
type="date"
className="mb-2 p-2 border border-gray-300 rounded w-full text-gray-800"
value={form.birth_date}
onChange={handleChange}
disabled={disabled}
/>

{/* Lakcím */}
<textarea
name="address"
placeholder="Lakcím"
className="mb-2 p-2 border border-gray-300 rounded w-full"
value={form.address}
onChange={handleChange}
disabled={disabled}
/>

{/* Személyi igazolvány */}
<input
name="identity_card"
type="text"
placeholder="Személyi igazolvány szám"
maxLength={8}
className="mb-2 p-2 border border-gray-300 rounded w-full"
value={form.identity_card}
onChange={handleChange}
disabled={disabled}
/>

{/* ÁSZF elfogadása */}
<label className="flex items-center gap-2 mt-2 self-start">
<input
type="checkbox"
name="acceptTerms"
checked={form.acceptTerms}
onChange={handleChange}
disabled={disabled}
/>
<span>
Elfogadom az{" "}
<a href="/aszf" target="_blank" rel="noopener noreferrer" className="text-red-500 underline">
ÁSZF-et
</a>
</span>
</label>

{/* Adatkezelési tájékoztató elfogadása */}
<label className="flex items-center gap-2 mt-1 self-start">
<input
type="checkbox"
name="acceptPrivacy"
checked={form.acceptPrivacy}
onChange={handleChange}
disabled={disabled}
/>
<span>
Elfogadom az{" "}
<a href="/adatkezeles" target="_blank" rel="noopener noreferrer" className="text-red-500 underline">
Adatkezelési tájékoztató
</a>
</span>
</label>

{/* Beküldés gomb */}
<button
type="submit"
className="bg-[#6FD98C] text-white px-4 py-2 rounded hover:-translate-y-px transition-all duration-200 hover:bg-[#5FCB80] hover:cursor-pointer mt-4"
disabled={disabled}
>
Regisztráció
</button>
</form>

{/* Hibák megjelenítése */}
{errors.length > 0 && (
<ul className="mt-6 mb-2 text-sm text-red-600 self-start ml-1 space-y-1.5 list-disc list-inside">
{errors.map((e, i) => (
<li key={i}>{e}</li>
))}
</ul>
)}

{/* Sikerüzenet */}
{message && (
<div className="w-full mt-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded">
{message}
</div>
)}

<p className="mt-4">
Már van fiókod?{" "}
<Link to="/login" className="text-red-500 hover:underline">
Jelentkezz be
</Link>
</p>
</div>
</main>
</div>

{/* Footer */}
<div className="relative z-10">
<Footer />
</div>
</div>
);
};

export default Registration;
