'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const images = [
  '/messi-v3.png',
  '/mbappe-v3.png',
  '/neymar-v3.png',
  '/ronaldo-v3.png'
]

export default function ImageMorph() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute top-0 right-10 -z-10 opacity-30 pointer-events-none mix-blend-multiply w-[450px] h-[450px]">
      {images.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt={`Player ${index}`}
          fill
          sizes="450px"
          className={`object-contain transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          priority={index === 0}
        />
      ))}
    </div>
  )
}
