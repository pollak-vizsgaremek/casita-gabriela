import React from 'react'
import { Link } from 'react-router';



const Navigation = () => {
     const routes = [
  {
    name: 'Home',
    route: '/'
  },
  {
    name: 'About',
    route: '/about'
  },
  {
    name: 'Contact',
    route: '/contact'
  },
  {
    name: 'Login',
    route: '/login'
  }
  
 ];

  return (
    <div className='z-10 overflow-visible'>
        <nav className=' bg-[#D9F5E3]  w-dvw h-[10dvh] flex items-center px-4 shadow-md  z-50'>
            <Link to={routes[0].route} className='h-full flex items-center'>
                <img src="/C.png" alt="Home" className="h-7/10 w-auto" />
            </Link>
            <div className='ml-auto flex gap-6 align-center '>
                {routes.slice(1).map((r, index) => (
                    <Link to={r.route} 
                    className={index === 2 ? 'bg-[#6FD98C] text-white px-3 py-1 rounded-xl hover:-translate-y-px hover:bg-[#5FCB80] transition-all duration-200 mr-5 w-25 text-center font-bold h-full'
                       : 
                    'text-[#1F1F1F] px-3 py-1 font-bold h-full hover:text-[#515151] hover:-translate-y-px transition-all duration-200'} key={r.route}>
                        {r.name}
                    </Link>
                ))}
            </div>
        </nav>
    </div>
  )
}

export default Navigation
