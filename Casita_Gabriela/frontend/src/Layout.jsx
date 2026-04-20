import { Outlet, useLocation } from "react-router";
import Navigation from "./components/Navigation";
import CookieBanner from "./components/CookieBanner";
import { useEffect } from "react";
import { loadConsentScripts } from "./utils/loadConsentScripts";

const Layout = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    // betölti a statisztika / marketing scripteket, ha engedélyezve vannak
    loadConsentScripts();

    // ha a user most fogadja el → újratöltjük a scripteket
    window.addEventListener("cookie-consent-updated", loadConsentScripts);

    return () => {
      window.removeEventListener("cookie-consent-updated", loadConsentScripts);
    };
  }, []);

  return (
    <>
      <Navigation />

      <div className="pt-[10dvh]">
        <Outlet />
      </div>

      {/* GDPR Cookie Banner */}
      <CookieBanner />
    </>
  );
};

export default Layout;
