'use client'

import React from 'react'

export default function StandingsTable({ standings }: { standings: any[] }) {
  if (!standings || standings.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-900 rounded-xl border border-gray-800">
        <p className="text-gray-400 text-lg">Group standings are not available at this time.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {standings.map((group, groupIndex) => (
          <div 
            key={groupIndex} 
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-sky-300 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="bg-gradient-to-r from-sky-50 to-white px-6 py-4 border-b border-gray-100">
              <h3 className="text-xl font-extrabold text-gray-900">{group[0]?.group || `Group ${String.fromCharCode(65 + groupIndex)}`}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 w-8 text-center">#</th>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-3 py-3 text-center">MP</th>
                    <th className="px-3 py-3 text-center">W</th>
                    <th className="px-3 py-3 text-center">D</th>
                    <th className="px-3 py-3 text-center">L</th>
                    <th className="px-3 py-3 text-center">GD</th>
                    <th className="px-4 py-3 text-center font-extrabold text-gray-900">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {group.map((team: any, index: number) => (
                    <tr 
                      key={team.team.id} 
                      className={`hover:bg-gray-50 transition-colors ${index < 2 ? 'bg-sky-50/30' : ''}`}
                    >
                      <td className="px-4 py-3 text-center text-gray-400 font-bold">
                        {team.rank}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 flex items-center space-x-3">
                        <img src={team.team.logo} alt={team.team.name} className="w-6 h-6 object-contain" />
                        <span>{team.team.name}</span>
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600 font-medium">{team.all.played}</td>
                      <td className="px-3 py-3 text-center text-gray-600 font-medium">{team.all.win}</td>
                      <td className="px-3 py-3 text-center text-gray-600 font-medium">{team.all.draw}</td>
                      <td className="px-3 py-3 text-center text-gray-600 font-medium">{team.all.lose}</td>
                      <td className="px-3 py-3 text-center text-gray-600 font-medium">{team.goalsDiff}</td>
                      <td className="px-4 py-3 text-center font-extrabold text-sky-600 text-base">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
