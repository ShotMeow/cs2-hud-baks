import React, { useCallback } from 'react';
import * as I from 'csgogsi';
import { Match } from '../../API/types';
import './statstable.scss';

interface PlayerStats {
  player: I.Player;
  kills: number;
  deaths: number;
  assists: number;
}

interface TeamStats {
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  players: PlayerStats[];
}

interface StatsTableProps {
  leftTeam: I.Team;
  rightTeam: I.Team;
  players: I.Player[];
  killEvents?: I.KillEvent[];
  matchData?: Match | null;
}

const StatsTable: React.FC<StatsTableProps> = ({ leftTeam, rightTeam, players, killEvents = [], matchData = null }) => {

  // Определяем, какая команда лидирует
  const getLeaderTeam = useCallback((leftValue: number, rightValue: number) => {
    if (leftValue > rightValue) return 'left';
    if (rightValue > leftValue) return 'right';
    return 'equal';
  }, []);

  // Получаем статистику команды
  const getTeamStats = useCallback((teamSide: 'CT' | 'T'): TeamStats => {
    const teamPlayers = players.filter(p => p.team.side === teamSide);
    
    const stats: TeamStats = {
      totalKills: 0,
      totalDeaths: 0,
      totalAssists: 0,
      players: []
    };

    teamPlayers.forEach(player => {
      // Используем match_stats если доступно, иначе stats
      const kills = (player as any).match_stats?.kills ?? player.stats?.kills ?? 0;
      const deaths = (player as any).match_stats?.deaths ?? player.stats?.deaths ?? 0;
      const assists = (player as any).match_stats?.assists ?? player.stats?.assists ?? 0;

      const playerStats: PlayerStats = {
        player,
        kills,
        deaths,
        assists
      };

      stats.totalKills += playerStats.kills;
      stats.totalDeaths += playerStats.deaths;
      stats.totalAssists += playerStats.assists;
      stats.players.push(playerStats);
    });

    return stats;
  }, [players]);

  // Получаем статистику дуэлей между игроками
  const getDuelStats = useCallback((player1: I.Player, player2: I.Player) => {
    let kills1to2 = 0;
    let kills2to1 = 0;

    // Анализируем события убийств из текущего раунда
    killEvents.forEach(event => {
      // Проверяем убийство player1 -> player2
      if (event.killer && event.victim) {
        if (event.killer.steamid === player1.steamid && event.victim.steamid === player2.steamid) {
          kills1to2++;
        }
        // Проверяем убийство player2 -> player1
        if (event.killer.steamid === player2.steamid && event.victim.steamid === player1.steamid) {
          kills2to1++;
        }
      }
    });

    // Если нет данных из killfeed, используем данные матча как запасной вариант
    if (kills1to2 === 0 && kills2to1 === 0 && matchData) {
      matchData.vetos.forEach(veto => {
        if (veto.rounds) {
          veto.rounds.forEach(round => {
            if (round && round.players) {
              const player1Data = round.players[player1.steamid];
              const player2Data = round.players[player2.steamid];
              
              // Упрощенная логика на основе общих убийств в раунде
              if (player1Data && player1Data.kills > 0) {
                kills1to2 += Math.min(player1Data.kills, 1);
              }
              if (player2Data && player2Data.kills > 0) {
                kills2to1 += Math.min(player2Data.kills, 1);
              }
            }
          });
        }
      });
    }

    const winner = kills1to2 > kills2to1 ? 'left' : 
                   kills2to1 > kills1to2 ? 'right' : 'equal';
    
    return {
      text: `${kills1to2} / ${kills2to1}`,
      winner
    };
  }, [killEvents, matchData]);

  // Рендерим статистику
  const leftStats = getTeamStats(leftTeam.side);
  const rightStats = getTeamStats(rightTeam.side);

  const killsLeader = getLeaderTeam(leftStats.totalKills, rightStats.totalKills);
  const deathsLeader = getLeaderTeam(leftStats.totalDeaths, rightStats.totalDeaths);
  const assistsLeader = getLeaderTeam(leftStats.totalAssists, rightStats.totalAssists);

  // Функция для безопасного расчета процента
  const safePercentage = (value: number, total: number): string => {
    if (total === 0) return '50%';
    return `${(value / total) * 100}%`;
  };

  return (
    <div className="stats-table">
      {/* Заголовок с общими счетами */}
      <div className="stats-header">
          <div className="stat-row">
          <div className="stat-label">KILLS</div>
          <div className="stat-indicator">
            {killsLeader !== 'equal' && (
              <div 
                className={`indicator-fill ${killsLeader === 'left' ? 'CT' : 'T'}`}
                style={{ 
                  width: killsLeader === 'left' ? 
                         safePercentage(leftStats.totalKills, leftStats.totalKills + rightStats.totalKills) :
                         safePercentage(rightStats.totalKills, leftStats.totalKills + rightStats.totalKills),
                  left: killsLeader === 'right' ? 'auto' : '0',
                  right: killsLeader === 'right' ? '0' : 'auto'
                }}
              />
            )}
            <div className="indicator-values">
              <span className={`left-value ${leftTeam.side}`}>{leftStats.totalKills}</span>
              <span className={`right-value ${rightTeam.side}`}>{rightStats.totalKills}</span>
            </div>
          </div>
        </div>

          <div className="stat-row">
          <div className="stat-label">DEATHS</div>
          <div className="stat-indicator">
            {deathsLeader !== 'equal' && (
              <div 
                className={`indicator-fill ${deathsLeader === 'left' ? 'CT' : 'T'}`}
                style={{ 
                  width: deathsLeader === 'left' ? 
                         safePercentage(leftStats.totalDeaths, leftStats.totalDeaths + rightStats.totalDeaths) :
                         safePercentage(rightStats.totalDeaths, leftStats.totalDeaths + rightStats.totalDeaths),
                  left: deathsLeader === 'right' ? 'auto' : '0',
                  right: deathsLeader === 'right' ? '0' : 'auto'
                }}
              />
            )}
            <div className="indicator-values">
              <span className={`left-value ${leftTeam.side}`}>{leftStats.totalDeaths}</span>
              <span className={`right-value ${rightTeam.side}`}>{rightStats.totalDeaths}</span>
            </div>
          </div>
        </div>

          <div className="stat-row">
          <div className="stat-label">ASSISTS</div>
          <div className="stat-indicator">
            {assistsLeader !== 'equal' && (
              <div 
                className={`indicator-fill ${assistsLeader === 'left' ? 'CT' : 'T'}`}
                style={{ 
                  width: assistsLeader === 'left' ? 
                         safePercentage(leftStats.totalAssists, leftStats.totalAssists + rightStats.totalAssists) :
                         safePercentage(rightStats.totalAssists, leftStats.totalAssists + rightStats.totalAssists),
                  left: assistsLeader === 'right' ? 'auto' : '0',
                  right: assistsLeader === 'right' ? '0' : 'auto'
                }}
              />
            )}
            <div className="indicator-values">
              <span className={`left-value ${leftTeam.side}`}>{leftStats.totalAssists}</span>
              <span className={`right-value ${rightTeam.side}`}>{rightStats.totalAssists}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Таблица дуэлей */}
      <div className="duels-table">
        <div className="table-header">
          <div className="corner"></div>
          {rightStats.players.map((player, index) => (
            <div key={index} className="header-cell right-team">
              {player.player.name}
            </div>
          ))}
        </div>
        
        {leftStats.players.map((leftPlayer, leftIndex) => (
          <div key={leftIndex} className="table-row">
            <div className="header-cell left-team">
              {leftPlayer.player.name}
            </div>
            {rightStats.players.map((rightPlayer, rightIndex) => {
              const duel = getDuelStats(leftPlayer.player, rightPlayer.player);
              const [leftKills, rightKills] = duel.text.split(' / ').map(Number);
              
              return (
                <div key={rightIndex} className="duel-cell" data-winner={duel.winner}>
                  <span className={leftKills > rightKills ? leftTeam.side : ''}>{leftKills}</span>
                  <span className="separator"> / </span>
                  <span className={rightKills > leftKills ? rightTeam.side : ''}>{rightKills}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

};

export default StatsTable;
