export async function fetchWorldCupFixtures() {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    console.warn('FOOTBALL_API_KEY is not defined in environment variables.');
    return [];
  }
  try {
    // football-data.org World Cup endpoint
    const response = await fetch(`https://api.football-data.org/v4/competitions/WC/matches`, {
      method: 'GET',
      headers: {
        'X-Auth-Token': apiKey
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    const data = await response.json();
    
    if (data.errorCode) {
      console.error('football-data.org Error:', data.message);
      return [];
    }

    if (data.matches && data.matches.length > 0) {
      // Transform data to match the expected API-Sports schema used in the UI
      return data.matches.map((match: any) => {
        let shortStatus = 'NS';
        if (match.status === 'FINISHED') shortStatus = 'FT';
        else if (match.status === 'IN_PLAY') shortStatus = 'LIVE';
        else if (match.status === 'PAUSED') shortStatus = 'HT';
        else if (match.status === 'POSTPONED' || match.status === 'CANCELED') shortStatus = 'CANC';

        return {
          fixture: {
            id: match.id,
            date: match.utcDate,
            status: {
              short: shortStatus,
              elapsed: match.minute || null
            }
          },
          teams: {
            home: { name: match.homeTeam.name, logo: match.homeTeam.crest },
            away: { name: match.awayTeam.name, logo: match.awayTeam.crest }
          },
          goals: {
            home: match.score?.fullTime?.home ?? null,
            away: match.score?.fullTime?.away ?? null
          }
        }
      });
    }
    return [];
  } catch (error) {
    console.error('Error fetching football fixtures:', error);
    return [];
  }
}

export async function fetchWorldCupStandings() {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch(`https://api.football-data.org/v4/competitions/WC/standings`, {
      method: 'GET',
      headers: {
        'X-Auth-Token': apiKey
      },
      next: { revalidate: 3600 }
    });

    const data = await response.json();
    
    if (data.errorCode) {
      console.error('football-data.org Standings Error:', data.message);
      return [];
    }

    if (data.standings && data.standings.length > 0) {
      // Transform data to match API-Sports format: Array of groups
      // football-data.org separates TOTAL, HOME, AWAY. We only want TOTAL.
      const groupStandings = data.standings.filter((s: any) => s.type === 'TOTAL');
      
      return groupStandings.map((group: any) => {
        return group.table.map((row: any) => ({
          rank: row.position,
          team: {
            id: row.team.id,
            name: row.team.name,
            logo: row.team.crest
          },
          points: row.points,
          goalsDiff: row.goalDifference,
          all: {
            played: row.playedGames,
            win: row.won,
            draw: row.draw,
            lose: row.lost
          },
          group: group.group ? group.group.replace('_', ' ') : ''
        }));
      });
    }
    return [];
  } catch (error) {
    console.error('Error fetching football standings:', error);
    return [];
  }
}
