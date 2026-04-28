import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { useLocation } from "react-router";
import api from "../services/api";
import Toast, { useToast } from "../components/Toast";

const Users = () => {
const CONFIRM_ANIMATION_MS = 220;
const EDIT_ANIMATION_MS = 220;
const location = useLocation();
const [sidebarOpen, setSidebarOpen] = useState(false);
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);
const [editingId, setEditingId] = useState(null);
const [closingEditId, setClosingEditId] = useState(null);
const [editData, setEditData] = useState({});
const [search, setSearch] = useState("");
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
const { toasts, pushToast, removeToast } = useToast();
const closeEditTimeoutRef = useRef(null);

useEffect(() => { setSidebarOpen(false); }, [location.pathname]);
useEffect(() => { fetchUsers(); }, []);
useEffect(() => {
return () => {
if (closeConfirmTimeoutRef.current) clearTimeout(closeConfirmTimeoutRef.current);
if (openConfirmRafRef.current) cancelAnimationFrame(openConfirmRafRef.current);
if (closeEditTimeoutRef.current) clearTimeout(closeEditTimeoutRef.current);
};
}, []);

const fetchUsers = async () => {
try {
setLoading(true);
const res = await api.get("/admin/users");
setUsers(Array.isArray(res.data) ? res.data : []);
} catch (err) {
console.error("Error fetching users:", err);
} finally {
setLoading(false);
}
};

const startEdit = (user) => {
if (closeEditTimeoutRef.current) {
clearTimeout(closeEditTimeoutRef.current);
closeEditTimeoutRef.current = null;
}
setClosingEditId(null);
setEditingId(user.id);
setEditData({ name: user.name, email: user.email, phone_number: user.phone_number || "", address: user.address || "", isAdmin: user.isAdmin || false });
};

const closeEditPanel = () => {
if (editingId === null || editingId === undefined) return;
setClosingEditId(editingId);
if (closeEditTimeoutRef.current) clearTimeout(closeEditTimeoutRef.current);
closeEditTimeoutRef.current = setTimeout(() => {
setEditingId(null);
setClosingEditId(null);
setEditData({});
closeEditTimeoutRef.current = null;
}, EDIT_ANIMATION_MS);
};

const cancelEdit = () => { closeEditPanel(); };

const saveEdit = async (id) => {
try {
await api.put(`/admin/users/${id}`, editData);
closeEditPanel();
await fetchUsers();
pushToast("Sikeres módosítás", "A felhasználó adatai sikeresen frissítve.", "success");
} catch (err) {
console.error("Error updating user:", err);
alert("Hiba a felhasználó frissítésekor.");
}
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

const deleteUser = async (user) => {
try {
await api.delete(`/admin/users/${user.id}`);
await fetchUsers();
pushToast("Sikeres törlés", "A felhasználó sikeresen törölve.", "success");
} catch (err) {
console.error("Error deleting user:", err);
alert("Hiba a felhasználó törlésekor.");
}
};

const requestDeleteUser = (user) => {
openConfirm({
title: "Felhasználó törlése",
message: `Biztosan törölni szeretnéd a felhasználót: ${user.name} (${user.email})?\n\nEz törli az összes foglalását és értékelését is!`,
confirmLabel: "Törlés",
variant: "danger",
onConfirm: () => deleteUser(user),
});
};

const filtered = users.filter((u) => {
const q = search.toLowerCase();
return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || String(u.id).includes(q);
});

return (
<div className="flex min-h-screen w-dvw bg-[#f7faf7] text-black">
<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
<div className="flex-1 ml-0 md:ml-64">
{/* Mobile header */}
<header className="flex items-center justify-between px-5 py-4 border-b bg-white md:hidden">
<button onClick={() => setSidebarOpen((s) => !s)} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200" aria-label="Menü">
<svg className="h-6 w-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
</button>
<div className="text-lg font-semibold">Felhasználók kezelése</div>
<div className="w-10" />
</header>

<div className="p-6">
<h1 className="text-2xl font-semibold mb-4 hidden md:block">Felhasználók kezelése</h1>

{/* Search */}
<div className="mb-4">
<input
type="text"
placeholder="Keresés név, email vagy ID alapján..."
value={search}
onChange={(e) => setSearch(e.target.value)}
className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
/>
</div>

<p className="text-sm text-gray-500 mb-4">Összesen: {filtered.length} felhasználó</p>

{loading ? (
<p className="text-gray-500">Betöltés...</p>
) : (
<div className="space-y-3">
{filtered.map((user) => (
<div key={user.id} className="bg-white border rounded-lg p-4 shadow-sm">
{editingId === user.id ? (
/* EDIT MODE */
<div className={`space-y-3 ${closingEditId === user.id ? 'animate-edit-popup-out pointer-events-none' : 'animate-edit-popup-in'}`}>
{/* header showing user id during edit mode */}
<div className="flex items-center gap-2 mb-1">
<span className="font-semibold text-gray-800">{editData.name}</span>
{editData.isAdmin && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Admin</span>}
<span className="text-xs text-gray-400">#{user.id}</span>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
<div>
<label className="text-xs text-gray-500 font-medium">Név</label>
<input className="w-full px-3 py-2 border rounded-md text-sm" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
</div>

<div>
<label className="text-xs text-gray-500 font-medium">Email</label>
<input className="w-full px-3 py-2 border rounded-md text-sm" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
</div>

<div>
<label className="text-xs text-gray-500 font-medium">Telefonszám</label>
<input className="w-full px-3 py-2 border rounded-md text-sm" value={editData.phone_number} onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })} />
</div>

<div>
<label className="text-xs text-gray-500 font-medium">Cím</label>
<input className="w-full px-3 py-2 border rounded-md text-sm" value={editData.address} onChange={(e) => setEditData({ ...editData, address: e.target.value })} />
</div>
</div>

<div className="flex items-center gap-2">
<input type="checkbox" id={`admin-${user.id}`} checked={editData.isAdmin} onChange={(e) => setEditData({ ...editData, isAdmin: e.target.checked })} />
<label htmlFor={`admin-${user.id}`} className="text-sm">Admin jogosultság</label>
</div>

<div className="flex gap-2">
<button onClick={() => saveEdit(user.id)} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">Mentés</button>
<button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">Mégse</button>
</div>
</div>
) : (
/* VIEW MODE */
<div className="flex flex-col md:flex-row md:items-center gap-3">
<div className="flex-1">
<div className="flex items-center gap-2 mb-1">
<span className="font-semibold text-gray-800">{user.name}</span>
{user.isAdmin && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Admin</span>}
<span className="text-xs text-gray-400">#{user.id}</span>
</div>

<div className="text-sm text-gray-600">
<span>{user.email}</span>
{user.phone_number && <span> &nbsp;•&nbsp; {user.phone_number}</span>}
</div>

{user.address && <div className="text-sm text-gray-500 mt-1">{user.address}</div>}
</div>

<div className="flex gap-2 shrink-0">
<button onClick={() => startEdit(user)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-sm hover:bg-emerald-100">Szerkesztés</button>
<button onClick={() => requestDeleteUser(user)} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm hover:bg-red-100">Törlés</button>
</div>
</div>
)}
</div>
))}
{filtered.length === 0 && <p className="text-gray-500">Nincs találat.</p>}
</div>
)}
</div>
</div>

{confirmMounted && (
<div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 backdrop-blur-[1px] transition-opacity duration-200 ${confirmVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
<div className={`w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 transition-all duration-200 ${confirmVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"}`}>
<div className="p-5">
<h3 className="text-lg font-semibold text-gray-900">{confirmDialog.title}</h3>
<p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{confirmDialog.message}</p>
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
className={`px-3 py-2 rounded-md border transition-colors ${confirmDialog.variant === "danger" ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" : "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200"}`}
>
{confirmDialog.confirmLabel}
</button>
</div>
</div>
</div>
)}

<Toast toasts={toasts} removeToast={removeToast} />

<style>{`
.animate-edit-popup-in {
animation: editPopupIn 0.24s ease-out;
transform-origin: top;
}
.animate-edit-popup-out {
animation: editPopupOut 0.22s ease-in forwards;
transform-origin: top;
}
@keyframes editPopupIn {
from {
opacity: 0;
transform: translateY(8px) scale(0.98);
}
to {
opacity: 1;
transform: translateY(0) scale(1);
}
}
@keyframes editPopupOut {
from {
opacity: 1;
transform: translateY(0) scale(1);
}
to {
opacity: 0;
transform: translateY(8px) scale(0.98);
}
}
`}</style>
</div>
);
};

export default Users;
