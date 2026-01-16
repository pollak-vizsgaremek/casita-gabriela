import React, { useRef } from 'react'
import { Link } from 'react-router';

const Navigation = () => {

  const navRef = useRef();

  const showSideBar = () => {
    navRef.current.classList.add('showSidebar');
  };

  const hideSideBar = () => {
    navRef.current.classList.remove('showSidebar');
  };

  const routes = [
    { name: 'Home', route: '/' },
    { name: 'About', route: '/about' },
    { name: 'Contact', route: '/contact' },
    { name: 'Login', route: '/login' }
  ];

  return (
    <div className='z-10 overflow-visible'>
      
      {/* HEADER */}
      <nav className='bg-[#C0FF95] w-dvw h-[10dvh] flex items-center px-4 shadow-md z-40 border-b-2 border-gray-200 fixed top-0'>
        
        <Link to={routes[0].route} className='h-full flex items-center'>
          <img src="/C.png" alt="Home" className="h-7/10 w-auto" />
        </Link>

        <div className='ml-auto flex gap-6 align-center'>
          {routes.slice(1).map((r, index) => (
            <Link
              to={r.route}
              key={r.route}
              className={
                index === 2
                  ? 'bg-[#6FD98C] hidden sm:inline text-white px-3 py-1 rounded-xl hover:-translate-y-px hover:bg-[#5FCB80] transition-all duration-200 mr-5 w-25 text-center font-bold h-full'
                  : 'text-[#1F1F1F] px-3 py-1 hidden sm:inline font-bold h-full hover:text-[#515151] hover:-translate-y-px transition-all duration-200'
              }
            >
              {r.name}
            </Link>
          ))}
          <div className='icon' onClick={showSideBar}></div>
        </div>

      </nav>

      {/* SIDEBAR */}
      <nav
        ref={navRef}
        className='bg-[#C0FF95] sidebar w-[200px] h-dvh fixed right-0 top-0 items-center px-4 shadow-md z-50 border-b-2 border-gray-200'
      >
        <div className='ml-auto flex flex-col gap-6 align-center w-full'>
          <div className='icon2 mt-10' onClick={hideSideBar}></div>

          {routes.slice(1).map((r, index) => (
            <Link
              to={r.route}
              key={r.route}
              className={
                index === 2
                  ? 'bg-[#6FD98C] text-white px-3 py-1 rounded-xl hover:-translate-y-px hover:bg-[#5FCB80] transition-all duration-200 mr-5 w-25 text-center font-bold h-full'
                  : 'text-[#1F1F1F] px-3 py-1 font-bold h-full hover:text-[#515151] hover:-translate-y-px transition-all duration-200'
              }
            >
              {r.name}
            </Link>
          ))}

        </div>
      </nav>

    </div>
  )
}

export default Navigation
