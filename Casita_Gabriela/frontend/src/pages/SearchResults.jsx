import React, { useEffect, useMemo, useState } from 'react'
import OfferAdmin from '../components/OfferAdmin'
import { useLocation, useNavigate } from 'react-router'
import Footer from '../components/Footer'
import api from '../services/api'
import { motion } from "framer-motion"

const SearchResults = () => {
  const [rooms, setRooms] = useState([])
  const [categories, setCategories] = useState([])
  const [filteredRooms, setFilteredRooms] = useState([])
  const [loading, setLoading] = useState(true)

  const [animationKey, setAnimationKey] = useState(0)

  const location = useLocation()
  const navigate = useNavigate()

  // Keresési űrlap állapota
  const [category, setCategory] = useState('')
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [people, setPeople] = useState('')
  const [searchError, setSearchError] = useState('')

  const todayStr = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [])

  const categoryOptions = useMemo(() => {
    const names = []
    const seen = new Set()

    const addName = (value) => {
      const name = String(value || '').trim()
      if (!name) return
      const key = name.toLowerCase()
      if (seen.has(key)) return
      seen.add(key)
      names.push(name)
    }

    categories
      .filter((cat) =>
        rooms.some(
          (room) =>
            String(room?.category || '').trim().toLowerCase() ===
            String(cat?.name || '').trim().toLowerCase()
        )
      )
      .forEach(cat => addName(cat?.name))
    rooms.forEach(room => addName(room?.category))

    return names
  }, [categories, rooms])

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  // URL paramok szinkronizálása a beviteli mezőkkel
  useEffect(() => {
    const params = new URLSearchParams(location.search)

    const categoryParams = params.getAll("category")
    setCategory(categoryParams[0] || params.get("category") || '')
    setArrival(params.get("arrival") || '')
    setDeparture(params.get("departure") || '')
    setPeople(params.get("people") || '')
  }, [location.search])

  useEffect(() => {
    if (rooms.length > 0) {
      filterRooms()
    }
  }, [rooms, location.search])

  // Animáció újraindítása, ha a találatok listája változik
  useEffect(() => {
    setAnimationKey(prev => prev + 1)
  }, [filteredRooms])

  useEffect(() => {
    fetchRooms()
    fetchCategories()
  }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const res = await api.get('/rooms')
      setRooms(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories')
      setCategories(res.data)
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const parseIsoDate = (value) => {
    if (!value) return null

    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    }

    const datePart = String(value).includes('T') ? String(value).split('T')[0] : String(value)
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart)
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))

    return null
  }

  const statusBlocksAvailability = (status) => {
    const s = (status || '').toString().toLowerCase()
    if (!s) return true
    if (s.includes('rejected') || s.includes('elutas') || s.includes('cancel') || s.includes('lemond')) return false
    return true
  }

  const isRoomAvailableForSearch = (room, arrivalParam, departureParam) => {
    const bookings = Array.isArray(room?.booking) ? room.booking : []
    const start = parseIsoDate(arrivalParam)
    const end = parseIsoDate(departureParam)

    if (!start && !end) return true

    // ha csak egy dátum van megadva, akkor azt egyéjszakás/napos foglaltsági vizsgálatként kezelje
    const probeStart = start || end
    const probeEnd = end || (start ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1) : null)
    if (!probeStart || !probeEnd) return true

    const rangeStart = probeStart.getTime()
    const rangeEnd = probeEnd.getTime()

    return !bookings.some((b) => {
      if (!statusBlocksAvailability(b.status)) return false
      const bStart = parseIsoDate(b.arrival_date || b.arrivalDate)
      const bEnd = parseIsoDate(b.departure_date || b.departureDate)
      if (!bStart || !bEnd) return false

      const bookingStart = bStart.getTime()
      const bookingEnd = bEnd.getTime()
      return rangeStart < bookingEnd && rangeEnd > bookingStart
    })
  }

  const filterRooms = () => {
    const params = new URLSearchParams(location.search)

    const categoryParam = params.getAll("category")[0] || params.get("category")
    const peopleParam = params.get("people")
    const arrivalParam = params.get("arrival")
    const departureParam = params.get("departure")

    let results = [...rooms]

    if (categoryParam) {
      results = results.filter(room =>
        room.category?.trim().toLowerCase() === categoryParam.trim().toLowerCase()
      )
    }

    if (peopleParam) {
      const peopleCount = parseInt(peopleParam, 10)
      results = results.filter(room =>
        Number(room.space) >= peopleCount
      )
    }

    if (arrivalParam || departureParam) {
      results = results.filter(room => {
        return isRoomAvailableForSearch(room, arrivalParam, departureParam)
      })
    }

    setFilteredRooms(results)
  }

  const handleSearch = (e) => {
    e.preventDefault()

    setSearchError('')
    if (arrival && arrival < todayStr) {
      setSearchError('Az érkezési dátum nem lehet a múltban.')
      return
    }
    if (departure && departure < todayStr) {
      setSearchError('A távozási dátum nem lehet a múltban.')
      return
    }
    if (arrival && departure && departure <= arrival) {
      setSearchError('A távozási dátumnak később kell lennie, mint az érkezési dátumnak.')
      return
    }

    const params = new URLSearchParams()

    if (category) params.append("category", category)
    if (arrival) params.append("arrival", arrival)
    if (departure) params.append("departure", departure)
    if (people) params.append("people", people)

    navigate(`/search?${params.toString()}`)
  }

  return (
    <div className='flex flex-col items-center w-full min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden'>

      {/* Kereső sáv */}
      {/* Hero / kereső sáv: háttérkép és kereső űrlap */}
      <div className='w-full h-auto sm:h-[400px] md:h-[340px] relative flex items-center justify-center overflow-hidden py-10 sm:py-0'>
        <img
          src="/search.jpg"
          alt="search background"
          className="absolute inset-0 w-full h-[120%] object-cover z-0"
        />
        <div className='absolute inset-0 bg-black/40 z-10'></div>

        <div className='relative z-20 text-center text-white px-4 w-full max-w-6xl mx-auto'>
          <h1 className='text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3 leading-tight'>
            Találd meg a számodra megfelelő szobát!
          </h1>

          <p className='text-sm sm:text-base md:text-lg opacity-90 mb-3 sm:mb-5'>
            Gyors, egyszerű és modern foglalás
          </p>

          {searchError && (
            <div className="text-base md:text-lg text-white mb-3 font-medium">
              {searchError}
            </div>
          )}

          <form
            onSubmit={handleSearch}
            className='bg-white/80 backdrop-blur-md text-gray-800 rounded-xl shadow-xl p-2 sm:p-4 grid grid-cols-2 md:grid-cols-5 gap-1.5 sm:gap-3 max-w-4xl mx-auto'
          >
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className='w-full p-1.5 sm:p-2 text-xs sm:text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-red-400 order-1 md:order-1'
            >
              <option value="">Összes kategória</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <input
              type="number"
              min={1}
              placeholder='Létszám'
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === '+') e.preventDefault(); }}
              className='w-full p-1.5 sm:p-2 text-xs sm:text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-red-400 order-2 md:order-4'
            />

            <input
              type="date"
              min={todayStr}
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
              className='w-full p-1.5 sm:p-2 text-xs sm:text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-red-400 order-3 md:order-2'
            />

            <input
              type="date"
              min={arrival || todayStr}
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              className='w-full p-1.5 sm:p-2 text-xs sm:text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-red-400 order-4 md:order-3'
            />

            <button className='w-full bg-red-500 hover:bg-red-600 text-white rounded-md px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition font-semibold col-span-2 md:col-span-1 order-5 md:order-5'>
              Keresés
            </button>
          </form>
        </div>
      </div>

      {/* Találatok fejléc: vizuális elválasztó */}
        <div className='w-full h-[110px] sm:h-40 flex items-end'> 
        <div className='w-full flex items-center justify-center gap-3 sm:gap-4 px-4 sm:px-6'> 
          <hr className='flex-1 border-t-2 border-[#4f4f4f]/70' /> 
          <h1 className='text-shadow-lg/10 font-mono text-[#4f4f4f] text-xl sm:text-3xl md:text-4xl text-center whitespace-nowrap'>KERESÉSI TALÁLATOK</h1> 
          <hr className='flex-1 border-t-2 border-[#4f4f4f]/70' /> 
        </div> 
      </div>

      {/* Találatok száma */}
      <h1 className='text-2xl sm:text-3xl mt-1 sm:mt-2 text-[#4f4f4f]'>
        {filteredRooms.length}
      </h1>

      {/* Találatok lista: animált kártyák */}
      <div className='w-full max-w-6xl px-4 sm:px-6 mt-4 sm:mt-6 mb-8 sm:mb-10 mx-auto'>
        <motion.div
          key={animationKey}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className='flex flex-wrap justify-center lg:justify-start gap-6 sm:gap-8'
        >
          {loading ? (
            <p className='text-gray-600'>Betöltés...</p>
          ) : filteredRooms.length === 0 ? (
            <p className='text-gray-600'>Nincs találat.</p>
          ) : (
            // Minden találatot egy OfferAdmin komponenssel jelenítünk meg
            filteredRooms.map(room => (
              <motion.div
                key={room.id}
                variants={itemVariants}
                className='w-[calc(50%-0.75rem)] sm:w-auto transition-shadow hover:shadow-2xl rounded-xl'
              >
                <OfferAdmin
                  id={room.id}
                  name={room.name}
                  price={room.price}
                  image={Array.isArray(room.images) ? room.images[0] : ''}
                  reviews={room.reviews || []}
                  className='w-full sm:w-72'
                />
              </motion.div>
            ))
          )}
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}

export default SearchResults