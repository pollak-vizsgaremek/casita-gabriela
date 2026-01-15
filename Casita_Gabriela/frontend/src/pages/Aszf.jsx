import React from 'react';

const Aszf = () => {
  return (
    <div className="flex flex-col min-h-screen w-dvw bg-[#0b1f13] text-[#F1FBF4]">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-mono tracking-wide mb-6">Általános Szerződési Feltételek</h1>

        <div className="bg-white text-black rounded-xl p-6 shadow-md text-sm leading-relaxed space-y-6">

          <h2 className="text-xl font-semibold">1. Bevezetés</h2>
          <p>
            Jelen Általános Szerződési Feltételek (ÁSZF) a Casa Gabriel szálláshely szolgáltatásainak igénybevételére
            vonatkozó jogokat és kötelezettségeket tartalmazzák. A foglalás véglegesítésével a vendég kijelenti, hogy
            az ÁSZF-ben foglaltakat megismerte, megértette és magára nézve kötelezőnek ismeri el. A Casa Gabriel fenntartja
            a jogot az ÁSZF módosítására, amelyet a weboldalon történő közzététellel érvényesít.
          </p>

          <h2 className="text-xl font-semibold">2. A szolgáltatás igénybevételének feltételei</h2>
          <h3 className="text-lg font-semibold">2.1 Foglalás menete</h3>
          <p>
            A foglalás online történik, a vendég által megadott adatok alapján. A foglalás akkor válik véglegessé, amikor
            a vendég e-mailben visszaigazolást kap. A vendég felelős a megadott adatok helyességéért.
          </p>

          <h3 className="text-lg font-semibold">2.2 A vendég kötelezettségei</h3>
          <p>
            A vendég köteles a szálláshely házirendjét betartani, a szobát rendeltetésszerűen használni, és a többi vendég
            nyugalmát tiszteletben tartani. A vendég köteles a károkozást haladéktalanul bejelenteni.
          </p>

          <h3 className="text-lg font-semibold">2.3 A szálláshely jogai</h3>
          <p>
            A Casa Gabriel jogosult a szolgáltatás megtagadására, ha a vendég magatartása veszélyezteti a szálláshely
            működését, más vendégek biztonságát vagy nyugalmát. Súlyos szabálysértés esetén a vendég tartózkodása
            azonnali hatállyal megszüntethető.
          </p>

          <h2 className="text-xl font-semibold">3. Lemondási feltételek</h2>
          <h3 className="text-lg font-semibold">3.1 Lemondási határidők</h3>
          <p>
            A foglalás lemondása a visszaigazolásban szereplő feltételek szerint történik. A lemondási határidőkön túl
            történő lemondás esetén a szálláshely jogosult kötbért felszámítani.
          </p>

          <h3 className="text-lg font-semibold">3.2 Kötbér mértéke</h3>
          <p>
            A kötbér mértéke a foglalás időpontjától, a tartózkodás hosszától és a szoba típusától függ. A vendég tudomásul
            veszi, hogy a foglalás módosítása csak a szálláshely jóváhagyásával lehetséges.
          </p>

          <h2 className="text-xl font-semibold">4. Felelősségvállalás</h2>
          <h3 className="text-lg font-semibold">4.1 A vendég felelőssége</h3>
          <p>
            A vendég felel minden olyan kárért, amelyet ő maga, kísérői vagy látogatói okoznak. A károkozás mértékétől
            függően a szálláshely jogosult kártérítést követelni.
          </p>

          <h3 className="text-lg font-semibold">4.2 A szálláshely felelőssége</h3>
          <p>
            A szálláshely nem vállal felelősséget a vendég értéktárgyainak elvesztéséért, kivéve ha az a szálláshely
            gondatlanságából ered. A szálláshely nem felel olyan eseményekért, amelyek rajta kívül álló okokból következnek
            be (vis maior).
          </p>

          <h2 className="text-xl font-semibold">5. Házirend</h2>
          <p>
            A vendég köteles a házirendet betartani, különös tekintettel a csendes pihenőidőre, a dohányzási szabályokra,
            valamint a közösségi terek rendeltetésszerű használatára. A házirend megsértése esetén a szálláshely jogosult
            intézkedéseket tenni.
          </p>

          <h2 className="text-xl font-semibold">6. Fizetési feltételek</h2>
          <p>
            A foglalás ellenértékét a vendég a foglalási rendszerben megadott módon köteles kiegyenlíteni. A fizetés
            történhet bankkártyával, átutalással vagy egyéb, a szálláshely által elfogadott módon.
          </p>

          <h2 className="text-xl font-semibold">7. Adatkezelés</h2>
          <p>
            A Casa Gabriel a vendégek személyes adatait a vonatkozó jogszabályoknak megfelelően kezeli. Az adatkezelés
            részleteit az Adatkezelési Tájékoztató tartalmazza.
          </p>

          <h2 className="text-xl font-semibold">8. Jogviták rendezése</h2>
          <p>
            A felek a vitás kérdéseket elsősorban békés úton próbálják rendezni. Amennyiben ez nem vezet eredményre,
            a jogvita rendezésére a magyar bíróságok illetékesek.
          </p>

        </div>
      </main>
    </div>
  );
};

export default Aszf;
