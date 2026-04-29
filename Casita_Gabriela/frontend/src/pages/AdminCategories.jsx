import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import Toast, { useToast } from "../components/Toast";
import { useLocation } from "react-router";

const AdminCategories = () => {
  // Animációs időzítések dialógusokhoz és űrlappanelhez
  const CONFIRM_ANIMATION_MS = 220;
  const FORM_ANIMATION_MS = 220;
  const NAME_MAX = 30; // kategória név maximális hossz
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formClosing, setFormClosing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", image: "" });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageName, setSelectedImageName] = useState("");
  const imageInputRef = useRef(null);
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
  const closeFormTimeoutRef = useRef(null);
  const { toasts, pushToast, removeToast } = useToast();

  // Kategóriák kezdeti betöltése az oldal megnyitásakor
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      if (closeConfirmTimeoutRef.current)
        clearTimeout(closeConfirmTimeoutRef.current);
      if (openConfirmRafRef.current)
        cancelAnimationFrame(openConfirmRafRef.current);
      if (closeFormTimeoutRef.current)
        clearTimeout(closeFormTimeoutRef.current);
    };
  }, []);

  const openFormPanel = () => {
    if (closeFormTimeoutRef.current) {
      clearTimeout(closeFormTimeoutRef.current);
      closeFormTimeoutRef.current = null;
    }
    setFormClosing(false);
    setShowForm(true);
  };

  const closeFormPanel = (afterClose) => {
    if (!showForm) return;

    setFormClosing(true);
    if (closeFormTimeoutRef.current) clearTimeout(closeFormTimeoutRef.current);
    closeFormTimeoutRef.current = setTimeout(() => {
      setShowForm(false);
      setFormClosing(false);
      if (typeof afterClose === "function") afterClose();
      closeFormTimeoutRef.current = null;
    }, FORM_ANIMATION_MS);
  };

  // Kategóriák lekérése a backend-ről
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get("/categories");
      setCategories(response.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      pushToast("Hiba", "Hiba a kategóriák betöltésekor", "error");
    } finally {
      setLoading(false);
    }
  };

  // Kategória kép feltöltése a szerverre (multipart)
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedImageName(file.name);
    setUploadingImage(true);

    const formDataUpload = new FormData();
    formDataUpload.append("images", file);

    try {
      const response = await api.post("/upload-images", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.paths && response.data.paths.length > 0) {
        setFormData((prev) => ({ ...prev, image: response.data.paths[0] }));
        pushToast(
          "Kép feltöltve",
          "A kategória képe sikeresen feltöltve.",
          "success"
        );
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      pushToast(
        "Képfeltöltési hiba",
        "Nem sikerült feltölteni a kategória képét.",
        "error"
      );
    } finally {
      setUploadingImage(false);
    }
  };

  // Új kategória létrehozása vagy szerkesztés mentése
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.image.trim()) {
      pushToast("Hiba", "Kérjük, töltsd ki az összes mezőt", "error");
      return;
    }

    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, formData);
        pushToast(
          "Kategória frissítve",
          "A kategória sikeresen frissítve.",
          "success"
        );
      } else {
        await api.post("/categories", formData);
        pushToast(
          "Kategória létrehozva",
          "Az új kategória sikeresen létrehozva.",
          "success"
        );
      }
      await fetchCategories();
      closeFormPanel(() => {
        setFormData({ name: "", image: "" });
        setSelectedImageName("");
        setEditingId(null);
      });
    } catch (err) {
      console.error("Error saving category:", err);
      const errorMsg =
        err.response?.data?.error || "Hiba a kategória mentésekor";
      pushToast("Hiba", errorMsg, "error");
    }
  };

  // Szerkesztés kezdeményezése: űrlap feltöltése meglévő adatokkal
  const handleEdit = (category) => {
    setFormData({ name: category.name, image: category.image });
    setSelectedImageName(category.image ? category.image.split("/").pop() : "");
    setEditingId(category.id);
    openFormPanel();
  };

  // Megerősítő dialógus megnyitása (törléshez stb.)
  const openConfirm = ({
    title,
    message,
    confirmLabel = "Megerősítés",
    variant = "danger",
    onConfirm,
  }) => {
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

  // Megerősítő dialógus bezárása animációval
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

  // Kategória törlése a backend-en keresztül
  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      pushToast(
        "Kategória törölve",
        "A kategória sikeresen törölve.",
        "success"
      );
      await fetchCategories();
    } catch (err) {
      console.error("Error deleting category:", err);
      const msg = err.response?.data?.error || "Hiba a kategória törlésénél";
      pushToast("Hiba", msg, "error");
    }
  };

  // Törlés megerősítésének kérése
  const requestDeleteCategory = (id) => {
    openConfirm({
      title: "Kategória törlése",
      message: "Biztosan törölni szeretnéd ezt a kategóriát?",
      confirmLabel: "Törlés",
      variant: "danger",
      onConfirm: () => handleDelete(id),
    });
  };

  const handleCancel = () => {
    closeFormPanel(() => {
      setFormData({ name: "", image: "" });
      setSelectedImageName("");
      setEditingId(null);
    });
  };

  return (
    <div className="flex min-h-screen w-dvw bg-[#f7faf7]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 ml-0 md:ml-64">
        {/* MOBIL FEJLÉC */}
        <header className="flex items-center justify-between px-5 py-4 border-b bg-white md:hidden">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
            aria-label="Menü"
          >
            <svg
              className="h-6 w-6 text-gray-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="text-lg font-semibold">Kategóriák kezelése</div>
          <div style={{ width: 36 }} />
        </header>

        {/* FŐ TARTALOM */}
        <main className="px-5 pt-5">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">
            Kategóriák
          </h2>

          {/* ŰRLAP */}
          {showForm && (
            <div
              className={`bg-white p-6 rounded-xl shadow-md mb-6 text-gray-900 ${
                formClosing
                  ? "animate-edit-popup-out pointer-events-none"
                  : "animate-edit-popup-in"
              }`}
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                {editingId ? "Kategória szerkesztése" : "Új kategória"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900">
                    Kategória neve
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    maxLength={NAME_MAX}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v.length > NAME_MAX) return;
                      setFormData({ ...formData, name: v });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    placeholder="pl. Deluxe szoba"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Kategória képe
                  </label>

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="px-4 py-2 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 transition-colors text-sm font-medium"
                      >
                        {uploadingImage ? "Feltöltés..." : "Kép kiválasztása"}
                      </button>

                      <div className="text-sm text-gray-700 min-h-5">
                        {selectedImageName
                          ? `Kiválasztott fájl: ${selectedImageName}`
                          : formData.image
                          ? "Jelenlegi kép beállítva."
                          : "Még nincs kiválasztott kép."}
                      </div>
                    </div>

                    {formData.image && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-emerald-100 bg-white inline-block">
                        <img
                          src={formData.image}
                          alt="Category"
                          className="h-36 w-56 object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md transition"
                  >
                    {editingId ? "Frissítés" : "Létrehozás"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-md transition"
                  >
                    Mégse
                  </button>
                </div>
              </form>
            </div>
          )}

          <div
            className="grid gap-5 w-full items-start"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(19rem, 1fr))",
            }}
          >
            <button
              onClick={() => {
                setFormData({ name: "", image: "" });
                setSelectedImageName("");
                setEditingId(null);
                openFormPanel();
              }}
              className="
                bg-[#9FE3A8]
                rounded-2xl
                w-full h-72
                border border-emerald-200
                shadow-md
                hover:cursor-pointer
                transition-all duration-300
                hover:shadow-lg hover:-translate-y-0.5
                flex flex-col items-center justify-center
                relative
                animate-fadein
              "
            >
              <div className="relative flex items-center justify-center w-24 h-24">
                <div className="absolute w-24 h-24 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin-slow"></div>
                <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center shadow-md z-10">
                  <span className="text-white text-4xl select-none">+</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <h3 className="text-xl font-semibold text-gray-800">
                  Új kategória
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Kattints ide új kategória létrehozásához
                </p>
              </div>
            </button>

            {loading ? (
              <p className="text-gray-500 col-span-full">
                Kategóriák betöltése...
              </p>
            ) : categories.length === 0 ? (
              <p className="text-gray-500 col-span-full">
                Még nincsenek kategóriák.
              </p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="animate-fadein w-full h-72 rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 bg-white relative"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />

                  <div className="absolute top-3 left-3">
                    <div className="bg-white/90 backdrop-blur-sm border border-white/70 shadow-sm rounded-full px-3 py-1.5">
                      <h3 className="text-sm font-semibold text-gray-800 leading-none">
                        {category.name}
                      </h3>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="rounded-xl bg-white/88 backdrop-blur-sm p-3 border border-white/70 shadow-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-md transition text-sm"
                        >
                          Szerkesztés
                        </button>
                        <button
                          onClick={() => requestDeleteCategory(category.id)}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-2 rounded-md transition text-sm"
                        >
                          Törlés
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {confirmMounted && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 backdrop-blur-[1px] transition-opacity duration-200 ${
            confirmVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className={`w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 transition-all duration-200 ${
              confirmVisible
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-2 scale-95"
            }`}
          >
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmDialog.title}
              </h3>
              <p className="mt-2 text-sm text-gray-700">
                {confirmDialog.message}
              </p>
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
                className={`px-3 py-2 rounded-md border transition-colors ${
                  confirmDialog.variant === "danger"
                    ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                    : "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200"
                }`}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />

      <style>{`
        .animate-spin-slow {
          animation: spin 10s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-fadein {
          animation: fadein 0.4s ease-out;
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

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

export default AdminCategories;
