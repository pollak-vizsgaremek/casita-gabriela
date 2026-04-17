export function loadConsentScripts() {
    const raw = localStorage.getItem("cookie_consent_v2");
    if (!raw) return;
  
    const consent = JSON.parse(raw);
  
    // STATISTICS → Google Analytics
    if (consent.statistics) {
      const ga = document.createElement("script");
      ga.src = "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX";
      ga.async = true;
      document.head.appendChild(ga);
  
      window.dataLayer = window.dataLayer || [];
      function gtag(){ window.dataLayer.push(arguments); }
      gtag("js", new Date());
      gtag("config", "G-XXXXXXX");
    }
  
    // MARKETING → Meta Pixel
    if (consent.marketing) {
      const pixel = document.createElement("script");
      pixel.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', 'XXXXXXXXXXXXXXX');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(pixel);
    }
  }
  