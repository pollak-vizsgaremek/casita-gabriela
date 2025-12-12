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
    name: 'Room',
    route: '/room'
  },
  {
    name: 'Admin',
    route: '/admin'
  },
  {
    name: 'Login',
    route: '/login'
  },
  {
    name: 'Registration',
    route: '/registration'
  }
 ];

  return (
    <div>
        <nav className='bg-green-400 w-dvw h-1/10'>
            {routes.map((r) => (
                <Link to={r.route} key={r.route} style={{ color: 'black', textDecoration: 'none' }}>
                    {r.name}
                </Link>

            ))}
        </nav>
    </div>
  )
}

export default Navigation
