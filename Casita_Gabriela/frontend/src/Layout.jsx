import { Outlet } from "react-router";
import Navigation from "./components/Navigation";


const Layout = () => {
  return (
    <>
    <Navigation />
      <Outlet />
    </>
  )
}

export default Layout