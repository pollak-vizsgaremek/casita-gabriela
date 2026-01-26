// src/pages/About.jsx
import React from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

const About = () => {
  return (
    <div className="flex flex-col  w-dvw  text-black spacer layerAdmin">
      <Navigation />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-10 space-y-16">
        <h1 className="text-3xl font-mono tracking-wide text-black mb-6">
          Rólunk
        </h1>

        {/* SZEKCIÓ 1 – szöveg bal, kép jobb */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Kik vagyunk?</h2>
            <p className="text-sm leading-relaxed">
              A Casa Gabriel egy családi kézben lévő szálláshely Hajdúszoboszló szívében, ahol a vendégélmény az első.
              Modern szobáinkat úgy alakítottuk ki, hogy minden korosztály számára kényelmes és otthonos legyen.
              Fontos számunkra a nyugalom, a tisztaság és az igényes környezet.
            </p>
          </div>
          <img
            src="/about1.jpg"
            alt="Resort overview"
            className="rounded-xl shadow-md w-full h-64 object-cover fade-inR"
          />
        </section>

        {/* SZEKCIÓ 2 – kép bal, szöveg jobb */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <img
            src="/about2.jpg"
            alt="Pool and hotel"
            className="rounded-xl shadow-md w-full h-64 object-cover fade-in-Left"
          />
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Miért minket válassz?</h2>
            <p className="text-sm leading-relaxed">
              A vendégeink visszajelzései alapján kiemelkedő ár-érték arányt kínálunk.  
              A szálláshely közvetlen közelében található fürdőkomplexum, éttermek és üzletek.  
              A szobák légkondicionáltak, saját fürdőszobával és ingyenes Wi-Fi-vel felszereltek.
            </p>
          </div>
        </section>

        {/* SZEKCIÓ 3 – szöveg bal, kép jobb */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Szobáink</h2>
            <p className="text-sm leading-relaxed">
              A Casa Gabriel szobái modern berendezésűek, letisztult stílusban.  
              Minden szobánkban kényelmes ágyak, okos TV, hűtőszekrény és alapvető konyhai felszerelés található.  
              A célunk, hogy minden vendég otthonosan érezze magát nálunk.
            </p>
          </div>
          <img
            src="/about3.jpg"
            alt="Hotel room"
            className="rounded-xl shadow-md w-full h-64 object-cover fade-inR"
          />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
