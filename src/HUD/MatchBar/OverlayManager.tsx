import { useCallback, useEffect, useRef, useState } from 'react';
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

interface VetoData {
  mapName?: string;
  mapEnd?: boolean;
  rounds?: Array<{
    winner?: 'CT' | 'T';
    win_type?: 'bomb' | 'defuse' | 'elimination' | 'time';
  } | null>;
}

const extractMapName = (fullMapName: string): string => {
  return fullMapName.includes('/') ?
    fullMapName.split('/').pop() || fullMapName :
    fullMapName;
};

const findMatchingVeto = (vetos: VetoData[], baseMapName: string, fullMapName: string): VetoData | null => {
  return vetos.find((v: VetoData) => {
    const mapName = v.mapName ?? '';
    const mapNameMatch = mapName === baseMapName ||
      mapName === `de_${baseMapName}` ||
      mapName === baseMapName.replace(/^de_/, '') ||
      mapName === fullMapName ||
      mapName === '';
    return !(v.mapEnd ?? false) && mapNameMatch;
  }) || null;
};

const getFallbackVeto = (vetos: VetoData[], fullMapName: string): VetoData | null => {
  const allMapNamesEmpty = vetos.every(veto => !(veto.mapName ?? ''));
  return vetos.find((v: VetoData, index: number) => {
    const isActive = !(v.mapEnd ?? false);
    const hasRounds = (v.rounds?.length ?? 0) > 0;
    const isFirstWorkshop = index === 0 && fullMapName.includes('workshop');
    return (isActive && hasRounds) || (isActive && isFirstWorkshop) || (isActive && allMapNamesEmpty && index === 0);
  }) || null;
};

const reconstructRoundResults = (ctScore: number, tScore: number, currentRoundNum: number): RoundResult[] => {
  const results: RoundResult[] = [];
  let ctTempScore = 0;
  let tTempScore = 0;

  for (let i = 1; i < currentRoundNum; i++) {
    if (ctTempScore < ctScore) {
      results.push({ round: i, winner: 'CT', winType: 'elimination' });
      ctTempScore++;
    } else if (tTempScore < tScore) {
      results.push({ round: i, winner: 'T', winType: 'elimination' });
      tTempScore++;
    }
  }

  return results;
};

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
  const [localRoundResults, setLocalRoundResults] = useState<RoundResult[]>([]);
  const hasProcessedRound = useRef(false);

  const currentRound = map.round + 1;
  const currentPhase = phase.phase || '';

  type EnqueueOverlay = typeof enqueueOverlay;

  const showOverlays = useCallback((
    roundResults: RoundResult[],
    currentRoundNum: number,
    phase: string,
    mapData: I.Map,
    playersData: I.Player[],
    kills: I.KillEvent[],
    match: Match | null,
    enqueue: EnqueueOverlay
  ) => {
    // RoundMVP - если есть данные о предыдущем раунде
    if (roundResults.length > 0) {
      const prevRoundResult = roundResults[currentRoundNum - 2];
      if (prevRoundResult) {
        const mvpData = calculateMVP({
          winner: { side: prevRoundResult.winner },
          players: playersData
        });

        if (mvpData) {
          enqueue({
            type: 'mvp',
            component: <RoundMVP mvpData={mvpData} />,
            duration: 5000
          });
        }
      }
    }

    // RoundSummary - всегда показываем
    enqueue({
      type: 'roundSummary',
      component: (
        <RoundSummary 
          rounds={roundResults}
          currentRound={currentRoundNum}
        />
      ),
      duration: 5000
    });

    // StatsTable - только каждый 5-й раунд
    if (currentRoundNum % 5 === 0) {
      const left = mapData.team_ct.orientation === "left" ? mapData.team_ct : mapData.team_t;
      const right = mapData.team_ct.orientation === "left" ? mapData.team_t : mapData.team_ct;

      enqueue({
        type: 'statsTable',
        component: (
          <StatsTable 
            leftTeam={left}
            rightTeam={right}
            players={playersData}
            killEvents={kills}
            matchData={match}
          />
        ),
        duration: 5000
      });
    }
  }, []);

  const getRoundResults = useCallback((
    matchDataValue: Match | null,
    mapData: I.Map,
    currentRoundNum: number,
    localResults: RoundResult[]
  ): { results: RoundResult[]; shouldUpdateLocal: boolean } => {
    const baseMapName = extractMapName(mapData.name);
    const vetos = (matchDataValue?.vetos || []) as unknown as VetoData[];
    
    const currentVeto = findMatchingVeto(vetos, baseMapName, mapData.name);
    const fallbackVeto = !currentVeto || !currentVeto.rounds ? getFallbackVeto(vetos, mapData.name) : null;
    const apiRoundsData = currentVeto?.rounds || fallbackVeto?.rounds || [];
    
    const apiRoundResults: RoundResult[] = apiRoundsData
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .map((r, index: number) => ({
        round: index + 1,
        winner: r.winner || 'CT',
        winType: r.win_type || 'elimination'
      }));
    
    const finalResults = apiRoundResults.length > 0 ? apiRoundResults : localResults;
    
    // Reconstruct if needed
    if (apiRoundResults.length === 0 && currentRoundNum > 1) {
      const ctScore = mapData.team_ct.score;
      const tScore = mapData.team_t.score;
      const totalScore = ctScore + tScore;
      
      if (totalScore > 0 && localResults.length < totalScore) {
        const reconstructed = reconstructRoundResults(ctScore, tScore, currentRoundNum);
        return { results: reconstructed, shouldUpdateLocal: true };
      }
    }
    
    return { results: finalResults, shouldUpdateLocal: false };
  }, []);
  // Load match data and setup listeners
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
    const interval = setInterval(loadMatchData, 5000);

    const handleKill = (kill: I.KillEvent) => {
      setKillEvents((prev: I.KillEvent[]) => [...prev, kill]);
    };

    const handleData = (data: I.CSGO) => {
      if (data.round && data.round.phase === "freezetime") {
        if (Number(data.phase_countdowns?.phase_ends_in) < 10) {
          setKillEvents([]);
        }
      }
    };

    GSI.on('kill', handleKill);
    GSI.on('data', handleData);

    return () => {
      clearInterval(interval);
      GSI.off('kill', handleKill);
      GSI.off('data', handleData);
    };
  }, []);

  // Handle round transitions and overlay display
  useEffect(() => {
    if (currentRound !== prevRound) {
      setPrevRound(currentRound);
      hasProcessedRound.current = false;
    }

    if (currentPhase === 'freezetime' && !hasProcessedRound.current && currentRound > 1) {
      hasProcessedRound.current = true;

      const { results: roundResults, shouldUpdateLocal } = getRoundResults(matchData, map, currentRound, localRoundResults);
      
      if (shouldUpdateLocal) {
        setLocalRoundResults(roundResults);
      }

      setTimeout(() => {
        showOverlays(roundResults, currentRound, currentPhase, map, players, killEvents, matchData, enqueueOverlay);
      }, 500);
    }
  }, [currentPhase, currentRound, prevRound, map, players, matchData, killEvents, enqueueOverlay, localRoundResults, getRoundResults, showOverlays]);

  return null;
};

export default OverlayManager;
