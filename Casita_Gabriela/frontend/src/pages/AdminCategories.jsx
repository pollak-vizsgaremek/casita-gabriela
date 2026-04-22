import React, { useState, useEffect } from 'react'
import api from '../services/api'
import Sidebar from '../components/Sidebar'
import Toast, { useToast } from '../components/Toast'
import { useLocation } from 'react-router'

const AdminCategories = () => {
  const location = useLocation()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ name: '', image: '' })
  const { toasts, pushToast, removeToast } = useToast()

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await api.get('/categories')
      setCategories(response.data)
    } catch (err) {
      console.error('Error fetching categories:', err)
      pushToast('Hiba', 'Hiba a kategóriák betöltésekor', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const formDataUpload = new FormData()
    formDataUpload.append('images', files[0])

    try {
      const response = await api.post('/upload-images', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (response.data.paths && response.data.paths.length > 0) {
        setFormData(prev => ({ ...prev, image: response.data.paths[0] }))
      }
    } catch (err) {
      console.error('Error uploading image:', err)
      pushToast('Hiba', 'Hiba a kép feltöltésekor', 'error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.image.trim()) {
      pushToast('Hiba', 'Kérjük, töltsd ki az összes mezőt', 'error')
      return
    }

    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, formData)
        pushToast('Sikeres', 'Kategória sikeresen frissítve', 'success')
      } else {
        await api.post('/categories', formData)
        pushToast('Sikeres', 'Kategória sikeresen létrehozva', 'success')
      }
      await fetchCategories()
      setFormData({ name: '', image: '' })
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      console.error('Error saving category:', err)
      const errorMsg = err.response?.data?.error || 'Hiba a kategória mentésekor'
      pushToast('Hiba', errorMsg, 'error')
    }
  }

  const handleEdit = (category) => {
    setFormData({ name: category.name, image: category.image })
    setEditingId(category.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Biztosan törölni szeretnéd ezt a kategóriát?')) return

    try {
      await api.delete(`/categories/${id}`)
      pushToast('Sikeres', 'Kategória sikeresen törölve', 'success')
      await fetchCategories()
    } catch (err) {
      console.error('Error deleting category:', err)
      pushToast('Hiba', 'Hiba a kategória törlésénél', 'error')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setFormData({ name: '', image: '' })
    setEditingId(null)
  }

  return (
    <div className="flex min-h-screen w-dvw bg-[#f7faf7]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 ml-0 md:ml-64">
        {/* MOBILE HEADER */}
        <header className="flex items-center justify-between px-5 py-4 border-b bg-white md:hidden">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
            aria-label="Menü"
          >
            <svg className="h-6 w-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="text-lg font-semibold">Kategóriák kezelése</div>
          <div style={{ width: 36 }} />
        </header>

        {/* MAIN */}
        <main className="px-5 pt-5">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Kategóriák</h2>

          {/* FORM */}
          {showForm && (
            <div className="bg-white p-6 rounded-xl shadow-md mb-6 text-gray-900">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                {editingId ? 'Kategória szerkesztése' : 'Új kategória'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900">Kategória neve</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    placeholder="pl. Deluxe szoba"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900">Kategória képe</label>
                  {formData.image && (
                    <div className="mb-3">
                      <img
                        src={formData.image}
                        alt="Category"
                        className="h-32 w-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md transition"
                  >
                    {editingId ? 'Frissítés' : 'Létrehozás'}
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
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))' }}
          >
            <button
              onClick={() => {
                setFormData({ name: '', image: '' })
                setEditingId(null)
                setShowForm(true)
              }}
              className="
                bg-[#9FE3A8]
                rounded-xl
                w-full h-72
                shadow-md
                hover:cursor-pointer
                hover:rotate-1
                transition-all duration-300
                hover:shadow-2xl
                active:shadow-green-500
                flex flex-col items-center justify-center
                relative
                animate-fadein
              "
            >
              <div className="relative flex items-center justify-center w-24 h-24">
                <div className="absolute w-24 h-24 rounded-full border-4 border-green-400 border-t-transparent animate-spin-slow"></div>
                <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center shadow-lg z-10">
                  <span className="text-white text-4xl select-none">+</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <h3 className="text-xl font-semibold text-gray-800">Új kategória</h3>
                <p className="text-sm text-gray-600 mt-1">Kattints ide új kategória létrehozásához</p>
              </div>
            </button>

            {loading ? (
              <p className="text-gray-500 col-span-full">Kategóriák betöltése...</p>
            ) : categories.length === 0 ? (
              <p className="text-gray-500 col-span-full">Még nincsenek kategóriák.</p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="animate-fadein w-full h-72 rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 bg-white relative"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="inline-block text-lg font-semibold text-gray-900 bg-white/90 px-3 py-1 rounded-md mb-3">{category.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md transition text-sm"
                      >
                        Szerkesztés
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md transition text-sm"
                      >
                        Törlés
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

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
      `}</style>
    </div>
  )
}

export default AdminCategories
