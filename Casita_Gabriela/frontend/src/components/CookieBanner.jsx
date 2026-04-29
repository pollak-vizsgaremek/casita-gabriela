import React, { useState, useEffect } from "react";

const REOPEN_DAYS = 180;

// Komponens: süti hozzájárulás kezelése és mentése localStorage-be
const CookieBanner = () => {
  // UI állapotok: megnyitva, testreszabás, és a checkboxok állapota
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [stats, setStats] = useState(true);
  const [marketing, setMarketing] = useState(true);
  const [showButton, setShowButton] = useState(false);
  const [closing, setClosing] = useState(false);

  // Inicializálás: ellenőrzi a korábbi hozzájárulást a localStorage-ban
  useEffect(() => {
    const saved = localStorage.getItem("cookie_consent_v2");

    if (!saved) {
      setTimeout(() => setOpen(true), 0);
      return;
    }

    const parsed = JSON.parse(saved);
    const last = parsed.timestamp;
    const diffDays = (Date.now() - last) / (1000 * 60 * 60 * 24);

    if (diffDays >= REOPEN_DAYS) {
      setTimeout(() => setOpen(true), 0);
    } else {
      setTimeout(() => setShowButton(true), 0);
    }
  }, []);

  // Animált bezárás
  const closeWithAnimation = () => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 350);
  };

  // Mentés: a választott sütik beállítása localStorage-be és esemény kibocsátása
  const saveConsent = (accepted, custom = false) => {
    const data = {
      necessary: true,
      statistics: custom ? stats : accepted,
      marketing: custom ? marketing : accepted,
      timestamp: Date.now(),
    };

    localStorage.setItem("cookie_consent_v2", JSON.stringify(data));
    closeWithAnimation();
    setShowButton(true);

    window.dispatchEvent(new Event("cookie-consent-updated"));
  };

  return (
    <>
      {/* Kicsinyített gomb, ha a banner bezárva van */}
      {showButton && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 left-5 z-9999 text-5xl leading-none hover:scale-110 transition-transform"
        >
          🍪
        </button>
      )}

      {/* Háttér overlay a banner megnyitásakor */}
      {open && <div className="fixed inset-0 bg-black/30 z-9998" />}

      {/* Kompakt banner alapnézet */}
      {open && !customize && (
        <div
          className={`fixed bottom-0 left-0 w-full z-9999 transition-all duration-300 ${
            closing
              ? "opacity-0 translate-y-10"
              : "opacity-100 translate-y-0 animate-slideup"
          }`}
        >
          <div className="w-full bg-[#f4f4f4] border-t border-gray-300 shadow-xl px-4 py-3 md:px-8 md:py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
              {/* Magyarázó szöveg és CTA gombok */}
              <div className="flex-1">
                <h2 className="text-base md:text-lg font-bold text-gray-900 mb-0.5 flex items-center gap-2 justify-center md:justify-start">
                  Szereted a sütiket? <span className="text-xl">🍪</span>
                </h2>
                <p className="text-gray-800 text-xs md:text-sm leading-tight text-center md:text-left max-w-3xl">
                  Sütiket használunk a weboldal működéséhez, a látogatói élmény fokozásához és elemzésekhez. A statisztikai és marketing sütik csak hozzájárulás után aktiválódnak.
                </p>
              </div>

              {/* Gyorsgombok: Elfogadom / Elutasítom / Beállítások */}
              <div className="flex flex-wrap justify-center md:justify-end gap-2 items-center shrink-0">
                <button
                  onClick={() => saveConsent(true)}
                  className="px-5 py-2 text-xs md:text-sm font-semibold bg-green-300 text-black hover:bg-green-400 transition rounded"
                >
                  Elfogadom
                </button>

                <button
                  onClick={() => saveConsent(false)}
                  className="px-5 py-2 text-xs md:text-sm font-medium border border-black text-black bg-white hover:bg-gray-100 transition rounded"
                >
                  Elutasítom
                </button>

                <button
                  onClick={() => setCustomize(true)}
                  className="px-5 py-2 text-xs md:text-sm font-medium bg-yellow-500 text-white hover:bg-yellow-600 transition rounded"
                >
                  Beállítások
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Testreszabó modal: checkboxok és mentés */}
      {open && customize && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-9999 transition-all duration-300 ${
            closing
              ? "opacity-0 scale-90"
              : "opacity-100 scale-100 animate-scalein"
          }`}
        >
          <div className="bg-[#fafafa] border border-gray-300 shadow-2xl rounded-lg p-6 md:p-8 max-w-xl w-[90%] space-y-4 md:space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Süti beállítások</h2>

            <div className="p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 text-sm md:text-base">Szükséges sütik</h3>
                <span className="text-[10px] bg-gray-300 text-gray-700 px-2 py-0.5 rounded">Mindig aktív</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Ezek a sütik szükségesek az oldal működéséhez.</p>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 text-sm md:text-base">Statisztikai sütik</h3>
                <input type="checkbox" checked={stats} onChange={(e) => setStats(e.target.checked)} className="w-4 h-4" />
              </div>
              <p className="text-xs text-gray-600 mt-1">Segít megérteni, hogyan használják a látogatók az oldalt.</p>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 text-sm md:text-base">Marketing sütik</h3>
                <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="w-4 h-4" />
              </div>
              <p className="text-xs text-gray-600 mt-1">Személyre szabott hirdetések megjelenítéséhez.</p>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button onClick={() => setCustomize(false)} className="px-4 py-2 border border-black text-black text-xs bg-white hover:bg-gray-100 transition">Vissza</button>
              <button onClick={() => saveConsent(false, true)} className="px-4 py-2 bg-red-500 text-white text-xs hover:bg-red-600 transition">Csak szükséges</button>
              <button onClick={() => saveConsent(true, true)} className="px-4 py-2 bg-green-300 text-black text-xs hover:bg-green-400 transition">Mentés</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideup { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slideup { animation: slideup 0.35s ease-out; }
        @keyframes scalein { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scalein { animation: scalein 0.3s ease-out; }
      `}</style>
    </>
  );
};

export default CookieBanner;
