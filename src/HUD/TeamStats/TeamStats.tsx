import { useMemo } from "react";
import { Match, Veto } from "../../API/types";
import { useConfig } from "../../API/contexts/actions";
import "./teamstats.scss";

interface Props {
  match: Match | null;
}

const TeamStats = ({ match }: Props) => {
  const config = useConfig("team_stats");
  const selectedTeam = config?.selected_team;
  const selectedTeamId = selectedTeam?.id;

  const stats = useMemo(() => {
    if (!match || !selectedTeamId) {
      return { rounds: 0, maps: 0, roundMoney: 0, mapMoney: 0, total: 0 };
    }

    let totalRounds = 0;
    let totalMaps = 0;

    // Подсчет выигранных карт
    if (match.left.id === selectedTeamId) {
      totalMaps = match.left.wins;
    } else if (match.right.id === selectedTeamId) {
      totalMaps = match.right.wins;
    }

    // Подсчет выигранных раундов на всех картах
    match.vetos.forEach((veto: Veto) => {
      if (veto.type === "pick" || veto.type === "decider") {
        if (veto.score && veto.score[selectedTeamId] !== undefined) {
          totalRounds += veto.score[selectedTeamId];
        }
      }
    });

    const roundMoney = totalRounds * 100; // 100 руб за раунд
    const mapMoney = totalMaps * 1000; // 1000 руб за карту
    const total = roundMoney + mapMoney;

    return { rounds: totalRounds, maps: totalMaps, roundMoney, mapMoney, total };
  }, [match, selectedTeamId]);

  if (!selectedTeamId) {
    return null;
  }

  return (
    <div className="team-stats">
      <div className="">
        <div className="team-stats__logo"></div>
      </div>
      
      <div className="team-stats__block team-stats__stat">
        <div className="team-stats__label">РАУНДЫ</div>
        <div className="team-stats__value">
          {stats.rounds} ({stats.roundMoney.toLocaleString("ru-RU")})
        </div>
      </div>

      <div className="team-stats__block team-stats__stat">
        <div className="team-stats__label">МАТЧИ/КАРТЫ</div>
        <div className="team-stats__value">
          {stats.maps} ({stats.mapMoney.toLocaleString("ru-RU")})
        </div>
      </div>

      <div className="team-stats__block team-stats__block--total">
        <div className="team-stats__label">ИТОГО</div>
        <div className="team-stats__value">
          {stats.total.toLocaleString("ru-RU")}
        </div>
      </div>
    </div>
  );
};

export default TeamStats;
