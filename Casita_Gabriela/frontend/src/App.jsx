import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Registration from './pages/Registration';
import Verify from './pages/Verify';
import Login from './pages/Login';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
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
import UserBooking from './pages/UserBooking';
import UserData from './pages/UserData';
import UserReviews from './pages/UserReviews';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

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
                    <Route path="/verify" element={<Verify />} />

                    <Route path="/room/:id" element={<Room />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* ADMIN OLDALAK */}
                    <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

                    {/* Szoba szerkesztés */}
                    <Route path="/AdminKezeles" element={<ProtectedRoute><AdminKezeles /></ProtectedRoute>} />
                    <Route path="/AdminKezeles/:id" element={<ProtectedRoute><AdminKezeles /></ProtectedRoute>} />

                    {/* Foglalások kezelése */}
                    <Route path="/admin/bookings" element={<ProtectedRoute><Foglalasok /></ProtectedRoute>} />

                    {/* Értékelések */}
                    <Route path="/admin/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />

                    {/* Felhasználók kezelése */}
                    <Route path="/admin/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />

                    {/* LÁBLÉC OLDALAK */}
                    <Route path="/aszf" element={<Aszf />} />
                    <Route path="/adatkezeles" element={<Adatkezeles />} />
                    <Route path="/impresszum" element={<Impresszum />} />

                    {/* USER PANEL OLDALAK */}
                    <Route path="/user/bookings" element={<UserBooking />} />
                    <Route path="/user/data" element={<UserData />} />
                    <Route path="/user/reviews" element={<UserReviews />} />

                </Route>
            </Routes>
        </>
    );
};

export default App;
