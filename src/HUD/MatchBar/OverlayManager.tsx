import { useEffect, useState, useRef } from 'react';
import * as I from 'csgogsi';
import { GSI } from '../../API/HUD';
import { useOverlayQueue } from './OverlayProvider';
import RoundMVP, { calculateMVP } from './RoundMVP';
import RoundSummary from './RoundSummary';
import StatsTable from './StatsTable';
import api from '../../API';
import { Match } from '../../API/types';

interface RoundResult {
  round: number;
  winner: 'CT' | 'T';
  winType: 'bomb' | 'defuse' | 'elimination' | 'time';
}

interface OverlayManagerProps {
  map: I.Map;
  phase: I.CSGO["phase_countdowns"];
  players: I.Player[];
}

const OverlayManager: React.FC<OverlayManagerProps> = ({ map, phase, players }) => {
  const { enqueueOverlay } = useOverlayQueue();
  const [prevRound, setPrevRound] = useState(0);
  const [matchData, setMatchData] = useState<Match | null>(null);
  const [killEvents, setKillEvents] = useState<I.KillEvent[]>([]);
  const hasProcessedRound = useRef(false);

  const currentRound = map.round + 1;
  const currentPhase = phase.phase || '';

  // Загружаем данные матча
  useEffect(() => {
    const loadMatchData = async () => {
      try {
        const match = await api.match.getCurrent();
        setMatchData(match);
      } catch (error) {
        console.error('Failed to load match data:', error);
      }
    };

    loadMatchData();

    // Подписываемся на события убийств
    const handleKill = (kill: I.KillEvent) => {
      setKillEvents(prev => [...prev, kill]);
    };

    // Очищаем kill события при начале нового раунда
    const handleData = (data: any) => {
      if (data.round && data.round.phase === "freezetime") {
        if (Number(data.phase_countdowns?.phase_ends_in) < 10) {
          setKillEvents([]);
        }
      }
    };

    GSI.on('kill', handleKill);
    GSI.on('data', handleData);

    return () => {
      GSI.off('kill', handleKill);
      GSI.off('data', handleData);
    };
  }, []);

  // Обработка окончания раунда и начала нового
  useEffect(() => {
    // Проверяем, что раунд изменился
    if (currentRound !== prevRound) {
      setPrevRound(currentRound);
      hasProcessedRound.current = false;
    }

    // Обрабатываем только в freezetime и только один раз за раунд
    if (currentPhase === 'freezetime' && !hasProcessedRound.current && currentRound > 1) {
      hasProcessedRound.current = true;

      // Получаем данные о раундах
      const currentVeto = matchData?.vetos.find((v: any) => !v.mapEnd && v.mapName === map.name);
      const roundsData = currentVeto?.rounds || [];
      const roundResults: RoundResult[] = roundsData
        .filter((r: any): r is NonNullable<typeof r> => r !== null)
        .map((r: any, index: number) => ({
          round: index + 1,
          winner: r.winner || 'CT',
          winType: r.win_type
        }));

      // Задержка 0.5 секунд перед началом показа оверлеев
      setTimeout(() => {
        // 1. RoundMVP - если есть данные о предыдущем раунде
        const prevRoundData = roundsData[currentRound - 2]; // -2 потому что currentRound уже новый
        if (prevRoundData) {
          const mvpData = calculateMVP({
            winner: { side: prevRoundData.winner },
            players: players
          });

          if (mvpData) {
            enqueueOverlay({
              type: 'mvp',
              component: <RoundMVP mvpData={mvpData} />,
              duration: 5000 // 5 секунд
            });
          }
        }

        // 2. RoundSummary - всегда показываем
        enqueueOverlay({
          type: 'roundSummary',
          component: (
            <RoundSummary 
              rounds={roundResults}
              currentRound={currentRound}
              phase={currentPhase}
            />
          ),
          duration: 5000 // 5 секунд
        });

        // 3. StatsTable - только каждый 5-й раунд
        if (currentRound % 5 === 0) {
          const left = map.team_ct.orientation === "left" ? map.team_ct : map.team_t;
          const right = map.team_ct.orientation === "left" ? map.team_t : map.team_ct;

          enqueueOverlay({
            type: 'statsTable',
            component: (
              <StatsTable 
                leftTeam={left}
                rightTeam={right}
                players={players}
                killEvents={killEvents}
                matchData={matchData}
              />
            ),
            duration: 5000 // 5 секунд
          });
        }
      }, 500);
    }
  }, [currentPhase, currentRound, prevRound, map, players, matchData, killEvents, enqueueOverlay]);

  // Компонент не рендерит ничего
  return null;
};

export default OverlayManager;
