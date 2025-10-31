import React from 'react';
import * as I from 'csgogsi';
import './roundmvp.scss';

export interface MVPStat {
  label: string;
  value: string | number;
}

export interface MVPData {
  player: I.Player;
  type: 'CLUTCH' | 'ENTRY' | 'UTILITY' | 'PLANT' | 'SUPPORT';
  stats: MVPStat[];
}

interface RoundMVPProps {
  mvpData: MVPData;
}

const RoundMVP: React.FC<RoundMVPProps> = ({ mvpData }) => {
  const getMVPTitle = (type: MVPData['type']): string => {
    const titles = {
      CLUTCH: 'CLUTCH MVP',
      ENTRY: 'ENTRY MVP',
      UTILITY: 'UTILITY MVP',
      PLANT: 'PLANT MVP',
      SUPPORT: 'SUPPORT MVP'
    };
    return titles[type];
  };

  return (
    <div className="round-mvp">
      <div className="mvp-avatar">
        <img 
          src={mvpData.player.avatar || '/default-avatar.png'} 
          alt={mvpData.player.name}
        />
      </div>
      <div className="mvp-info">
        <div className="mvp-header">
          <span className="mvp-title">{getMVPTitle(mvpData.type)}</span> <span className="mvp-separator">-</span>
          <span className={`mvp-name ${mvpData.player.team.side}`}>{mvpData.player.name}</span>
        </div>
        <div className="mvp-stats">
          {mvpData.stats.slice(0, 3).map((stat, index) => (
            <div key={index} className="mvp-stat">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Функция для расчета MVP
export const calculateMVP = (roundData: any): MVPData | null => {
    if (!roundData || !roundData.players) return null;

    const players = roundData.players as I.Player[];
    
    let mvpPlayer: I.Player | null = null;
    let mvpType: MVPData['type'] = 'SUPPORT';
    let mvpStats: MVPStat[] = [];

    // 1. Проверка на Clutch MVP (1vX)
    const winningTeam = roundData.winner?.side;
    const winningPlayers = players.filter(p => p.team.side === winningTeam && p.state.health > 0);
    
    if (winningPlayers.length === 1 && winningPlayers[0].state.round_kills >= 2) {
      const clutchPlayer = winningPlayers[0];
      const enemiesAlive = players.filter(p => p.team.side !== winningTeam && p.state.health > 0).length;
      
      mvpPlayer = clutchPlayer;
      mvpType = 'CLUTCH';
      mvpStats = [
        { label: 'CLUTCH', value: `1v${enemiesAlive + clutchPlayer.state.round_kills}` },
        { label: 'KILLS', value: clutchPlayer.state.round_kills },
        { label: 'IMPACT', value: (clutchPlayer.state.round_totaldmg / 100 + clutchPlayer.state.round_kills * 2).toFixed(1) }
      ];
    }
    // 2. Entry MVP - первый килл + удержание преимущества
    else {
      let bestEntryPlayer = null as I.Player | null;
      let earliestKillTime = Infinity;

      players.forEach(player => {
        if (player.state.round_kills > 0 && player.team.side === winningTeam) {
          // Предполагаем, что первый килл был раньше
          const killTime = 115 - (player.state.round_kills * 10); // Примерная логика
          if (killTime < earliestKillTime) {
            earliestKillTime = killTime;
            bestEntryPlayer = player;
          }
        }
      });

      if (bestEntryPlayer && bestEntryPlayer.state.round_kills >= 2) {
        mvpPlayer = bestEntryPlayer;
        mvpType = 'ENTRY';
        const entryTime = Math.floor(earliestKillTime / 60) + ':' + (earliestKillTime % 60).toString().padStart(2, '0');
        mvpStats = [
          { label: 'ENTRY KILL', value: entryTime },
          { label: 'KILLS', value: bestEntryPlayer.state.round_kills },
          { label: 'MULTIKILL', value: bestEntryPlayer.state.round_kills }
        ];
      }
      // 3. Utility MVP - урон от гранат
      else {
        let bestUtilityPlayer = null as I.Player | null;
        let maxUtilityDmg = 100;

        players.forEach(player => {
          const utilDmg = player.state.round_totaldmg * 0.3; // Примерно 30% урона от утилити
          if (utilDmg > maxUtilityDmg) {
            maxUtilityDmg = utilDmg;
            bestUtilityPlayer = player;
          }
        });

        if (bestUtilityPlayer) {
          mvpPlayer = bestUtilityPlayer;
          mvpType = 'UTILITY';
          mvpStats = [
            { label: 'UTILITY DMG', value: Math.floor(maxUtilityDmg) },
            { label: 'IMPACT', value: (maxUtilityDmg / 100 + bestUtilityPlayer.state.round_kills).toFixed(1) },
            { label: 'ASSISTS', value: bestUtilityPlayer.stats.assists }
          ];
        }
        // 4. Support MVP - ассисты и трейды
        else {
          let bestSupportPlayer = null as I.Player | null;
          let maxSupport = 0;

          players.forEach(player => {
            const supportScore = player.stats.assists * 2 + player.state.round_kills;
            if (supportScore > maxSupport && player.stats.assists >= 2) {
              maxSupport = supportScore;
              bestSupportPlayer = player;
            }
          });

          if (bestSupportPlayer) {
            mvpPlayer = bestSupportPlayer;
            mvpType = 'SUPPORT';
            mvpStats = [
              { label: 'ASSISTS', value: bestSupportPlayer.stats.assists },
              { label: 'KILLS', value: bestSupportPlayer.state.round_kills },
              { label: 'TRADE KILL', value: Math.floor(bestSupportPlayer.state.round_kills * 0.5) }
            ];
          }
        }
      }
    }

    if (!mvpPlayer) return null;

    return {
      player: mvpPlayer,
      type: mvpType,
      stats: mvpStats
    };
  };


export default RoundMVP;
