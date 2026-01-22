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


const App = () => {
    return (
        <>
            <Routes>
                <Route element={<Layout />}>

                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registration" element={<Registration />} />

                <Route path="/room/:id" element={<Room />} />

                <Route path="/admin" element={<Admin />} />
                <Route path="/AdminKezeles" element={<AdminKezeles />} />
                
                <Route path="/aszf" element={<Aszf />} />
                <Route path="/adatkezeles" element={<Adatkezeles />} />
                <Route path="/impresszum" element={<Impresszum />} />

                </Route>
            </Routes>
        </>
    );
};

export default App;
