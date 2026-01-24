import * as I from "csgogsi";
import { Timer } from "./MatchBar";
import TeamLogo from './TeamLogo';
import saberAnimation from './../../assets/saber-square.webm';

interface IProps {
  orientation: "left" | "right";
  timer: Timer | null;
  team: I.Team;
  bo: number;
  wins: number;
  showRoundWin: boolean;
  streak: number;
}

const TeamScore = ({orientation, team, bo, wins, showRoundWin, streak }: IProps) => {

    const showSaberAnimation = streak >= 3;

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

    const teamName = team?.name || "";
    const displayName = teamName.length > 6 ? teamName.slice(0, 6) + "..." : teamName;

    return (
      <>
        <div className={`team-score-slot ${orientation} ${team.side || ''} ${showRoundWin ? 'show-round-win' : ''}`}>
          <div className={`team ${orientation} ${team.side || ''}`}>
            <div className={`team-content ${showRoundWin ? 'is-hidden' : ''}`}>
              <div className="team-name">{displayName || null}</div>
              <div className="logo-container">
                <TeamLogo team={team} />
                {showSaberAnimation && (
                  <video 
                    className="saber-animation" 
                    src={saberAnimation}
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                  />
                )}
              </div>
              {bo > 1 && (
                <div className={`win-indicators ${orientation}`}>
                  {renderWinIndicators()}
                </div>
              )}
            </div>
          </div>

          <div className={`round-win ${team.side} ${showRoundWin ? 'show' : ''}`}>ROUND WIN</div>
        </div>
      </>
    );
}

export default TeamScore;