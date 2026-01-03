import { Outlet } from "react-router";
import Navigation from "./components/Navigation";


const Layout = () => {
  return (
    <>
    <Navigation />
      <div className="pt-[10dvh]">
        <Outlet />
      </div>
    </>
  )
}

export default Layout