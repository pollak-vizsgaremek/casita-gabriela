// src/pages/AdminKezeles.jsx

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Toast, { useToast } from "../components/Toast";


const AdminKezeles = () => {
  const { id } = useParams();
  const navigate = useNavigate();


  const TITLE_MAX = 30;
  const DESC_MAX = 1000;
  const CAPACITY_MAX = 999;
  const PRICE_MAX = 10000000;


  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    capacity: "",
    price: "",
    isHighlighted: false,
    ac_availablity: 0,
  });


  // Kategóriák tömb objektumokkal: { id, name }
  const [categories, setCategories] = useState([]);
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [extraImages, setExtraImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);


  const mainInputRef = useRef(null);
  const extraInputRef = useRef(null);


  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounter = useRef(0);


  const { toasts, pushToast, removeToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


  // Mobilnézet detektálása az egyszerű gomb elrendezéshez
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });


  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setIsMobileViewport(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);


  // Oldal háttér és magasság beállítása (görgetésnél fehér részt kerül)
  useEffect(() => {
    const prevBodyBgAttachment = document.body.style.backgroundAttachment;
    const prevBodyBgSize = document.body.style.backgroundSize;
    const prevBodyBgPos = document.body.style.backgroundPosition;
    const prevBodyMinHeight = document.body.style.minHeight;


    document.documentElement.style.height = "100%";
    document.body.style.minHeight = "100%";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    // A háttérképet a globális CSS kezeli; itt csak a méretezést/pozíciót biztosítjuk


    return () => {
      // Kilépéskor visszaállítjuk a korábbi stílusértékeket
      document.body.style.backgroundAttachment = prevBodyBgAttachment;
      document.body.style.backgroundSize = prevBodyBgSize;
      document.body.style.backgroundPosition = prevBodyBgPos;
      document.body.style.minHeight = prevBodyMinHeight;
      document.documentElement.style.height = "";
    };
  }, []);


  useEffect(() => {
    // Kategóriák betöltése a szoba lekérése előtt (map-hez)
    loadCategories().then(() => {
      if (id) {
        fetchRoom();
      } else {
        setInitialLoad(false);
      }
    });


    // Drag & drop fájlkezelés: belépés
    const onDragEnter = (e) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (
        e.dataTransfer?.types &&
        Array.from(e.dataTransfer.types).includes("Files")
      ) {
        setIsDraggingFile(true);
      }
    };


    // Drag & drop fájlkezelés: kilépés
    const onDragLeave = (e) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDraggingFile(false);
      }
    };


    // Drag & drop fájlkezelés: áthúzás megakadályozása
    const onDragOver = (e) => e.preventDefault();


    // Drag & drop fájlkezelés: legördülés (fájlok feldolgozása)
    const onDrop = (e) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDraggingFile(false);
    };


    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);


    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };


    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);


  const loadCategories = async () => {
    try {
      const res = await api.get("/categories");
      const rows = Array.isArray(res.data) ? res.data : [];
      // Normalizálás: alakítsuk objektumokká {id, name}
      const cats = rows
        .map((c) => ({ id: c.id, name: c.name }))
        .filter(Boolean);
      setCategories(cats);
      return cats;
    } catch (err) {
      console.warn("Nem sikerült betölteni a kategóriákat:", err);
      console.error(
        "loadCategories error details:",
        err?.response?.data ?? err
      );
      setCategories([]);
      return [];
    }
  };


  const fetchRoom = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setMessage("");
      const response = await api.get(`/rooms/${id}`);
      const room = response.data;

      // Képek normalizálása a szerver válaszából
      const parsedImages = parseImagesFromServer(room.images);


      // Kategória id meghatározása a formData.type mezőhöz
      // A backend különböző formátumokban adhatja vissza a kategóriát
      let categoryId = "";
      if (typeof room.category === "number") {
        categoryId = room.category;
      } else if (room?.category_rel?.id) {
        categoryId = room.category_rel.id;
      } else if (typeof room.category === "string") {
        // Ha a backend névként adja vissza a kategóriát, megpróbáljuk kikeresni az id-t
        const found = categories.find((c) => c.name === room.category);
        if (found) categoryId = found.id;
        else {
          // Hibakeresés: a backend névvel tért vissza, amit nem tudtunk leképezni
          console.error(
            "fetchRoom: backend returned category name that is not in loaded categories:",
            room.category
          );
          categoryId = "";
        }
      } else {
        categoryId = "";
      }


      setFormData({
        title: room.name || "",
        description: room.description || "",
        type: categoryId,
        capacity: room.space || "",
        price: room.price || "",
        isHighlighted: room.isHighlighted ?? false,
        ac_availablity: room.ac_availablity ?? 0,
      });


      if (parsedImages.length > 0) {
        setMainImagePreview(parsedImages[0]);
        setMainImageFile(null);
        const extras = parsedImages
          .slice(1)
          .map((p, idx) => ({ id: `db-${idx}`, file: null, preview: p }));
        setExtraImages(extras);
      } else {
        setMainImagePreview(null);
        setMainImageFile(null);
        setExtraImages([]);
      }


      setIsEditing(true);
    } catch (err) {
      console.error("Error fetching room:", err);
      console.error("fetchRoom response data:", err?.response?.data ?? null);
      setMessage("Nem sikerült betölteni a szobát.");
      showToast(
        "Nem sikerült betölteni a szobát. Nézd a konzolt további részletekért.",
        "error"
      );
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };


  const parseImagesFromServer = (imagesField) => {
    if (!imagesField) return [];
    try {
      if (Array.isArray(imagesField)) {
        return imagesField.map((s) => normalizePreview(s)).filter(Boolean);
      }
      if (typeof imagesField === "string") {
        try {
          const parsed = JSON.parse(imagesField);
          if (Array.isArray(parsed))
            return parsed.map((s) => normalizePreview(s)).filter(Boolean);
          return [normalizePreview(parsed)];
        } catch (e) {
          return [normalizePreview(imagesField)];
        }
      }
      return [];
    } catch (err) {
      console.error("parseImagesFromServer error:", err);
      return [];
    }
  };


  const normalizePreview = (s) => {
    if (!s) return null;
    if (s.startsWith("data:")) return s;
    if (s.startsWith("http")) return s;
    if (s.startsWith("/")) return `${window.location.origin}${s}`;
    return s;
  };


  const handleInputChange = (e) => {
    const { name, type, checked, value } = e.target;
    // Kliens-oldali maxlength ellenőrzés a név és leírás mezőknél
    if (name === "title") {
      if (value.length > TITLE_MAX) return;
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }
    if (name === "description") {
      if (value.length > DESC_MAX) return;
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }
    // capacity and price limits
    if (name === "capacity") {
      const num =
        value === ""
          ? ""
          : Math.max(1, Math.min(CAPACITY_MAX, Number(value || 0)));
      setFormData((prev) => ({ ...prev, [name]: num }));
      return;
    }
    if (name === "price") {
      const num =
        value === ""
          ? ""
          : Math.max(1, Math.min(PRICE_MAX, Number(value || 0)));
      setFormData((prev) => ({ ...prev, [name]: num }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };


  const handleMainDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleMainFile(file);
    dragCounter.current = 0;
    setIsDraggingFile(false);
  };


  const handleMainFile = (file) => {
    setMainImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setMainImagePreview(reader.result);
    reader.readAsDataURL(file);
  };


  const handleMainImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleMainFile(file);
  };


  const handleRemoveMainImage = () => {
    setMainImageFile(null);
    setMainImagePreview(null);
  };


  const handleExtraDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) handleAddExtraFiles(files);
    dragCounter.current = 0;
    setIsDraggingFile(false);
  };


  const handleAddExtraFiles = (files) => {
    const newExtras = files.map((file, idx) => {
      const tempId = `new-${Date.now()}-${idx}`;
      const obj = { id: tempId, file, preview: null };
      const reader = new FileReader();
      reader.onloadend = () => {
        setExtraImages((prev) =>
          prev.map((p) =>
            p.id === tempId ? { ...p, preview: reader.result } : p
          )
        );
      };
      reader.readAsDataURL(file);
      return obj;
    });
    setExtraImages((prev) => [...prev, ...newExtras]);
  };


  const handleExtraInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) handleAddExtraFiles(files);
    e.target.value = "";
  };


  const handleRemoveExtraImage = (idToRemove) => {
    setExtraImages((prev) => prev.filter((img) => img.id !== idToRemove));
  };


  const moveExtraImage = (id, direction) => {
    setExtraImages((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const newArr = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= newArr.length) return prev;
      const tmp = newArr[swapIdx];
      newArr[swapIdx] = newArr[idx];
      newArr[idx] = tmp;
      return newArr;
    });
  };


  const uploadFilesToServer = async (files) => {
    if (!files || files.length === 0) return [];
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    try {
      const res = await api.post("/upload-images", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res?.data?.paths && Array.isArray(res.data.paths))
        return res.data.paths;
      console.error(
        "uploadFilesToServer: unexpected response format",
        res?.data
      );
      return [];
    } catch (err) {
      console.warn("Upload failed:", err);
      console.error(
        "uploadFilesToServer error details:",
        err?.response?.data ?? err
      );
      return [];
    }
  };


  const collectImagesForSave = async () => {
    const imagesToSave = [];
    if (mainImageFile) {
      const paths = await uploadFilesToServer([mainImageFile]);
      if (paths.length) imagesToSave.push(paths[0]);
    } else if (mainImagePreview) {
      imagesToSave.push(
        mainImagePreview.startsWith(window.location.origin)
          ? mainImagePreview.replace(window.location.origin, "")
          : mainImagePreview
      );
    }


    for (const ex of extraImages) {
      if (ex.file) {
        const paths = await uploadFilesToServer([ex.file]);
        if (paths.length) imagesToSave.push(paths[0]);
      } else if (ex.preview) {
        imagesToSave.push(
          ex.preview.startsWith(window.location.origin)
            ? ex.preview.replace(window.location.origin, "")
            : ex.preview
        );
      }
    }


    return imagesToSave;
  };


  const showToast = (text, type = "info", duration = 4000) => {
    const toastType = type === "success" ? "success" : "error";
    const title = type === "success" ? "Sikeres" : type === "info" ? "Információ" : "Hiba";
    pushToast(title, text, toastType, duration);
  };


  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();


    // Kliens-oldali ellenőrzés: hiányzó kötelező mező esetén hibajelzés, backend hívás leáll
    if (
      !formData.title ||
      !formData.description ||
      !formData.type ||
      !formData.capacity ||
      !formData.price ||
      (!mainImagePreview && !mainImageFile)
    ) {
      const missing = [];
      if (!formData.title) missing.push("Név");
      if (!formData.description) missing.push("Leírás");
      if (!formData.type) missing.push("Kategória");
      if (!formData.capacity) missing.push("Férőhely");
      if (!formData.price) missing.push("Ár");
      if (!mainImagePreview && !mainImageFile) missing.push("Fő kép");
      const msg = `Hiányzó mezők: ${missing.join(
        ", "
      )}. Kérlek töltsd ki őket.`;
      setMessage("Kérlek töltsd ki az összes mezőt!");
      showToast(msg, "error");
      return;
    }


    setLoading(true);
    setMessage("");
    try {
      const imagesPaths = await collectImagesForSave();


      // roomData must send category as id (Int) according to schema
      const roomData = {
        name: formData.title,
        description: formData.description,
        price: parseInt(formData.price, 10),
        category: Number(formData.type) || null,
        space: parseInt(formData.capacity, 10),
        images: imagesPaths.length ? imagesPaths : null,
        isHighlighted: formData.isHighlighted,
        ac_availablity: formData.ac_availablity ? 1 : 0,
      };


      if (isEditing && id) {
        try {
          await api.put(`/rooms/${id}`, roomData);
        } catch (putErr) {
          console.error(
            "PUT /rooms/:id failed:",
            putErr,
            putErr?.response?.data ?? null
          );
          // show backend error details if available
          const backendMsg =
            putErr?.response?.data?.message || putErr?.response?.data?.error;
          if (backendMsg) showToast(`Backend hiba: ${backendMsg}`, "error");
          throw putErr;
        }


        const fresh = await api.get(`/rooms/${id}`);
        const parsed = parseImagesFromServer(fresh.data.images);
        // map category back to id if possible
        let categoryId = "";
        if (typeof fresh.data.category === "number")
          categoryId = fresh.data.category;
        else if (fresh?.category_rel?.id) categoryId = fresh.category_rel.id;
        else if (typeof fresh.data.category === "string") {
          const found = categories.find((c) => c.name === fresh.data.category);
          if (found) categoryId = found.id;
          else {
            console.error(
              "After update: backend returned category name that cannot be mapped:",
              fresh.data.category
            );
            categoryId = "";
          }
        }
        setFormData({
          title: fresh.data.name || "",
          description: fresh.data.description || "",
          type: categoryId,
          capacity: fresh.data.space || "",
          price: fresh.data.price || "",
          isHighlighted: fresh.data.isHighlighted ?? false,
          ac_availablity: fresh.data.ac_availablity ?? 0,
        });
        setMainImagePreview(parsed[0] || null);
        setExtraImages(
          parsed
            .slice(1)
            .map((p, idx) => ({ id: `db-${idx}`, file: null, preview: p }))
        );
        setMessage("Sikeresen frissítetted a szobát!");
        showToast("Sikeresen frissítetted a szobát!", "success");
      } else {
        const res = await api.post("/rooms", roomData);
        const createdRoom = res?.data?.room || res?.data;
        if (createdRoom?.id) {
          setIsEditing(true);
          setTimeout(async () => {
            try {
              const fresh = await api.get(`/rooms/${createdRoom.id}`);
              const parsed = parseImagesFromServer(fresh.data.images);
              let categoryId = "";
              if (typeof fresh.data.category === "number")
                categoryId = fresh.data.category;
              else if (fresh?.category_rel?.id)
                categoryId = fresh.category_rel.id;
              else if (typeof fresh.data.category === "string") {
                const found = categories.find(
                  (c) => c.name === fresh.data.category
                );
                if (found) categoryId = found.id;
                else {
                  console.error(
                    "Post-create: backend returned category name that cannot be mapped:",
                    fresh.data.category
                  );
                  categoryId = "";
                }
              }
              setFormData({
                title: fresh.data.name || "",
                description: fresh.data.description || "",
                type: categoryId,
                capacity: fresh.data.space || "",
                price: fresh.data.price || "",
                isHighlighted: fresh.data.isHighlighted ?? false,
                ac_availablity: fresh.data.ac_availablity ?? 0,
              });
              setMainImagePreview(parsed[0] || null);
              setExtraImages(
                parsed.slice(1).map((p, idx) => ({
                  id: `db-${idx}`,
                  file: null,
                  preview: p,
                }))
              );
              setMessage("Sikeresen létrehoztad a szobát!");
              showToast("Sikeresen létrehoztad a szobát!", "success");
            } catch (err) {
              setIsEditing(true);
              setMessage(
                "Sikeresen létrehoztad a szobát! (nem sikerült azonnal lekérni a részleteket)"
              );
              showToast("Sikeresen létrehoztad a szobát!", "success");
              console.error(
                "Post-create fetch error:",
                err,
                err?.response?.data ?? null
              );
            }
          }, 300);
        } else {
          setFormData({
            title: "",
            description: "",
            type: "",
            capacity: "",
            price: "",
            isHighlighted: false,
            ac_availablity: 0,
          });
          setMainImageFile(null);
          setMainImagePreview(null);
          setExtraImages([]);
          setIsEditing(false);
          setMessage("Sikeresen létrehoztad a szobát!");
          showToast("Sikeresen létrehoztad a szobát!", "success");
        }
      }


      await loadCategories();
    } catch (err) {
      console.error("Full error object during save:", err);
      console.error("Save error response data:", err?.response?.data ?? null);
      let errorMsg = "Hiba a szoba mentése során. Próbáld újra!";
      if (err.response?.data?.error) errorMsg = err.response.data.error;
      else if (err.response?.data?.message)
        errorMsg = err.response.data.message;
      else if (err.message) errorMsg = err.message;
      setMessage(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = () => {
    if (!isEditing || !id || loading) return;
    setShowDeleteConfirm(true);
  };


  const handleDeleteConfirmed = async () => {
    if (!isEditing || !id) return;
    setLoading(true);
    setMessage("");
    try {
      await api.delete(`/rooms/${id}`);
      setMessage("Sikeresen törölted a szobát!");
      showToast("Sikeresen törölted a szobát!", "success");
      setShowDeleteConfirm(false);
      setFormData({
        title: "",
        description: "",
        type: "",
        capacity: "",
        price: "",
        isHighlighted: false,
        ac_availablity: 0,
      });
      setMainImageFile(null);
      setMainImagePreview(null);
      setExtraImages([]);
      setIsEditing(false);
    } catch (err) {
      console.error("Error deleting room:", err);
      console.error("Delete error response data:", err?.response?.data ?? null);
      let errorMsg = "Hiba a szoba törlése során. Próbáld újra!";
      if (err.response?.data?.error) errorMsg = err.response.data.error;
      else if (err.response?.data?.message)
        errorMsg = err.response.data.message;
      setMessage(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };


  if (initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-screen w-dvw bg-[#0b1f13]">
        <p className="text-gray-500">Betöltés...</p>
      </div>
    );
  }


  return (
    <div className="relative page-container min-h-screen">
      <style>{`
/* Belépési animáció */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in-up { animation: fadeInUp 640ms cubic-bezier(.2,.9,.2,1) both; }
.fade-in-up.delay-1 { animation-delay: 80ms; }
.fade-in-up.delay-2 { animation-delay: 160ms; }


/* Egy lebegő gomb stílusa */
.floating-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: #ffffff;
  border: 2px solid rgba(0,0,0,0.18);
  box-shadow: 0 6px 12px rgba(2,6,23,0.18);
  width: 52px;
  height: 52px;
  transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
}
.floating-btn:hover,
.floating-btn:focus {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 10px 18px rgba(2,6,23,0.28);
  background: #ffffff;
  outline: none;
}
.floating-btn:focus-visible {
  box-shadow: 0 10px 18px rgba(2,6,23,0.28), 0 0 0 4px rgba(59,130,246,0.12);
}
@media (max-width: 420px) {
  .floating-btn { width: 46px; height: 46px; }
}


.desc-area { height: 18rem; min-height: 10rem; max-height: 28rem; }
@media (max-width: 767px) { .desc-area { height: 12rem; } }


@keyframes slideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.extra-image-item { animation: slideIn 0.3s ease-out; }


.main-image { width: 100%; height: auto; max-height: 20rem; object-fit: cover; display: block; border-radius: 0.5rem; }
@media (max-width: 420px) { .main-image { max-height: 24rem; } }


.thumb-image { width: 100%; height: 100%; object-fit: cover; display: block; }


@media (max-width: 640px) {
  .yellow-card { width: calc(100% + 2rem); margin-left: -1rem; margin-right: -1rem; padding-left: 1.25rem; padding-right: 1.25rem; border-radius: 0.5rem; }
  .inner-white { width: calc(100% + 1.5rem); margin-left: -0.75rem; margin-right: -0.75rem; padding-left: 0.75rem; padding-right: 0.75rem; }
}


@keyframes modalOverlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalCardPopIn {
  from { opacity: 0; transform: translateY(10px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.confirm-modal-overlay {
  animation: modalOverlayFadeIn 180ms ease-out both;
}

.confirm-modal-card {
  animation: modalCardPopIn 220ms cubic-bezier(.2,.9,.2,1) both;
}
`}</style>


      {/* Teljes háttér a görgetés közbeni fehér rések elkerüléséhez */}
      <div
        aria-hidden
        className="fixed inset-0 layerAdmin bg-no-repeat bg-center bg-cover"
        style={{ zIndex: -20 }}
      />


      {/* Egy lebegő gomb; pozíció a viewport alapján */}
      <button
        onClick={() => navigate("/admin")}
        aria-label="Vissza az adminhoz"
        className="floating-btn z-50"
        style={{
          position: "fixed",
          left: 12,
          top: isMobileViewport ? "104px" : "96px",
          zIndex: 80,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={
            isMobileViewport ? "h-4 w-4 text-gray-800" : "h-5 w-5 text-gray-800"
          }
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>


      {/* Húzás fedvény (drag overlay) */}
      <div
        aria-hidden
        style={{
          transition: "opacity 180ms ease",
          opacity: isDraggingFile ? 0.18 : 0,
          pointerEvents: "none",
        }}
        className="fixed inset-0 bg-blue-500 z-40"
      />


      {/* Fő tartalom */}
      <div
        className="w-full p-8 min-h-screen"
        style={{
          pointerEvents: "auto",
          paddingBottom: "8rem",
        }}
      >
        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8">
            {/* Bal: Szoba szerkesztő */}
            <div
              className="yellow-card bg-[#FFFECE] p-8 rounded-lg shadow-md/40 fade-in-up delay-1"
              style={{ marginBottom: "1.5rem" }}
            >
              <div className="space-y-6">
                <div>
                  {/* Label 'Név', maxlength kliens-oldalon érvényesítve */}
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Név
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                    placeholder="Pl. Szép Megtekintésű Szoba"
                    style={{ color: "#111827" }}
                    maxLength={TITLE_MAX}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.title.length}/{TITLE_MAX}
                  </div>
                </div>


                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Szoba leírása
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 placeholder-gray-400 bg-white desc-area"
                    placeholder="Írd le a szoba jellemzőit..."
                    style={{ color: "#111827" }}
                    maxLength={DESC_MAX}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/{DESC_MAX}
                  </div>
                </div>


                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Szoba kategória
                    </label>
                    <select
                      name="type"
                      value={formData.type || ""}
                      onChange={(e) => {
                        // A select stringet ad vissza; konvertáljuk számmá vagy üresre
                          const val =
                            e.target.value === "" ? "" : Number(e.target.value);
                          setFormData((prev) => ({ ...prev, type: val }));
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      style={{ color: "#111827" }}
                    >
                      <option value="">Válassz kategóriát...</option>


                      {/* Ha a jelenlegi típus nincs a betöltött kategóriák között, mutassunk ideiglenes opciót */}
                      {formData.type &&
                        !categories.some((c) => c.id === formData.type) && (
                          <option key="current-type" value={formData.type}>
                            {`(Aktuális kategória: ${formData.type})`}
                          </option>
                        )}


                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>


                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Férőhely
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      min={1}
                      max={CAPACITY_MAX}
                      value={formData.capacity}
                      onChange={(e) => {
                        const v =
                          e.target.value === ""
                            ? ""
                            : Math.max(
                                1,
                                Math.min(
                                  CAPACITY_MAX,
                                  Number(e.target.value || 0)
                                )
                              );
                        handleInputChange({
                          target: {
                            name: "capacity",
                            type: "number",
                            value: v,
                          },
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "e" || e.key === "+")
                          e.preventDefault();
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
                      placeholder="Pl. 2"
                      style={{ color: "#111827" }}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Max: {CAPACITY_MAX}
                    </div>
                  </div>


                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Ár (Ft/fő/éj)
                    </label>
                    <input
                      type="number"
                      name="price"
                      min={1}
                      max={PRICE_MAX}
                      value={formData.price}
                      onChange={(e) => {
                        const v =
                          e.target.value === ""
                            ? ""
                            : Math.max(
                                1,
                                Math.min(PRICE_MAX, Number(e.target.value || 0))
                              );
                        handleInputChange({
                          target: { name: "price", type: "number", value: v },
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "e" || e.key === "+")
                          e.preventDefault();
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
                      placeholder="Pl. 100"
                      style={{ color: "#111827" }}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Max: {PRICE_MAX.toLocaleString("hu-HU")}
                    </div>
                  </div>
                </div>


                {/* Kiemelt checkbox */}
                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    name="isHighlighted"
                    checked={formData.isHighlighted}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    id="isHighlightedCheckbox"
                  />
                  <label
                    htmlFor="isHighlightedCheckbox"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Kiemelt szoba
                  </label>
                </div>


                {/* AC availability checkbox (ÚJ) */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    name="ac_availablity"
                    checked={!!formData.ac_availablity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        ac_availablity: e.target.checked ? 1 : 0,
                      }))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    id="acAvailCheckbox"
                  />
                  <label
                    htmlFor="acAvailCheckbox"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Légkondicionálás elérhető
                  </label>
                </div>


                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full mt-2 px-6 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold rounded-lg hover:bg-emerald-100 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? "Mentés..."
                      : isEditing
                      ? "Szoba frissítése"
                      : "Szoba hozzáadása"}
                  </button>


                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={loading}
                      className="w-full mt-2 px-6 py-3 bg-red-50 text-red-700 border border-red-200 font-semibold rounded-lg hover:bg-red-100 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? "Törlés..." : "Szoba törlése"}
                    </button>
                  )}
                </div>
              </div>
            </div>


            {/* Jobb: főkép előnézet és további képek kezelése */}
            <div
              className="yellow-card bg-[#FFFECE] p-8 rounded-lg shadow-md/40 fade-in-up delay-2"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{ marginBottom: "1.5rem" }}
            >
              <div className="flex flex-col items-center justify-start gap-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Szoba képe
                </h2>


                <div
                  className={`inner-white w-full transition-shadow duration-150 ${
                    isDraggingFile ? "ring-4 ring-blue-300" : ""
                  }`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleMainDrop}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    dragCounter.current += 1;
                    if (
                      e.dataTransfer?.types &&
                      Array.from(e.dataTransfer.types).includes("Files")
                    ) {
                      setIsDraggingFile(true);
                    }
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    dragCounter.current -= 1;
                    if (dragCounter.current <= 0) {
                      dragCounter.current = 0;
                      setIsDraggingFile(false);
                    }
                  }}
                >
                  {mainImagePreview ? (
                    <img
                      src={mainImagePreview}
                      alt="Szoba előnézete"
                      className="main-image"
                    />
                  ) : (
                    <div className="w-full h-80 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
                      <p className="text-gray-500">
                        Nincs kép — húzd ide vagy használd a gombot
                      </p>
                    </div>
                  )}
                </div>


                <div className="w-full flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => mainInputRef.current?.click()}
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100"
                  >
                    {mainImagePreview ? "Kép cseréje" : "Kép feltöltése"}
                  </button>


                  {mainImagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveMainImage}
                      className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100"
                    >
                      Kép eltávolítása
                    </button>
                  )}
                </div>


                <input
                  ref={mainInputRef}
                  id="mainImageInput"
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageChange}
                  className="hidden"
                />


                <div
                  className={`inner-white w-full mt-4 bg-white p-4 rounded-md border border-gray-200 transition-shadow duration-150 ${
                    isDraggingFile ? "ring-4 ring-blue-300" : ""
                  }`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleExtraDrop}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    dragCounter.current += 1;
                    if (
                      e.dataTransfer?.types &&
                      Array.from(e.dataTransfer.types).includes("Files")
                    ) {
                      setIsDraggingFile(true);
                    }
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    dragCounter.current -= 1;
                    if (dragCounter.current <= 0) {
                      dragCounter.current = 0;
                      setIsDraggingFile(false);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-600">
                      További képek (nem indexképek)
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => extraInputRef.current?.click()}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-sm hover:bg-emerald-100"
                      >
                        Képek hozzáadása
                      </button>
                      <button
                        type="button"
                        onClick={() => setExtraImages([])}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm"
                      >
                        Összes törlése
                      </button>
                    </div>
                  </div>


                  <input
                    ref={extraInputRef}
                    id="extraImagesInput"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleExtraInputChange}
                    className="hidden"
                  />


                  {extraImages.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      Nincsenek további képek — húzd ide vagy használd a gombot
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {extraImages.map((img, idx) => (
                        <div
                          key={img.id}
                          className="extra-image-item flex items-center gap-3 bg-gray-50 p-2 rounded-md"
                        >
                          <div className="w-20 h-14 bg-gray-100 rounded overflow-hidden shrink-0">
                            {img.preview ? (
                              <img
                                src={img.preview}
                                alt={`extra-${idx}`}
                                className="thumb-image"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                Feltöltés...
                              </div>
                            )}
                          </div>


                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {img.file?.name || `Kép ${idx + 1}`}
                            </p>
                            <div className="text-xs text-gray-500">
                              Előnézet
                            </div>
                          </div>


                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveExtraImage(img.id, "up")}
                              disabled={idx === 0}
                              className="px-2 py-1 bg-white border rounded text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 transition-colors"
                              title="Felfele"
                            >
                              ▲
                            </button>


                            <button
                              type="button"
                              onClick={() => moveExtraImage(img.id, "down")}
                              disabled={idx === extraImages.length - 1}
                              className="px-2 py-1 bg-white border rounded text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 transition-colors"
                              title="Lefele"
                            >
                              ▼
                            </button>


                            <button
                              type="button"
                              onClick={() => handleRemoveExtraImage(img.id)}
                              className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100"
                              title="Eltávolít"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>


                <div className="w-full mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Elrendezett további képek
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {extraImages.length === 0 ? (
                      <div className="col-span-3 text-gray-500 text-sm">
                        Nincsenek további képek
                      </div>
                    ) : (
                      extraImages.map((img) => (
                        <div
                          key={img.id}
                          className="w-full h-24 overflow-hidden rounded-md border"
                        >
                          {img.preview ? (
                            <img
                              src={img.preview}
                              alt="extra"
                              className="thumb-image"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toast toasts={toasts} removeToast={removeToast} />

      {showDeleteConfirm && (
        <div className="confirm-modal-overlay fixed inset-0 z-1300 flex items-center justify-center bg-black/40 px-4">
          <div className="confirm-modal-card w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Szoba törlése</h3>
            <p className="mt-2 text-sm text-gray-700">
              Biztosan törölni szeretnéd ezt a szobát? Ez a művelet nem vonható vissza.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-60"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                disabled={loading}
                className="px-3 py-2 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                {loading ? "Törlés..." : "Törlés"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default AdminKezeles;