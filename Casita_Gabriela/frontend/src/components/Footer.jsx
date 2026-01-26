import React from "react";
import { Link } from "react-router";
import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaTiktok,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="w-full">

      {/* FELSŐ FOOTER – új zöld háttér */}
      <div className="w-full bg-[#C0FF95] text-[#1F1F1F]">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* LOGO */}
          <div className="flex items-center">
            <img src="/C.png" alt="Casa Gabriel Logo" className="h-12 w-auto" />
          </div>

          {/* Oldaltérkép */}
          <div>
            <h3 className="font-semibold mb-2 text-sm">Oldaltérkép</h3>
            <ul className="text-xs space-y-1">
              <li><Link to="/" className="hover:underline">Főoldal</Link></li>
              <li><Link to="/about" className="hover:underline">Rólunk</Link></li>
              <li><Link to="/contact" className="hover:underline">Kapcsolat</Link></li>
            </ul>
          </div>

          {/* Social media */}
          <div>
            <h3 className="font-semibold mb-2 text-sm">Itt is elérsz minket</h3>
            <div className="flex gap-4 text-2xl text-black">
              <FaFacebook />
              <FaInstagram />
              <FaTwitter />
              <FaTiktok />
            </div>
          </div>

          {/* Jogi dokumentumok */}
          <div>
            <h3 className="font-semibold mb-2 text-sm">Jogi dokumentumok</h3>
            <ul className="text-xs space-y-1">
              <li><Link to="/aszf" className="hover:underline">Általános Szerződési Feltételek</Link></li>
              <li><Link to="/adatkezeles" className="hover:underline">Adatkezelési Tájékoztató</Link></li>
              <li><Link to="/impresszum" className="hover:underline">Impresszum</Link></li>
            </ul>
          </div>

        </div>
      </div>

      {/* ALSÓ FOOTER – fekete háttér */}
      <div className="bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 text-xs text-center">
          © Minden jog fenntartva - Casa Gabriel 2025
        </div>
      </div>

    </footer>
  );
};

export default Footer;
