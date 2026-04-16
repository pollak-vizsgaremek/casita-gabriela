import React from 'react';
import { useNavigate } from 'react-router';

const OfferAdminEdit = ({ id, name, price, image, reviews = [] }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/AdminKezeles/${id}`);
  };

  return (
    <div
      onClick={handleClick}
      className='bg-white hover:cursor-pointer hover:rotate-1 transition-all duration-300 fade-in shadow-md hover:shadow-2xl active:shadow-green-500 rounded-xl w-full h-72 flex flex-col'
    >
      <div className='h-3/5 w-full bg-[#edf9f2] rounded-t-xl overflow-hidden'>
        <img src={image} alt={name} className="w-full h-full object-cover rounded-t-xl" />
      </div>
      <div className='h-2/5 w-full bg-[#a4dfb9] rounded-b-xl flex flex-col p-3 justify-between'>
        <div>
          <p className='font-bold text-lg'>{name}</p>
          {reviews && reviews.length ? (
            <div className="flex items-center gap-2 mt-1">
              <div className="text-yellow-500 text-sm">
                {(() => {
                  const avgRounded = Math.round(reviews.reduce((s, r) => s + (r.stars || 0), 0) / reviews.length)
                  return "★".repeat(avgRounded) + "☆".repeat(5 - avgRounded)
                })()}
              </div>
              <div className="text-xs text-green-800">{(Math.round((reviews.reduce((s, r) => s + (r.stars || 0), 0) / reviews.length) * 10) / 10)}/5</div>
            </div>
          ) : (
            <div className="text-xs text-gray-600 mt-1">Nincsenek vélemények</div>
          )}
        </div>
        <div className='flex justify-end'>
          <p className='font-semibold text-md'>{typeof price === 'number' ? new Intl.NumberFormat('hu-HU').format(price) : price} Ft/fő/éj</p>
        </div>
      </div>
    </div>
  );
};

export default OfferAdminEdit;
