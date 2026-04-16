import React from 'react';
import { Route, Routes } from 'react-router';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Registration from './pages/Registration';
import Login from './pages/Login';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Room from './pages/Room';
import './App.css'
import Layout from './Layout';
import Aszf from './pages/Aszf';
import Adatkezeles from './pages/Adatkezeles';
import Impresszum from './pages/Impresszum';
import AdminKezeles from './pages/AdminKezeles';
import SearchResults from './pages/SearchResults';

// ÚJ ADMIN OLDALAK
import Foglalasok from './pages/Foglalasok';
import Reviews from './pages/Reviews';
import Users from './pages/Users';

const App = () => {
    return (
        <>
            <Routes>
                <Route element={<Layout />}>

                    {/* PUBLIC OLDALAK */}
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/registration" element={<Registration />} />

                    <Route path="/room/:id" element={<Room />} />
                    <Route path="/search" element={<SearchResults />} />

                    {/* ADMIN OLDALAK */}
                    <Route path="/admin" element={<Admin />} />

                    {/* Szoba szerkesztés */}
                    <Route path="/AdminKezeles" element={<AdminKezeles />} />
                    <Route path="/AdminKezeles/:id" element={<AdminKezeles />} />

                    {/* Foglalások kezelése */}
                    <Route path="/admin/bookings" element={<Foglalasok />} />

                    {/* Értékelések */}
                    <Route path="/admin/reviews" element={<Reviews />} />

                    {/* Felhasználók kezelése */}
                    <Route path="/admin/users" element={<Users />} />

                    {/* LÁBLÉC OLDALAK */}
                    <Route path="/aszf" element={<Aszf />} />
                    <Route path="/adatkezeles" element={<Adatkezeles />} />
                    <Route path="/impresszum" element={<Impresszum />} />

                </Route>
            </Routes>
        </>
    );
};

export default App;
