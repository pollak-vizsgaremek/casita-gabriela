import React from 'react';

const Adatkezeles = () => {
  return (
    <div className="flex flex-col min-h-screen w-dvw bg-[#0b1f13] text-[#F1FBF4]">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-mono tracking-wide mb-6">Adatkezelési Tájékoztató</h1>

        <div className="bg-white text-black rounded-xl p-6 shadow-md text-sm leading-relaxed space-y-6">

          <h2 className="text-xl font-semibold">1. Bevezetés</h2>
          <p>
            A Casa Gabriel elkötelezett a vendégek személyes adatainak védelme iránt. Jelen Adatkezelési Tájékoztató
            részletesen ismerteti, hogy milyen adatokat gyűjtünk, hogyan kezeljük azokat, milyen célból történik az
            adatkezelés, és milyen jogok illetik meg Önt az adatkezeléssel kapcsolatban.
          </p>

          <h2 className="text-xl font-semibold">2. Az adatkezelés jogalapja</h2>
          <p>
            Az adatkezelés jogalapja lehet szerződés teljesítése, jogi kötelezettség teljesítése, jogos érdek, illetve
            az érintett hozzájárulása. A Casa Gabriel minden esetben a jogszabályoknak megfelelően jár el.
          </p>

          <h2 className="text-xl font-semibold">3. Kezelt adatok köre</h2>
          <h3 className="text-lg font-semibold">3.1 Foglalási adatok</h3>
          <p>
            Név, e-mail cím, telefonszám, lakcím, személyi igazolvány szám, foglalási időpontok, vendégek száma.
          </p>

          <h3 className="text-lg font-semibold">3.2 Technikai adatok</h3>
          <p>
            IP-cím, böngésző típusa, sütik (cookie-k), eszközazonosítók, látogatási statisztikák.
          </p>

          <h3 className="text-lg font-semibold">3.3 Marketing célú adatok</h3>
          <p>
            Hírlevél-feliratkozás, preferenciák, érdeklődési körök – kizárólag hozzájárulás esetén.
          </p>

          <h2 className="text-xl font-semibold">4. Az adatkezelés céljai</h2>
          <p>
            A foglalások kezelése, számlázás, kapcsolattartás, ügyfélszolgálat, statisztikai elemzés, szolgáltatásfejlesztés,
            marketingkommunikáció, valamint a weboldal működésének biztosítása.
          </p>

          <h2 className="text-xl font-semibold">5. Adattovábbítás</h2>
          <p>
            A Casa Gabriel harmadik fél részére személyes adatot csak akkor ad át, ha ahhoz a vendég előzetesen hozzájárult,
            vagy ha azt jogszabály írja elő. Ilyen harmadik fél lehet például a könyvelő, számlázási szolgáltató vagy
            hatóságok.
          </p>

          <h2 className="text-xl font-semibold">6. Adatmegőrzés</h2>
          <p>
            A személyes adatokat a szolgáltatás teljesítéséhez szükséges ideig, illetve a jogszabályok által előírt
            időtartamig tároljuk. A marketing célú adatkezelés esetén az adatokat a hozzájárulás visszavonásáig kezeljük.
          </p>

          <h2 className="text-xl font-semibold">7. Az érintett jogai</h2>
          <h3 className="text-lg font-semibold">7.1 Hozzáférés joga</h3>
          <p>
            A vendég bármikor jogosult tájékoztatást kérni arról, hogy milyen adatokat kezelünk róla.
          </p>

          <h3 className="text-lg font-semibold">7.2 Helyesbítés joga</h3>
          <p>
            A vendég kérheti személyes adatainak módosítását vagy pontosítását.
          </p>

          <h3 className="text-lg font-semibold">7.3 Törlés joga</h3>
          <p>
            A vendég kérheti személyes adatainak törlését, kivéve ha jogszabály másként rendelkezik.
          </p>

          <h3 className="text-lg font-semibold">7.4 Tiltakozás joga</h3>
          <p>
            A vendég tiltakozhat az adatkezelés ellen, különösen marketing célú adatkezelés esetén.
          </p>

          <h3 className="text-lg font-semibold">7.5 Adathordozhatóság joga</h3>
          <p>
            A vendég kérheti adatai géppel olvasható formátumban történő átadását.
          </p>

          <h2 className="text-xl font-semibold">8. Biztonsági intézkedések</h2>
          <p>
            A Casa Gabriel minden ésszerű technikai és szervezési intézkedést megtesz annak érdekében, hogy a személyes
            adatokat illetéktelen hozzáféréstől, megváltoztatástól, törléstől vagy nyilvánosságra hozataltól megvédje.
          </p>

          <h2 className="text-xl font-semibold">9. Jogorvoslat</h2>
          <p>
            Amennyiben a vendég úgy érzi, hogy személyes adatainak kezelése nem felel meg a jogszabályoknak, jogosult
            panaszt tenni a Nemzeti Adatvédelmi és Információszabadság Hatóságnál (NAIH).
          </p>

        </div>
      </main>
    </div>
  );
};

export default Adatkezeles;
