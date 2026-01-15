import React from 'react';

const Impresszum = () => {
  return (
    <div className="flex flex-col min-h-screen w-dvw bg-[#0b1f13] text-[#F1FBF4]">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-mono tracking-wide mb-6">Impresszum</h1>

        <div className="bg-white text-black rounded-xl p-6 shadow-md text-sm leading-relaxed space-y-4">

          <p><strong>Üzemeltető:</strong> Casa Gabriel Kft.</p>
          <p><strong>Székhely:</strong> 1234 Hajdúszoboszló, Tópart utca 1.</p>
          <p><strong>Cégjegyzékszám:</strong> 01-09-999999</p>
          <p><strong>Adószám:</strong> 12345678-1-42</p>
          <p><strong>E-mail:</strong> info@casagabriel.hu</p>
          <p><strong>Telefon:</strong> +36 30 123 4567</p>

          <p>
            A weboldal tartalma szerzői jogvédelem alatt áll. A tartalom másolása, terjesztése vagy felhasználása kizárólag
            az üzemeltető előzetes írásos engedélyével lehetséges.
          </p>

        </div>
      </main>
    </div>
  );
};

export default Impresszum;
