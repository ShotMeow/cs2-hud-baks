import Player from './Player'
import * as I from 'csgogsi';
import { useState, useEffect } from 'react';
import './players.scss';

interface Props {
  players: I.Player[],
  team: I.Team,
  side: 'right' | 'left',
  current: I.Player | null,
  lastKillEvent?: I.KillEvent | null,
  bomb?: I.Bomb | null,
}

const TeamBox = ({players, team, side, current, lastKillEvent, bomb}: Props) => {
  const [playerKillEvents, setPlayerKillEvents] = useState<Record<string, I.KillEvent | null>>({});

  // Update kill events for players
  useEffect(() => {
    if (lastKillEvent) {
      console.log('TeamBox received kill event:', {
        victim: lastKillEvent.victim.name,
        team: team.name
      });
      
      setPlayerKillEvents(prev => ({
        ...prev,
        [lastKillEvent.victim.steamid]: lastKillEvent
      }));
      
      // Clear kill event after animation completes
      const timeout = setTimeout(() => {
        setPlayerKillEvents(prev => ({
          ...prev,
          [lastKillEvent.victim.steamid]: null
        }));
      }, 3000); // Give extra time for animation
      
      return () => clearTimeout(timeout);
    }
  }, [lastKillEvent, team.name]);

  return (
    <div className={`teambox ${team.side} ${side}`}>
      {players.map(player => <Player
        key={player.steamid}
        player={player}
        isObserved={!!(current && current.steamid === player.steamid)}
        lastKillEvent={playerKillEvents[player.steamid]}
        bomb={bomb}
      />)}
    </div>
  );
}

export default TeamBox;