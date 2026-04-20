import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useLocation } from "react-router";
import api from "../services/api";

const Users = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);
  useEffect(() => { fetchUsers(); }, []);

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
    setEditingId(user.id);
    setEditData({ name: user.name, email: user.email, phone_number: user.phone_number || "", address: user.address || "", isAdmin: user.isAdmin || false });
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async (id) => {
    try {
      await api.put(`/admin/users/${id}`, editData);
      setEditingId(null);
      setEditData({});
      await fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Hiba a felhasználó frissítésekor.");
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Biztosan törölni szeretnéd a felhasználót: ${user.name} (${user.email})?\n\nEz törli az összes foglalását és értékelését is!`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      await fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Hiba a felhasználó törlésekor.");
    }
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
                    <div className="space-y-3">
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
                        <button onClick={() => startEdit(user)} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-sm hover:bg-blue-100">Szerkesztés</button>
                        <button onClick={() => deleteUser(user)} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm hover:bg-red-100">Törlés</button>
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
    </div>
  );
};

export default Users;