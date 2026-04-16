import { Team } from "csgogsi";
import { Match, Veto } from "../../API/types";
import TeamLogo from "../MatchBar/TeamLogo";
import "./vetopanel.scss";

import dust2 from "../../assets/maps/dust2.webp";
import mirage from "../../assets/maps/mirage.webp";
import inferno from "../../assets/maps/inferno.jpeg";
import nuke from "../../assets/maps/nuke.webp";
import overpass from "../../assets/maps/overpass.jpg";
import vertigo from "../../assets/maps/vertigo.webp";
import ancient from "../../assets/maps/ancient.jpg";
import anubis from "../../assets/maps/anubis.jpg";
import train from "../../assets/maps/train.webp";

const mapBackgrounds: Record<string, string> = {
  de_dust2: dust2,
  de_mirage: mirage,
  de_inferno: inferno,
  de_nuke: nuke,
  de_overpass: overpass,
  de_vertigo: vertigo,
  de_ancient: ancient,
  de_anubis: anubis,
  de_train: train,
};

interface Props {
  match: Match | null;
  teams: Team[];
  currentMapName: string;
  visible: boolean;
}

const VetoPanel = ({ match, teams, currentMapName, visible }: Props) => {
  if (!match || !match.vetos.length) return null;

  const vetos = match.vetos.filter((v) => v.mapName);

  return (
    <div className={`veto-panel ${visible ? "show" : ""}`}>
      <div className="veto-panel__track">
        {vetos.map((veto, i) => (
          <VetoCard
            key={`${veto.mapName}-${i}`}
            veto={veto}
            index={i}
            total={vetos.length}
            teams={teams}
            isActive={currentMapName.includes(veto.mapName)}
            visible={visible}
          />
        ))}
      </div>
    </div>
  );
};

export default VetoPanel;

const VetoCard = ({
  veto,
  index,
  total,
  teams,
  isActive,
  visible,
}: {
  veto: Veto;
  index: number;
  total: number;
  teams: Team[];
  isActive: boolean;
  visible: boolean;
}) => {
  const bg = mapBackgrounds[veto.mapName];
  const pickerTeam = teams.find((t) => t.id === veto.teamId);
  const winnerTeam = veto.winner
    ? teams.find((t) => t.id === veto.winner)
    : null;

  const typeLabel =
    veto.type === "ban" ? "BAN" : veto.type === "decider" ? "DECIDER" : "PICK";

  const score = veto.score
    ? Object.values(veto.score).sort().join(" : ")
    : null;

  return (
    <div
      className={`veto-card ${veto.type} ${isActive ? "active" : ""} ${visible ? "visible" : ""}`}
      style={{ transitionDelay: visible ? `${index * 80}ms` : `${(total - 1 - index) * 50}ms` }}
    >
      <div className="veto-card__bg" style={{ backgroundImage: bg ? `url(${bg})` : undefined }} />
      <div className="veto-card__overlay" />

      {/* Type badge */}
      <div className={`veto-card__type ${veto.type}`}>{typeLabel}</div>

      {/* Active indicator */}
      {isActive && <div className="veto-card__live">LIVE</div>}

      {/* Map name */}
      <div className="veto-card__name">
        {veto.mapName.replace("de_", "")}
      </div>

      {/* Footer info */}
      <div className="veto-card__footer">
        {pickerTeam && veto.type !== "decider" && (
          <div className="veto-card__picker">
            <TeamLogo team={pickerTeam} />
          </div>
        )}
        {winnerTeam && score && (
          <div className="veto-card__result">
            <div className="veto-card__score">{score}</div>
            <div className="veto-card__winner">
              <TeamLogo team={winnerTeam} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
