import React from 'react'
import { useParams } from 'react-router'

const Room = () => {
  const { id } = useParams();

  return (
    <div className='text-white text-3xl p-10'>
      Szoba oldala – ID: {id}
    </div>
  )
}

export default Room
