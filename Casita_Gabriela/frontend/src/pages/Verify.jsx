// Verify.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Verify() {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const backendBase = import.meta.env.VITE_API_BASE || "http://localhost:6969";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Hiányzó token. Ellenőrizd a linket.");
      return;
    }

    const verify = async () => {
      try {
        const res = await axios.get(`${backendBase}/verify-registration`, {
          params: { token }
        });

        setStatus("success");
        setMessage(res.data?.message || "Regisztráció sikeres!");
      } catch (err) {
        const serverMsg = err.response?.data?.error || err.response?.data?.message;
        setStatus("error");
        setMessage(serverMsg || "Hiba történt a megerősítés során.");
      }
    };

    verify();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-md rounded-lg p-6 max-w-md w-full text-center">

        {status === "loading" && (
          <p className="text-gray-700">Regisztráció megerősítése folyamatban…</p>
        )}

        {status === "success" && (
          <>
            <h2 className="text-xl font-semibold text-green-600 mb-3">Sikeres regisztráció!</h2>
            <p className="text-gray-700 mb-4">{message}</p>
            <button
              onClick={() => navigate("/login")}
              className="bg-[#6FD98C] text-white px-4 py-2 rounded hover:bg-[#5FCB80] transition"
            >
              Tovább a bejelentkezéshez
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <h2 className="text-xl font-semibold text-red-600 mb-3">Hiba történt</h2>
            <p className="text-gray-700 mb-4">{message}</p>
            <button
              onClick={() => navigate("/registration")}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
            >
              Vissza a regisztrációhoz
            </button>
          </>
        )}

      </div>
    </div>
  );
}
