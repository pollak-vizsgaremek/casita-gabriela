import React from 'react'

// Rövid értesítések kezelése és megjelenítése (toast-ok)
const Toast = ({ toasts, removeToast }) => {
  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-3 items-end">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="max-w-sm w-full bg-white/95 text-black rounded-lg shadow-lg border border-gray-200 overflow-hidden"
          role="alert"
        >
          <div className="p-3 flex items-start gap-3">
            <div className="flex-shrink-0">
              {t.type === 'success' ? (
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12A9 9 0 1112 3a9 9 0 019 9z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{t.title || (t.type === 'success' ? 'Sikeres' : 'Hiba')}</div>
              {t.message && <div className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{t.message}</div>}
            </div>
            <div className="ml-3">
              <button onClick={() => removeToast(t.id)} className="text-gray-500 hover:text-gray-700 p-1 rounded" aria-label="Bezár">
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = React.useState([])
  // Hook: toast létrehozása, automatikus eltűnés és manuális eltávolítás
  const pushToast = (title, message = '', type = 'success', ttl = 4000) => {
    const id = Date.now() + Math.random()
    setToasts((s) => [...s, { id, title, message, type }])
    setTimeout(() => {
      setToasts((s) => s.filter((t) => t.id !== id))
    }, ttl)
  }

  const removeToast = (id) => {
    setToasts((s) => s.filter((t) => t.id !== id))
  }

  return { toasts, pushToast, removeToast }
}

export default Toast
