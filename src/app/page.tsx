"use client";

import Link from "next/link";
import { Trophy, CalendarDays, BarChart3, Users, ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const images = [
    "/messi-v3.png",
    "/ronaldo-v3.png",
    "/neymar-v3.png",
    "/mbappe-v3.png"
  ];
  
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative overflow-hidden flex flex-col items-center justify-center py-20 text-center min-h-[90vh]">
      {/* Abstract Light Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-sky-200/50 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-40 -left-20 w-[400px] h-[400px] bg-blue-200/50 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-indigo-200/50 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-left">
        {/* Left Content */}
        <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
          <a
            href="https://www.instagram.com/ksu.sct?igsh=MWJod250MGtwemtvYw=="
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-full bg-sky-100 border border-sky-300 text-sky-700 text-sm font-bold tracking-wide shadow-sm hover:bg-sky-200 transition-all duration-300 hover:scale-105"
          >
            <Sparkles className="w-4 h-4 mr-2 text-sky-500" />
            KSU SCT UNIT
          </a>
          
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-tight text-gray-900">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-700">
              FIFA MANIA
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-lg leading-relaxed font-medium">
            Welcome to the KSU FIFA Prediction Challenge. Predict match outcomes, climb the global leaderboard, and win exciting prizes!
          </p>
          
          <div className="pt-4 flex flex-wrap items-center gap-6">
            <Link
              href="/login"
              className="group inline-flex items-center px-8 py-4 text-lg font-bold rounded-full text-white bg-sky-500 hover:bg-sky-600 hover:scale-105 transition-all duration-300 shadow-[0_10px_20px_rgba(14,165,233,0.3)] hover:shadow-[0_15px_30px_rgba(14,165,233,0.4)]"
            >
              Start Playing Now
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link href="/prizes" className="text-gray-600 hover:text-sky-600 font-bold flex items-center group transition-colors">
              View Prizes
              <Trophy className="ml-2 w-5 h-5 text-yellow-500 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Hero Image Composition (Morphing Carousel) */}
        <div className="relative h-[550px] w-full animate-in fade-in slide-in-from-right-8 duration-1000 flex items-center justify-center">
          {images.map((src, index) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === activeIndex ? "opacity-100 z-20" : "opacity-0 z-10"
              }`}
            >
              <Image 
                src={src} 
                alt="Football Superstar Vector" 
                fill 
                className="object-contain drop-shadow-[0_20px_50px_rgba(14,165,233,0.3)] hover:scale-105 transition-transform duration-700"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full max-w-6xl mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        {[
          { 
            icon: CalendarDays, 
            title: "Live Fixtures & Tables", 
            desc: "Stay updated with real-time match schedules, live scores, and group standings powered by live data.",
            color: "text-blue-600",
            bg: "bg-blue-100"
          },
          { 
            icon: BarChart3, 
            title: "Dynamic Predictions", 
            desc: "Answer detailed questions for each match before kickoff. Guess the winner, exact score, and more to earn points.",
            color: "text-sky-600",
            bg: "bg-sky-100"
          },
          { 
            icon: Users, 
            title: "Ultra-Premium Leaderboard", 
            desc: "See how you rank globally in real-time. Aim for the top 3 spots to claim the ultimate KSU rewards.",
            color: "text-indigo-600",
            bg: "bg-indigo-100"
          }
        ].map((feature, i) => (
          <div 
            key={i}
            className="group relative p-8 rounded-3xl bg-white border border-gray-200 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-100 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
          >
            <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-sm`}>
              <feature.icon className={`w-7 h-7 ${feature.color}`} />
            </div>
            <h3 className="text-2xl font-extrabold mb-3 text-gray-900">{feature.title}</h3>
            <p className="text-gray-600 leading-relaxed font-medium">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
