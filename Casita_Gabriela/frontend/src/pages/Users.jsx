import React from "react";
import Sidebar from "../components/Sidebar";
import { useLocation } from "react-router";

const Users = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen w-dvw bg-[#f7faf7]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 ml-0 md:ml-64 p-6">
        <h1 className="text-2xl font-semibold mb-4">Felhasználók kezelése</h1>
        <p className="text-gray-600">Ez az oldal még fejlesztés alatt áll.</p>
      </div>
    </div>
  );
};

export default Users;