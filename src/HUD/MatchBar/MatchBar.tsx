import * as I from "csgogsi";
import "./matchbar.scss";
import TeamScore from "./TeamScore";
import { useBombTimer } from "./../Timers/Countdown";
import { Match } from './../../API/types';
import { C4, Defuse } from "../../assets/Icons";
import OverlayManager from "./OverlayManager";
import StatsTable from "./StatsTable";


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
          <TeamScore team={left} orientation={"left"} timer={left.side === "CT" ? defuseTimer : plantTimer} bo={bo} wins={leftWins} />
          <div id="timer">
            <div className={`score left ${left.side}`}>{left.score}</div>
            <div className="round-info">
               <div id={`round_timer_text`}>{time}</div>
               <div className="current-round">
                 <span className="alive-count CT">{ctAlive}</span>
                 <span className="round-text">RD {currentRound}</span>
                 <span className="alive-count T">{tAlive}</span>
               </div>
            </div>
            <div className={`score right ${right.side}`}>{right.score}</div>
          </div>
          <TeamScore team={right} orientation={"right"} timer={right.side === "CT" ? defuseTimer : plantTimer} bo={bo} wins={rightWins} />
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
