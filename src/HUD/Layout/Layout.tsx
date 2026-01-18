import { useState, useEffect, useRef } from "react";
import TeamBox from "./../Players/TeamBox";
import MatchBar from "../MatchBar/MatchBar";
import Observed from "./../Players/Observed";
import RadarMaps from "./../Radar/RadarMaps";
import UtilityLevel from '../SideBoxes/UtilityLevel';
import Killfeed from "../Killfeed/Killfeed";
import { CSGO, KillEvent } from "csgogsi";
import { Match } from "../../API/types";
import { GSI } from "../../API/HUD";
import { Scout } from "../Scout";
import { OverlayProvider } from "../MatchBar/OverlayProvider";
import TeamStats from "../TeamStats/TeamStats";
import { useBombTimer } from "../Timers/Countdown";
import bombPlant from "../../assets/bombs/HUD_Bomb_Plant.webm";
import defuse10s from "../../assets/bombs/HUD_Bomb_Defuse_10s.webm";
import defuse5s from "../../assets/bombs/HUD_Bomb_Defuse_5s.webm";
import OverlayTest from "../MatchBar/OverlayTest";

interface Props {
  game: CSGO,
  match: Match | null
}
/*
interface State {
  winner: Team | null,
  showWin: boolean,
  forceHide: boolean
}*/

const Layout = ({game,match}: Props) => {
  const [lastKillEvent, setLastKillEvent] = useState<KillEvent | null>(null);
  const [bombVideo, setBombVideo] = useState<string | null>(null);
  const bombVideoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousBombStateRef = useRef<string | null>(null);
  
  // Use the existing bomb timer hook
  const bombData = useBombTimer();

  // Listen for kill events
  useEffect(() => {
    const handleKill = (kill: KillEvent) => {
      setLastKillEvent(kill);
      // Clear the kill event after longer time to ensure it reaches the Player component
      setTimeout(() => {
        setLastKillEvent(null);
      }, 2000); // Increased from 100ms to 2000ms
    };

    GSI.on('kill', handleKill);

    return () => {
      GSI.off('kill', handleKill);
    };
  }, []);

  // Listen for bomb events using useBombTimer
  useEffect(() => {
    const currentBombState = bombData.state;
    const previousBombState = previousBombStateRef.current;
    
    // Check for bomb planting start (when state changes TO planting)
    if (currentBombState === 'planting' && previousBombState !== 'planting') {
      setBombVideo(bombPlant);
      
      // Clear any existing timeout
      if (bombVideoTimeoutRef.current) {
        clearTimeout(bombVideoTimeoutRef.current);
      }
      
      // Hide video after animation completes
      bombVideoTimeoutRef.current = setTimeout(() => {
        setBombVideo(null);
      }, 3000);
    }
    
    // Check for bomb defusing start (when state changes TO defusing)
    if (currentBombState === 'defusing' && previousBombState !== 'defusing') {
      const hasDefuseKit = bombData.player?.state.defusekit || false;
      const videoSrc = hasDefuseKit ? defuse5s : defuse10s;
      
      setBombVideo(videoSrc);
      
      // Clear any existing timeout
      if (bombVideoTimeoutRef.current) {
        clearTimeout(bombVideoTimeoutRef.current);
      }
      
      // Hide video after animation completes
      bombVideoTimeoutRef.current = setTimeout(() => {
        setBombVideo(null);
      }, hasDefuseKit ? 5000 : 10000);
    }
    
    // Update previous state
    previousBombStateRef.current = currentBombState;
    
    // Cleanup
    return () => {
      if (bombVideoTimeoutRef.current) {
        clearTimeout(bombVideoTimeoutRef.current);
      }
    };
  }, [bombData.state, bombData.player]);

  const left = game.map.team_ct.orientation === "left" ? game.map.team_ct : game.map.team_t;
  const right = game.map.team_ct.orientation === "left" ? game.map.team_t : game.map.team_ct;

  const leftPlayers = game.players.filter(player => player.team.side === left.side);
  const rightPlayers = game.players.filter(player => player.team.side === right.side);
  const isFreezetime = (game.round && game.round.phase === "freezetime") || game.phase_countdowns.phase === "freezetime";
  return (
      <div className="layout">
        <OverlayProvider>
        {/* Bomb video overlay */}
        {bombVideo && (
          <video 
            src={bombVideo} 
            style={{
              width: '320px',
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              objectFit: 'cover',
              zIndex: 1000,
              pointerEvents: 'none'
            }}
            autoPlay
            muted 
            playsInline
          />
        )}
        
        <Killfeed />
        <RadarMaps match={match} map={game.map} game={game} />
        <MatchBar map={game.map} phase={game.phase_countdowns} bomb={game.bomb} match={match} players={game.players} />

        <Observed player={game.player} />

        <TeamBox team={left} players={leftPlayers} side="left" current={game.player} lastKillEvent={lastKillEvent} bomb={game.bomb} />
        <TeamBox team={right} players={rightPlayers} side="right" current={game.player} lastKillEvent={lastKillEvent} bomb={game.bomb} />

        <Scout left={left.side} right={right.side} />
        <div className={"boxes left"}>
          <UtilityLevel 
            side={left.side} 
            players={game.players} 
            show={isFreezetime}
            loss={Math.min(left.consecutive_round_losses * 500 + 1400, 3400)}
            equipment={leftPlayers.map(player => player.state.equip_value).reduce((pre, now) => pre + now, 0)}
            money={leftPlayers.map(player => player.state.money).reduce((pre, now) => pre + now, 0)}
            orientation="left"
          />
        </div>
        <div className={"boxes right"}>
          <UtilityLevel 
            side={right.side} 
            players={game.players} 
            show={isFreezetime}
            loss={Math.min(right.consecutive_round_losses * 500 + 1400, 3400)}
            equipment={rightPlayers.map(player => player.state.equip_value).reduce((pre, now) => pre + now, 0)}
            money={rightPlayers.map(player => player.state.money).reduce((pre, now) => pre + now, 0)}
            orientation="right"
          />
        </div>
        
        {/* Тестовая панель MVP - удалить в продакшене */}
        {/* <OverlayTest /> */}
        <TeamStats match={match} />
        </OverlayProvider>
      </div>
  );
}
export default Layout;
