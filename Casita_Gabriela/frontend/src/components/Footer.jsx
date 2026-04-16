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

      {/* FELSŐ FOOTER – logo balra, tartalom közvetlenül mellette (nem jobbra tolva),
          asztalon egy sorban, mobilon egymás alatt; visszafogott, rendezett méretek */}
      <div className="w-full bg-[#C0FF95] text-[#1F1F1F]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          {/* A fő sor: logo + tartalom. justify-start biztosítja, hogy a tartalom a logóhoz zárkózzon */}
          <div className="flex flex-col md:flex-row items-start justify-start gap-8">

            {/* LOGO (balra, kicsit nagyobb) */}
            <div className="flex-shrink-0">
              <img src="/C.png" alt="Casa Gabriel Logo" className="h-16 w-auto" />
            </div>

            {/* Jobb oldali tartalom: desktopon sorban, mobilon egymás alatt.
                A konténer nem tolja el túl jobbra a tartalmat, gap és min-w biztosítja a légzést. */}
            <div className="flex flex-col md:flex-row md:items-start gap-10 w-full">

              {/* Oldaltérkép */}
              <div className="min-w-[160px] flex-shrink-0 text-left">
                <h3 className="font-semibold mb-2 text-sm">Oldaltérkép</h3>
                <ul className="text-sm space-y-1">
                  <li><Link to="/" className="hover:underline">Főoldal</Link></li>
                  <li><Link to="/about" className="hover:underline">Rólunk</Link></li>
                  <li><Link to="/contact" className="hover:underline">Kapcsolat</Link></li>
                </ul>
              </div>

              {/* Social media */}
              <div className="min-w-[160px] flex-shrink-0 text-left">
                <h3 className="font-semibold mb-2 text-sm">Itt is elérsz minket</h3>
                <div className="flex gap-4 text-xl text-black">
                  <a href="#" aria-label="Facebook" className="hover:opacity-80"><FaFacebook /></a>
                  <a href="#" aria-label="Instagram" className="hover:opacity-80"><FaInstagram /></a>
                  <a href="#" aria-label="Twitter" className="hover:opacity-80"><FaTwitter /></a>
                  <a href="#" aria-label="Tiktok" className="hover:opacity-80"><FaTiktok /></a>
                </div>
              </div>

              {/* Jogi dokumentumok */}
              <div className="min-w-[180px] flex-shrink-0 text-left">
                <h3 className="font-semibold mb-2 text-sm">Jogi dokumentumok</h3>
                <ul className="text-sm space-y-1">
                  <li><Link to="/aszf" className="hover:underline">Általános Szerződési Feltételek</Link></li>
                  <li><Link to="/adatkezeles" className="hover:underline">Adatkezelési Tájékoztató</Link></li>
                  <li><Link to="/impresszum" className="hover:underline">Impresszum</Link></li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ALSÓ FOOTER – fekete háttér, magasabb padding */}
      <div className="bg-black text-white">
        <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-center">
          © Minden jog fenntartva - Casa Gabriel 2025
        </div>
      </div>

    </footer>
  );
};

export default Footer;
