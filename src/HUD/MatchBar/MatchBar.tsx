import * as I from "csgogsi";
import { useEffect, useRef, useState } from "react";
import "./matchbar.scss";
import TeamScore from "./TeamScore";
import { useBombTimer } from "./../Timers/Countdown";
import { Match } from './../../API/types';
import { C4, Defuse } from "../../assets/Icons";
import OverlayManager from "./OverlayManager";
import technicalPauseIcon from "../../assets/states/technical-pause.svg";
import tacticalPauseIcon from "../../assets/states/tactical-pause.svg";


function stringToClock(time: string | number, pad = true) {
  if (typeof time === "string") {
    time = parseFloat(time);
  }
  const countdown = Math.abs(Math.ceil(time));
  const minutes = Math.floor(countdown / 60);
  const seconds = countdown - minutes * 60;
  if (pad && seconds < 10) {
    return `${minutes}:0${seconds}`;
  }
  return `${minutes}:${seconds}`;
}

interface IProps {
  match: Match | null;
  map: I.Map;
  phase: I.CSGO["phase_countdowns"],
  bomb: I.Bomb | null,
  players: I.Player[];
}

export interface Timer {
  time: number;
  active: boolean;
  side: "left"|"right";
  type: "defusing" | "planting";
  player: I.Player | null;
}

const Matchbar = (props: IProps) => {
    const { map, phase, match, players } = props;
    const time = stringToClock(phase.phase_ends_in);
    const left = map.team_ct.orientation === "left" ? map.team_ct : map.team_t;
    const right = map.team_ct.orientation === "left" ? map.team_t : map.team_ct;

    const [roundWinSide, setRoundWinSide] = useState<I.Side | null>(null);
    const prevScoresRef = useRef({ ct: map.team_ct.score, t: map.team_t.score });
    const prevRoundRef = useRef(map.round);

    useEffect(() => {
      const prevScores = prevScoresRef.current;
      const prevRound = prevRoundRef.current;

      if (map.round !== prevRound) {
        setRoundWinSide(null);
        prevRoundRef.current = map.round;
      }

      const ctDelta = map.team_ct.score - prevScores.ct;
      const tDelta = map.team_t.score - prevScores.t;

      if (ctDelta > 0 && tDelta === 0) {
        setRoundWinSide("CT");
      } else if (tDelta > 0 && ctDelta === 0) {
        setRoundWinSide("T");
      }

      prevScoresRef.current = { ct: map.team_ct.score, t: map.team_t.score };
    }, [map.round, map.team_ct.score, map.team_t.score]);

    const pauseKind = phase.phase === "paused" ? "technical" : (phase.phase === "timeout_ct" || phase.phase === "timeout_t") ? "tactical" : null;
    const pauseIcon = pauseKind === "technical" ? technicalPauseIcon : pauseKind === "tactical" ? tacticalPauseIcon : null;

    const bombData = useBombTimer();
    const plantTimer: Timer | null = bombData.state === "planting" ? { time:bombData.plantTime, active: true, side: bombData.player?.team.orientation || "right", player: bombData.player, type: "planting"} : null;
    const defuseTimer: Timer | null = bombData.state === "defusing" ? { time:bombData.defuseTime, active: true, side: bombData.player?.team.orientation || "left", player: bombData.player, type: "defusing"} : null;

    const bo = match ? Number(match.matchType.substr(-1)) : 0;
    const leftWins = match?.left.wins || 0;
    const rightWins = match?.right.wins || 0;

    const currentRound = map.round + 1;
    const ctPlayers = players.filter(player => player.team.side === "CT");
    const tPlayers = players.filter(player => player.team.side === "T");
    const ctAlive = ctPlayers.filter(player => player.state.health > 0).length;
    const tAlive = tPlayers.filter(player => player.state.health > 0).length;

    const isBombPlanted = bombData.state === "planted" || bombData.state === "defusing";
    const isDefusing = bombData.state === "defusing";

    return (
      <>
        <div id={`matchbar`}>
          <TeamScore team={left} orientation={"left"} timer={left.side === "CT" ? defuseTimer : plantTimer} bo={bo} wins={leftWins} showRoundWin={roundWinSide === left.side} />
          <div id="timer">
            <div className={`score left ${left.side}`}>{left.score}</div>
            <div className="round-info-slot">
              <div className={`round-info ${pauseKind ? "is-hidden" : ""}`}>
                <div className="round-timer-slot">
                  <div id={`round_timer_text`}>{time}</div>
                </div>
                <div className="current-round">
                  <span className="alive-count CT">{ctAlive}</span>
                  <span className="round-text">RD {currentRound}</span>
                  <span className="alive-count T">{tAlive}</span>
                </div>
              </div>

              <div className={`pause-icon ${pauseKind ? "show" : ""} ${pauseKind || ""}`}>
                {pauseIcon ? <img src={pauseIcon} alt={pauseKind === "technical" ? "Technical pause" : "Tactical pause"} /> : null}
              </div>
            </div>
            <div className={`score right ${right.side}`}>{right.score}</div>
          </div>
          <TeamScore team={right} orientation={"right"} timer={right.side === "CT" ? defuseTimer : plantTimer} bo={bo} wins={rightWins} showRoundWin={roundWinSide === right.side} />
        </div>
        
        {/* Индикаторы бомбы и дефуза */}
        {isBombPlanted && bombData.bombTime > 0 && (
          <div className="bomb-indicators">
            {/* Индикатор бомбы */}
            <div className="bomb-indicator">
              <div className="indicator-background">
                <div 
                  className="indicator-fill bomb-fill" 
                  style={{ width: `${100 - (bombData.bombTime / 40) * 100}%` }}
                />
              </div>
              <div className="indicator-content">
                <C4 />
                <span className="indicator-time">{bombData.bombTime.toFixed(1)}</span>
              </div>
            </div>
            
            {/* Индикатор дефуза */}
            {isDefusing && bombData.player && bombData.defuseTime > 0 && (
              <div className="defuse-indicator">
                <div className="indicator-background">
                  <div 
                    className="indicator-fill defuse-fill" 
                    style={{ 
                      width: `${100 - (bombData.defuseTime / (bombData.player.state.defusekit ? 5 : 10)) * 100}%` 
                    }}
                  />
                </div>
                <div className="indicator-content">
                  <Defuse />
                  <span className="indicator-time">{bombData.defuseTime.toFixed(1)}</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Менеджер оверлеев */}
        <OverlayManager 
          map={map}
          phase={phase}
          players={players}
        />
      </>
    );
}

export default Matchbar;
