import React from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 30
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
}

const OfferAdmin = ({ id, name, price, image }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/room/${id}`)
  }

  return (
    <motion.div
      variants={cardVariants}
      onClick={handleClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className='group cursor-pointer w-72 rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-2xl transition-all duration-300'
    >
      
    
      <div className='relative h-44 w-full overflow-hidden'>
        
        <motion.img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.4 }}
        />

      
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent'></div>

      
        <div className='absolute bottom-2 right-2 bg-white/90 backdrop-blur-md text-red-500 text-sm font-semibold px-3 py-1 rounded-lg shadow'>
          {price} Ft / éj
        </div>
      </div>

     
      <div className='p-4 flex flex-col gap-2'>
        
        <h3 className='font-semibold text-lg text-gray-800 group-hover:text-red-500 transition'>
          {name}
        </h3>

        <p className='text-xs text-gray-500'>
          ÁFÁ-t tartalmazza
        </p>

      </div>
    </motion.div>
  )
}

export default OfferAdmin