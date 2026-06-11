import { Trophy, Gift, Shirt } from 'lucide-react'

export default function PrizesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Tournament Prizes</h1>
        <p className="text-xl text-gray-400">Top the leaderboard at the end of the World Cup to win these exclusive prizes!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
        {/* 2nd Place */}
        <div className="order-2 md:order-1 transform md:translate-y-8">
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-300/30 text-center relative overflow-hidden shadow-[0_0_15px_rgba(209,213,219,0.1)]">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gray-400 to-gray-200"></div>
            <div className="w-20 h-20 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-6 border-4 border-gray-300">
              <Gift className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-300">2nd Place</h2>
            <h3 className="text-xl font-semibold mb-4 text-white">PAIR OF BOOTS</h3>
            <p className="text-gray-400 text-sm">
              Top-tier professional football boots of your choice.
            </p>
          </div>
        </div>

        {/* 1st Place */}
        <div className="order-1 md:order-2 z-10">
          <div className="bg-gray-900 rounded-2xl p-8 border border-yellow-500/50 text-center relative overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.2)] transform scale-105">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-600 to-yellow-400"></div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 rounded-bl-full flex items-start justify-end p-3">
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="w-24 h-24 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-6 border-4 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
              <Trophy className="w-12 h-12 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-extrabold mb-2 text-yellow-500 uppercase tracking-widest">Grand Prize</h2>
            <h3 className="text-2xl font-bold mb-4 text-white">FOOTBALL</h3>
            <p className="text-gray-400 text-sm">
              The official match ball of the tournament.
            </p>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="order-3 md:order-3 transform md:translate-y-12">
          <div className="bg-gray-900 rounded-2xl p-8 border border-amber-700/40 text-center relative overflow-hidden shadow-[0_0_15px_rgba(180,83,9,0.1)]">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-700 to-amber-500"></div>
            <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-6 border-4 border-amber-600">
              <Shirt className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-amber-600">3rd Place</h2>
            <h3 className="text-lg font-semibold mb-4 text-white">JERSEY</h3>
            <p className="text-gray-400 text-sm">
              The official jersey of your favorite national team.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
