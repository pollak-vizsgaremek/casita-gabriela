/*
import React from 'react';
import { useNavigate } from 'react-router';

const Offer = ({ id, name, price, image }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/room/${id}`);
  };

  return (
    <div
      onClick={handleClick}
      className='bg-white hover:cursor-pointer hover:rotate-1 transition-all duration-300 fade-in shadow-md/40  hover:shadow-2xl/40 active:shadow-green-500 active:translate-y-3 rounded-xl w-72 h-72 flex flex-col items-center'
    >
      <div className='h-2/3 w-full bg-[#edf9f2] rounded-t-xl'>
        <img src={image} alt={name} className="w-full h-full object-cover rounded-t-xl" />
      </div>
      <div className='h-1/3 w-full bg-[#FFFECE] rounded-b-xl flex flex-col'>
        <div className='w-full h-1/2'>
          <p className='font-bold text-lg mt-2 ml-1 text-black'>{name}</p>
        </div>
        <div className='w-full h-1/2 flex justify-end'>
          <p className='font-semibold text-md mt-2 mr-2 text-black'>{price} Ft/fő/éj</p>
        </div>
      </div>
    </div>
  );
};

export default Offer;
*/
