import * as I from "csgogsi";
import { Timer } from "./MatchBar";
import TeamLogo from './TeamLogo';

interface IProps {
  orientation: "left" | "right";
  timer: Timer | null;
  team: I.Team;
  bo: number;
  wins: number;
}

const TeamScore = ({orientation, team, bo, wins }: IProps) => {

    const renderWinIndicators = () => {
      if (bo === 0) return null;
      const maxWins = Math.ceil(bo / 2);
      const indicators = [];
      
      for (let i = 0; i < maxWins; i++) {
        indicators.push(
          <div 
            key={i} 
            className={`win-indicator ${i < wins ? 'win' : ''} ${team.side}`}
          />
        );
      }
      
      return indicators;
    };

    return (
      <>
        <div className={`team ${orientation} ${team.side || ''}`}>
          <div className="team-name">{team?.name || null}</div>
          <TeamLogo team={team} />
          {bo > 1 && (
            <div className={`win-indicators ${orientation}`}>
              {renderWinIndicators()}
            </div>
          )}
        </div>
      </>
    );
}

export default TeamScore;