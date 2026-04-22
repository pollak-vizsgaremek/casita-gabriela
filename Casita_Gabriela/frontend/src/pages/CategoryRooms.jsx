import React, { useEffect, useMemo, useState } from "react";
import OfferAdmin from "../components/OfferAdmin";
import Footer from "../components/Footer";
import api from "../services/api";
import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate, useParams } from "react-router";
import searchImg from "/search.jpg";

const CategoryRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("");
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const [people, setPeople] = useState("");
  const [searchError, setSearchError] = useState("");

  const { categoryName } = useParams();
  const navigate = useNavigate();

  const selectedCategory = useMemo(() => {
    if (!categoryName) return "";

    try {
      return decodeURIComponent(categoryName).trim();
    } catch {
      return categoryName.trim();
    }
  }, [categoryName]);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, 220]);

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

  const filteredRooms = useMemo(() => {
    if (!selectedCategory) return [];

    return rooms.filter(
      (room) =>
        room.category?.trim().toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [rooms, selectedCategory]);

  const categoryOptions = useMemo(
    () =>
      [...new Set(rooms.map((room) => room.category?.trim()).filter(Boolean))],
    [rooms]
  );

  useEffect(() => {
    fetchRooms();
  }, []);

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

  const handleSearch = (e) => {
    e.preventDefault();

    setSearchError("");
    const todayStr = new Date().toISOString().slice(0, 10);
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
      <div className="w-full h-[300px] relative flex items-center justify-center overflow-hidden">
        <motion.img
          src={searchImg}
          alt="search background"
          style={{ y }}
          className="absolute inset-0 w-full h-[120%] object-cover z-0"
        />

        <div className="absolute inset-0 bg-black/40 z-10"></div>

        <div className="relative z-20 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Találd meg a tökéletes szobát
          </h1>

          <p className="text-sm md:text-lg opacity-90 mb-5">
            Gyors, egyszerű és modern foglalás
          </p>

          {searchError && (
            <div className="text-base md:text-lg text-white mb-3 font-medium">
              {searchError}
            </div>
          )}
          <form
            onSubmit={handleSearch}
            className="bg-white/80 backdrop-blur-md text-gray-800 rounded-xl shadow-xl p-4 grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto"
          >
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <option value="">Összes kategória</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
              className="p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-red-400"
            />

            <input
              type="date"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              className="p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-red-400"
            />

            <input
              type="number"
              min={1}
              placeholder="Létszám"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e" || e.key === "+") {
                  e.preventDefault();
                }
              }}
              className="p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-red-400"
            />

            <button className="bg-red-500 hover:bg-red-600 text-white rounded-md px-4 py-2 transition font-semibold">
              Keresés
            </button>
          </form>
        </div>
      </div>

      <div className="w-full max-w-6xl px-6 mt-12 mb-12 mx-auto">
        <h2 className="text-3xl font-semibold text-gray-800">
          {selectedCategory || "Kategória"} szobák
        </h2>
        <div className="w-20 h-1 bg-red-500 mt-2 rounded"></div>

        <div className="mt-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={loading ? "hidden" : "visible"}
            className="flex flex-wrap gap-8"
          >
            {loading ? (
              <p className="text-gray-600">Szobák betöltése...</p>
            ) : filteredRooms.length === 0 ? (
              <p className="text-gray-600">Ebben a kategóriában nincs elérhető szoba.</p>
            ) : (
              filteredRooms.map((room) => (
                <motion.div
                  key={`category-room-${room.id}`}
                  variants={cardVariants}
                  whileHover={{ scale: 1.05 }}
                  className="transition-shadow hover:shadow-2xl rounded-xl"
                >
                  <OfferAdmin
                    id={room.id}
                    name={room.name}
                    price={room.price}
                    image={Array.isArray(room.images) ? room.images[0] : ""}
                    reviews={room.reviews || []}
                  />
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CategoryRooms;
