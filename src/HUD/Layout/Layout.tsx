import { useState } from "react";
import TeamBox from "./../Players/TeamBox";
import MatchBar from "../MatchBar/MatchBar";
import Observed from "./../Players/Observed";
import RadarMaps from "./../Radar/RadarMaps";
import Trivia from "../Trivia/Trivia";
import UtilityLevel from '../SideBoxes/UtilityLevel';
import Killfeed from "../Killfeed/Killfeed";
import Overview from "../Overview/Overview";
import Tournament from "../Tournament/Tournament";
import { CSGO } from "csgogsi";
import { Match } from "../../API/types";
import { useAction } from "../../API/contexts/actions";
import { Scout } from "../Scout";
import OverlayTest from "../MatchBar/OverlayTest";
import { OverlayProvider } from "../MatchBar/OverlayProvider";

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
  const [ forceHide, setForceHide ] = useState(false);

  useAction('boxesState', (state) => {
    console.log("UPDATE STATE UMC", state);
    if (state === "show") {
       setForceHide(false);
    } else if (state === "hide") {
      setForceHide(true);
    }
  });

  const left = game.map.team_ct.orientation === "left" ? game.map.team_ct : game.map.team_t;
  const right = game.map.team_ct.orientation === "left" ? game.map.team_t : game.map.team_ct;

  const leftPlayers = game.players.filter(player => player.team.side === left.side);
  const rightPlayers = game.players.filter(player => player.team.side === right.side);
  const isFreezetime = (game.round && game.round.phase === "freezetime") || game.phase_countdowns.phase === "freezetime";
  return (
    <OverlayProvider>
      <div className="layout">
        <Killfeed />
        <Overview match={match} map={game.map} players={game.players || []} />
        <RadarMaps match={match} map={game.map} game={game} />
        <MatchBar map={game.map} phase={game.phase_countdowns} bomb={game.bomb} match={match} players={game.players} />
       
        <Tournament />

        <Observed player={game.player} />

        <TeamBox team={left} players={leftPlayers} side="left" current={game.player} />
        <TeamBox team={right} players={rightPlayers} side="right" current={game.player} />

        <Trivia />
        <Scout left={left.side} right={right.side} />
        <div className={"boxes left"}>
          <UtilityLevel 
            side={left.side} 
            players={game.players} 
            show={isFreezetime && !forceHide}
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
            show={isFreezetime && !forceHide}
            loss={Math.min(right.consecutive_round_losses * 500 + 1400, 3400)}
            equipment={rightPlayers.map(player => player.state.equip_value).reduce((pre, now) => pre + now, 0)}
            money={rightPlayers.map(player => player.state.money).reduce((pre, now) => pre + now, 0)}
            orientation="right"
          />
        </div>
        
        {/* Тестовая панель MVP - удалить в продакшене */}
        {/* <OverlayTest /> */}
      </div>
    </OverlayProvider>
  );
}
export default Layout;
