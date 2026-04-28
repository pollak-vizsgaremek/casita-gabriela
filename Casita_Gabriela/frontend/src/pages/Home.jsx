import React, { useState, useEffect, useMemo } from "react";

import OfferAdmin from "../components/OfferAdmin";

import Footer from "../components/Footer";

import api from "../services/api";

import { motion, useScroll, useTransform } from "framer-motion";

import { useNavigate } from "react-router";

import searchImg from "/search.jpg";

// segéd: szám formázása ezres elválasztóval (space minden 3 számjegy után)
const formatPriceWithSpaces = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) {
    // ha nem szám, visszaadjuk eredetileg stringként
    return String(value);
  }
  // egész rész formázása: 1 234 567
  const parts = String(Math.trunc(Math.abs(num))).split("");
  const rev = parts.reverse().join("");
  const grouped = rev.replace(/(\d{3})(?=\d)/g, "$1 ");
  const normal = grouped.split("").reverse().join("").trim();
  return (num < 0 ? "-" : "") + normal;
};

const Home = () => {
  // állapotok: szobák, kategóriák, űrlap mezők, betöltés
  const [rooms, setRooms] = useState([]);
  const [categoryDefs, setCategoryDefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const [people, setPeople] = useState("");
  const [searchError, setSearchError] = useState("");
  const navigate = useNavigate();

  // mai dátum string formátumban (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  // jelenlegi felhasználó (localStorage-ból)
  const currentUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  const isFirstTimeUser = currentUser?.isFirstTimeUser === true;

  // parallax effekthez scroll érték
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, 220]);

  // animáció variánsok
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.18,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  // komponens betöltésekor lekérjük az adatokat
  useEffect(() => {
    fetchRooms();
    fetchCategories();
  }, []);

  // kategória definíciók és szobák alapján számoljuk a kategória darabszámokat
  const categories = useMemo(() => {
    return (categoryDefs || [])
      .map((cat) => {
        const count = rooms.filter(
          (r) =>
            (r.category || "").trim().toLowerCase() ===
            (cat.name || "").trim().toLowerCase()
        ).length;
        return { ...cat, count };
      })
      .filter((cat) => (cat.count || 0) > 0);
  }, [categoryDefs, rooms]);

  // keresési opciók: kategória nevek deduplikálva
  const categorySearchOptions = useMemo(() => {
    const names = [];
    const seen = new Set();
    const addName = (value) => {
      const name = String(value || "").trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      names.push(name);
    };
    (categoryDefs || [])
      .filter((c) =>
        (rooms || []).some(
          (r) =>
            (r?.category || "").trim().toLowerCase() ===
            String(c?.name || "").trim().toLowerCase()
        )
      )
      .forEach((c) => addName(c?.name));
    (rooms || []).forEach((r) => addName(r?.category));
    return names;
  }, [categoryDefs, rooms]);

  // API hívások
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get("/rooms");
      setRooms(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategoryDefs(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  // keresés űrlap kezelése
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchError("");
    if (arrival && arrival < todayStr) {
      setSearchError("Az érkezési dátum nem lehet a múltban.");
      return;
    }
    if (departure && departure < todayStr) {
      setSearchError("A távozási dátum nem lehet a múltban.");
      return;
    }
    if (arrival && departure && departure <= arrival) {
      setSearchError(
        "A távozási dátumnak később kell lennie, mint az érkezési dátumnak."
      );
      return;
    }
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (arrival) params.append("arrival", arrival);
    if (departure) params.append("departure", departure);
    if (people) params.append("people", people);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div
      className="flex flex-col items-center w-full min-h-screen
    bg-linear-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden"
    >
      {/* HERO */}
      <div className="w-full h-auto sm:h-[400px] md:h-[340px] relative flex items-center justify-center overflow-hidden py-10 sm:py-0">
        {/* háttérkép parallax */}
        <motion.img
          src={searchImg}
          alt="search background"
          style={{ y }}
          className="absolute inset-0 w-full h-[120%] object-cover z-0"
        />

        {/* sötét réteg */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>

        {/* tartalom */}
        <div className="relative z-20 text-center text-white px-4 w-full max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3 leading-tight">
            Találd meg a tökéletes szobát
          </h1>

          <p className="text-sm sm:text-base md:text-lg opacity-90 mb-3 sm:mb-5">
            Gyors, egyszerű és modern foglalás
          </p>

          {searchError && (
            <div className="text-base md:text-lg text-white mb-3 font-medium">
              {searchError}
            </div>
          )}

          {/* kereső űrlap */}
          <form
            onSubmit={handleSearch}
            className="bg-white/80 backdrop-blur-md text-gray-800 rounded-xl shadow-xl p-2 sm:p-4 grid grid-cols-2 md:grid-cols-5 gap-1.5 sm:gap-3 max-w-4xl mx-auto"
          >
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-1.5 sm:p-2 text-xs sm:text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-red-400 order-1 md:order-1 cursor-pointer"
            >
              <option value="">Összes kategória</option>
              {categorySearchOptions.map((catName) => (
                <option key={catName} value={catName}>
                  {catName}
                </option>
              ))}
            </select>

            <input
              type="number"
              min={1}
              placeholder="Létszám"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e" || e.key === "+")
                  e.preventDefault();
              }}
              className="w-full p-1.5 sm:p-2 text-xs sm:text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-red-400 order-2 md:order-4"
            />

            <input
              type="date"
              min={todayStr}
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
              className="w-full p-1.5 sm:p-2 text-xs sm:text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-red-400 order-3 md:order-2"
            />

            <input
              type="date"
              min={arrival || todayStr}
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              className="w-full p-1.5 sm:p-2 text-xs sm:text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-red-400 order-4 md:order-3"
            />

            <button className="w-full bg-red-500 hover:bg-red-600 text-white rounded-md px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition font-semibold col-span-2 md:col-span-1 order-5 md:order-5">
              Keresés
            </button>
          </form>
        </div>
      </div>

      {/* FŐ TARTALOM */}
      <div className="w-full max-w-6xl px-4 sm:px-6 mt-8 sm:mt-12 mb-6 mx-auto">
        {/* első foglalás kedvezmény */}
        {isFirstTimeUser && (
          <div className="mt-3 mb-8 p-4 sm:p-6 bg-[#FFFECE] border border-gray-100 rounded-2xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-4">
              <div className="bg-white text-red-600 p-3 rounded-lg text-2xl font-extrabold">
                15%
              </div>

              <div>
                <div className="text-lg sm:text-2xl font-semibold text-gray-900 leading-tight">
                  15% kedvezmény az első foglalásodra
                </div>

                <div className="text-sm text-gray-600 mt-1">
                  A kedvezmény automatikusan érvényesül a fizetésnél — nincs
                  teendőd.
                </div>
              </div>
            </div>

            <div className="text-sm font-medium mt-2 md:mt-0 text-green-700">
              Automatikusan alkalmazva
            </div>
          </div>
        )}

        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800">Kiemelt szobák</h2>

        <div className="w-20 h-1 bg-red-500 mt-2 rounded"></div>

        <div className="relative mt-6 -mx-4 sm:mx-0">
          {loading ? (
            <p className="text-gray-600 px-4">Szobák betöltése...</p>
          ) : (
            <>
              {/* Kiemelt szobák rács elrendezés: mobilon 2 oszlop, kis tableten 3, nagyobb képernyőn 4 */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-0"
              >
                {rooms
                  .filter((r) => r.isHighlighted)
                  .map((room) => (
                    <motion.div
                      key={`highlight-${room.id}`}
                      variants={cardVariants}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full"
                    >
                      {/* OfferAdmin komponensnek továbbítjuk az eredeti price értéket és a formázott stringet, valamint a kategóriát */}
                      <OfferAdmin
                        id={room.id}
                        name={room.name}
                        // price mező most formázott stringként: minden ezresnél szóköz
                        price={formatPriceWithSpaces(room.price)}
                        image={Array.isArray(room.images) ? room.images[0] : ""}
                        reviews={room.reviews || []}
                        category={room.category}
                        className="w-full"
                      />
                    </motion.div>
                  ))}
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* kategóriák */}
      <div className="w-full max-w-6xl px-4 sm:px-6 mt-8 mb-12 mx-auto">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-700">Kategóriák</h3>

        <div className="w-16 h-1 bg-gray-300 mt-2 rounded"></div>

        <div className="mt-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={loading ? "hidden" : "visible"}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {loading ? (
              <p className="text-gray-600">Kategóriák betöltése...</p>
            ) : categories.length === 0 ? (
              <p className="text-gray-600">Jelenleg nincs elérhető kategória.</p>
            ) : (
              categories.map((cat) => (
                // kattintható kártya: kurzor pointer és hover effekt
                <motion.button
                  type="button"
                  key={cat.id}
                  variants={cardVariants}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate(`/category/${encodeURIComponent(cat.name)}`)}
                  className="relative h-[220px] rounded-2xl overflow-hidden shadow-lg text-left group cursor-pointer"
                >
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={`${cat.name} kategória`}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-gray-300 to-gray-400" />
                  )}

                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition" />

                  <div className="relative z-10 h-full w-full p-5 flex flex-col justify-end text-white">
                    <h4 className="text-2xl font-bold leading-tight">{cat.name}</h4>
                    <p className="text-sm opacity-90 mt-1">
                      {cat.count || 0} szoba • Megtekintés
                    </p>
                  </div>
                </motion.button>
              ))
            )}
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Home;
