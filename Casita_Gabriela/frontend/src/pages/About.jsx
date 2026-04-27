// src/pages/About.jsx
import React from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

const About = () => {
  return (
    <div className="flex flex-col w-full min-h-screen text-black bg-[#f4fff7]">
      <Navigation />

      <section className="relative flex-1 w-full overflow-hidden">
        <div
          className="absolute inset-x-0 bottom-0 h-[280px] sm:h-80 md:h-[360px] bg-[url('/layer1.svg')] bg-no-repeat bg-bottom bg-cover pointer-events-none z-0"
          aria-hidden="true"
        />

        <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-10 sm:pb-16">
          <div className="mb-6 sm:mb-14 text-center sm:text-left">
          
          <h1 className="text-2xl sm:text-4xl lg:text-[2.7rem] leading-tight font-extrabold tracking-tight text-[#1f1f1f]">
            Rólunk
          </h1>
          <p className="mt-2 sm:mt-3 text-xs sm:text-base text-gray-700 max-w-2xl mx-auto sm:mx-0">
            Ismerd meg szálláshelyünket, ahol a családias hangulat és a kényelmes pihenés találkozik.
          </p>
        </div>

          {/* SZEKCIÓ 1 – szöveg bal, kép jobb */}
          <div className="space-y-5 sm:space-y-10">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 items-center bg-white/90 border border-[#dff3e6] rounded-2xl p-3 sm:p-6 lg:p-7 shadow-sm">
              <div className="space-y-2 sm:space-y-4 order-2 md:order-1">
                <h2 className="text-base sm:text-2xl font-bold text-[#203327]">Kik vagyunk?</h2>
                <p className="text-xs sm:text-base leading-relaxed text-gray-700">
                  A Casa Gabriel egy családi kézben lévő szálláshely Hajdúszoboszló szívében, ahol a vendégélmény az első.
                  Modern szobáinkat úgy alakítottuk ki, hogy minden korosztály számára kényelmes és otthonos legyen.
                  Fontos számunkra a nyugalom, a tisztaság és az igényes környezet.
                </p>
              </div>
              <img
                src="/about1.jpg"
                alt="Resort overview"
                className="rounded-xl shadow-md w-full h-40 sm:h-64 md:h-72 object-cover fade-inR order-1 md:order-2"
              />
            </section>

            {/* SZEKCIÓ 2 – kép bal, szöveg jobb */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 items-center bg-white/90 border border-[#dff3e6] rounded-2xl p-3 sm:p-6 lg:p-7 shadow-sm">
              <img
                src="/about2.jpg"
                alt="Pool and hotel"
                className="rounded-xl shadow-md w-full h-40 sm:h-64 md:h-72 object-cover fade-in-Left"
              />
              <div className="space-y-2 sm:space-y-4">
                <h2 className="text-base sm:text-2xl font-bold text-[#203327]">Miért minket válassz?</h2>
                <p className="text-xs sm:text-base leading-relaxed text-gray-700">
                  A vendégeink visszajelzései alapján kiemelkedő ár-érték arányt kínálunk.
                  A szálláshely közvetlen közelében található fürdőkomplexum, éttermek és üzletek.
                  A szobák légkondicionáltak, saját fürdőszobával és ingyenes Wi-Fi-vel felszereltek.
                </p>
              </div>
            </section>

            {/* SZEKCIÓ 3 – szöveg bal, kép jobb */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 items-center bg-white/90 border border-[#dff3e6] rounded-2xl p-3 sm:p-6 lg:p-7 shadow-sm">
              <div className="space-y-2 sm:space-y-4 order-2 md:order-1">
                <h2 className="text-base sm:text-2xl font-bold text-[#203327]">Szobáink</h2>
                <p className="text-xs sm:text-base leading-relaxed text-gray-700">
                  A Casa Gabriel szobái modern berendezésűek, letisztult stílusban.
                  Minden szobánkban kényelmes ágyak, okos TV, hűtőszekrény és alapvető konyhai felszerelés található.
                  A célunk, hogy minden vendég otthonosan érezze magát nálunk.
                </p>
              </div>
              <img
                src="/about3.jpg"
                alt="Hotel room"
                className="rounded-xl shadow-md w-full h-40 sm:h-64 md:h-72 object-cover fade-inR order-1 md:order-2"
              />
            </section>
          </div>
        </main>
      </section>

      <Footer />
    </div>
  );
};

export default About;
