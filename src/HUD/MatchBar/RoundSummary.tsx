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
}

const RoundSummary: React.FC<Props> = ({ rounds, currentRound }) => {
  // Определяем половину игры
  const getHalfLabel = (): string => {
    if (currentRound <= 12) return '1ST HALF';
    if (currentRound <= 24) return '2ND HALF';
    return 'OVERTIME';
  };

  console.log(rounds);

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
          <svg className={iconClass} viewBox="-5 0 33 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.3353 0C19.3351 0.000148089 22.3353 5 22.3353 5C22.3452 5.0295 24.3838 11.1545 22.3353 14C21.1082 15.7044 17.8717 16.9857 17.8353 17V21.5C17.8353 21.5 16.7487 22.8788 15.8353 23.5C13.0905 25.3665 10.0802 25.3664 7.33532 23.5C6.42783 22.8829 5.34925 21.5177 5.33532 21.5V17.5C5.33532 17.5 2.0259 15.8812 0.835313 14C-1.04414 11.03 0.835313 5 0.835313 5C0.854715 4.9678 3.85963 0 11.3353 0ZM19.9769 8.77442C20.3862 8.01379 19.7037 7.12709 18.8636 7.32813L11.4633 9.09863L4.06285 7.32813C3.22298 7.12738 2.54037 8.01388 2.94957 8.77442L6.36559 15.123C6.64849 15.6488 7.32637 15.8112 7.81676 15.4707L9.74743 14.1279L11.1674 15.6416C11.5624 16.0626 12.2303 16.0626 12.6254 15.6416L13.7025 14.4922L15.1097 15.4707C15.6001 15.8114 16.2779 15.6489 16.5609 15.123L19.9769 8.77442Z" />
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
            const isFutureRound = roundNum > currentRound - 1; // Используем currentRound вместо rounds.length

            return (
              <div key={roundNum} className="round-item">
                <div className={`round-square ${isCurrentRound ? 'current' : ''} ${isFutureRound ? 'future' : ''}`}>
                  {roundResult ? (
                    getRoundIcon(roundResult)
                  ) : isCurrentRound ? (
                    <span className="round-dash">-</span>
                  ) : !isFutureRound ? (
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
