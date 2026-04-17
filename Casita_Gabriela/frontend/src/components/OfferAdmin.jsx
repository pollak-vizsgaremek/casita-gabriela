import React from 'react'
import { useNavigate } from 'react-router'

const OfferAdmin = ({ id, name, price, image, reviews = [] }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/room/${id}`)
  }

  return (
    <div
      onClick={handleClick}
      className='group cursor-pointer w-72 rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-2xl transition-all duration-300'
    >
      <div className='relative h-44 w-full overflow-hidden'>
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />

        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent'></div>

        <div className='absolute bottom-2 right-2 bg-white/90 backdrop-blur-md text-red-500 text-sm font-semibold px-3 py-1 rounded-lg shadow'>
          {typeof price === 'number' ? new Intl.NumberFormat('hu-HU').format(price) : price} Ft/fő/éj
        </div>
      </div>

      <div className='p-4 flex flex-col gap-2'>
        <h3 className='font-semibold text-lg text-gray-800 group-hover:text-red-500 transition'>
          {name}
        </h3>

        {reviews && reviews.length ? (
          <div className="flex items-center gap-2">
            <div className="text-yellow-500 text-sm">
              {(() => {
                const avgRounded = Math.round(reviews.reduce((s, r) => s + (r.stars || 0), 0) / reviews.length)
                return "★".repeat(avgRounded) + "☆".repeat(5 - avgRounded)
              })()}
            </div>
            <div className="text-xs text-gray-600">{(Math.round((reviews.reduce((s, r) => s + (r.stars || 0), 0) / reviews.length) * 10) / 10)}/5</div>
          </div>
        ) : (
          <div className="text-xs text-gray-500">Nincsenek vélemények</div>
        )}

        <p className='text-xs text-gray-500'>ÁFÁ-t tartalmazza</p>
      </div>
    </div>
  )
}

export default OfferAdmin