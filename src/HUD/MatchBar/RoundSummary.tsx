import React from 'react';
import { C4, Defuse } from '../../assets/Icons';
import './roundsummary.scss';

interface RoundResult {
  round: number;
  winner: 'CT' | 'T';
  winType: 'bomb' | 'defuse' | 'elimination' | 'time';
}

interface Props {
  rounds: RoundResult[];
  currentRound: number;
  phase: string;
}

const RoundSummary: React.FC<Props> = ({ rounds, currentRound, phase }) => {
  // Определяем половину игры
  const getHalfLabel = (): string => {
    if (currentRound <= 12) return '1ST HALF';
    if (currentRound <= 24) return '2ND HALF';
    return 'OVERTIME';
  };

  // Генерируем массив из 12 раундов (или больше для овертайма)
  const maxRounds = currentRound <= 12 ? 12 : currentRound <= 24 ? 24 : Math.ceil(currentRound / 6) * 6;
  const roundsToShow = Array.from({ length: maxRounds }, (_, i) => i + 1);

  // Определяем, нужно ли показывать номер под квадратом
  const shouldShowNumber = (roundNum: number): boolean => {
    return roundNum === 1 || roundNum === 4 || roundNum === 8 || roundNum === 12 || 
           roundNum === 16 || roundNum === 20 || roundNum === 24;
  };

  // Получаем иконку для результата раунда
  const getRoundIcon = (result: RoundResult | undefined) => {
    if (!result) return null;
    const iconClass = `round-icon ${result.winner}`;
    
    switch (result.winType) {
      case 'bomb':
        return <C4 className={iconClass} />;
      case 'defuse':
        return <Defuse className={iconClass} />;
      case 'elimination':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
        );
      case 'time':
        return (
          <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="round-summary">
      <div className="summary-header">
        <span className="summary-title">ROUND SUMMARY</span>
        <span className="summary-separator">-</span>
        <span className="summary-half">{getHalfLabel()}</span>
      </div>
      <div className="summary-body">
        <div className="rounds-grid">
          {roundsToShow.map((roundNum) => {
            const roundResult = rounds.find(r => r.round === roundNum);
            const isCurrentRound = roundNum === currentRound;
            const isFutureRound = roundNum > rounds.length;

            return (
              <div key={roundNum} className="round-item">
                <div className={`round-square ${isCurrentRound ? 'current' : ''} ${isFutureRound ? 'future' : ''}`}>
                  {roundResult ? (
                    getRoundIcon(roundResult)
                  ) : isCurrentRound ? (
                    <span className="round-dash">-</span>
                  ) : null}
                </div>
                {shouldShowNumber(roundNum) && (
                  <span className="round-number">{roundNum}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoundSummary;
