import * as I from 'csgogsi';
import { useOverlayQueue } from './OverlayProvider';
import RoundMVP, { MVPData } from './RoundMVP';
import RoundSummary from './RoundSummary';
import StatsTable from './StatsTable';
import './overlayTest.scss';

const createTestPlayer = (
  name: string,
  steamid: string,
  side: 'CT' | 'T',
  health: number,
  kills: number,
  assists: number,
  damage: number
): I.Player => ({
  steamid,
  name,
  observer_slot: 1,
  team: {
    side,
    name: side === 'CT' ? 'Counter-Terrorists' : 'Terrorists',
    id: side === 'CT' ? 'ct_team' : 't_team',
    orientation: side === 'CT' ? 'left' : 'right'
  } as I.Team,
  state: {
    health,
    armor: 100,
    helmet: true,
    flashed: 0,
    smoked: 0,
    burning: 0,
    money: 4000,
    round_kills: kills,
    round_killhs: Math.floor(kills * 0.5),
    round_totaldmg: damage,
    equip_value: 5000,
    adr: 80,
    defusekit: side === 'CT'
  } as any,
  stats: {
    kills: kills,
    assists: assists,
    deaths: Math.floor(kills * 0.3),
    mvps: Math.floor(kills * 0.2),
    score: kills * 10
  },
  match_stats: {
    kills: kills,
    assists: assists,
    deaths: Math.floor(kills * 0.3)
  },
  weapons: [],
  position: [0, 0, 0],
  forward: [0, 0, 0],
  avatar: `https://i.pravatar.cc/150?u=${steamid}`,
  country: 'US',
  clan: '',
  defaultName: name,
  realName: name,
  extra: {}
} as I.Player);

const OverlayTest = () => {
  const { enqueueOverlay, clearQueue } = useOverlayQueue();
  const testClutchMVP = () => {
    const mvpData: MVPData = {
      player: createTestPlayer('ClutchKing', '76561198000000001', 'CT', 45, 3, 0, 320),
      type: 'CLUTCH',
      stats: [
        { label: 'CLUTCH', value: '1v3' },
        { label: 'KILLS', value: 3 },
        { label: 'IMPACT', value: '9.2' }
      ]
    };
    
    enqueueOverlay({
      type: 'mvp',
      component: <RoundMVP mvpData={mvpData} />,
      duration: 5000
    });
    console.log('🧨 Clutch MVP Test');
  };

  const testEntryMVP = () => {
    const mvpData: MVPData = {
      player: createTestPlayer('EntryFragger', '76561198000000011', 'T', 80, 3, 0, 280),
      type: 'ENTRY',
      stats: [
        { label: 'ENTRY KILL', value: '1:45' },
        { label: 'KILLS', value: 3 },
        { label: 'MULTIKILL', value: 3 }
      ]
    };
    
    enqueueOverlay({
      type: 'mvp',
      component: <RoundMVP mvpData={mvpData} />,
      duration: 5000
    });
    console.log('💥 Entry MVP Test');
  };

  const testUtilityMVP = () => {
    const mvpData: MVPData = {
      player: createTestPlayer('UtilityMaster', '76561198000000021', 'CT', 70, 1, 1, 450),
      type: 'UTILITY',
      stats: [
        { label: 'UTILITY DMG', value: 135 },
        { label: 'IMPACT', value: '2.4' },
        { label: 'ASSISTS', value: 1 }
      ]
    };
    
    enqueueOverlay({
      type: 'mvp',
      component: <RoundMVP mvpData={mvpData} />,
      duration: 5000
    });
    console.log('🔥 Utility MVP Test');
  };

  const testSupportMVP = () => {
    const mvpData: MVPData = {
      player: createTestPlayer('SupportGod', '76561198000000031', 'T', 85, 1, 3, 180),
      type: 'SUPPORT',
      stats: [
        { label: 'ASSISTS', value: 3 },
        { label: 'KILLS', value: 1 },
        { label: 'TRADE KILL', value: 0 }
      ]
    };
    
    enqueueOverlay({
      type: 'mvp',
      component: <RoundMVP mvpData={mvpData} />,
      duration: 5000
    });
    console.log('🧩 Support MVP Test');
  };

  const testRoundSummary = () => {
    const rounds = [
      { round: 1, winner: 'CT' as const, winType: 'defuse' as const },
      { round: 2, winner: 'T' as const, winType: 'bomb' as const },
      { round: 3, winner: 'CT' as const, winType: 'elimination' as const },
      { round: 4, winner: 'T' as const, winType: 'elimination' as const },
      { round: 5, winner: 'CT' as const, winType: 'time' as const },
      { round: 6, winner: 'T' as const, winType: 'bomb' as const },
      { round: 7, winner: 'CT' as const, winType: 'defuse' as const },
    ];
    
    enqueueOverlay({
      type: 'roundSummary',
      component: <RoundSummary rounds={rounds} currentRound={8} phase="freezetime" />,
      duration: 5000
    });
    console.log('📊 Round Summary Test');
  };

  const testStatsTable = () => {
    const ctTeam: I.Team = {
      side: 'CT',
      name: 'Counter-Terrorists',
      id: 'ct_team',
      orientation: 'left',
      logo: '',
      score: 7,
      consecutive_round_losses: 0,
      timeouts_remaining: 1,
      matches_won_this_series: 0,
      country: 'US',
      extra: {}
    };
    
    const tTeam: I.Team = {
      side: 'T',
      name: 'Terrorists',
      id: 't_team',
      orientation: 'right',
      logo: '',
      score: 5,
      consecutive_round_losses: 0,
      timeouts_remaining: 1,
      matches_won_this_series: 0,
      country: 'RU',
      extra: {}
    };
    
    const players = [
      createTestPlayer('Player1', '76561198000000041', 'CT', 100, 15, 3, 1200),
      createTestPlayer('Player2', '76561198000000042', 'CT', 80, 12, 5, 980),
      createTestPlayer('Player3', '76561198000000043', 'CT', 60, 10, 2, 850),
      createTestPlayer('Player4', '76561198000000044', 'CT', 90, 8, 4, 720),
      createTestPlayer('Player5', '76561198000000045', 'CT', 70, 6, 1, 650),
      createTestPlayer('Enemy1', '76561198000000051', 'T', 100, 14, 2, 1150),
      createTestPlayer('Enemy2', '76561198000000052', 'T', 85, 11, 4, 920),
      createTestPlayer('Enemy3', '76561198000000053', 'T', 75, 9, 3, 800),
      createTestPlayer('Enemy4', '76561198000000054', 'T', 95, 7, 5, 700),
      createTestPlayer('Enemy5', '76561198000000055', 'T', 65, 5, 2, 600),
    ];
    
    enqueueOverlay({
      type: 'statsTable',
      component: <StatsTable leftTeam={ctTeam} rightTeam={tTeam} players={players} />,
      duration: 5000
    });
    console.log('📈 Stats Table Test');
  };

  const testFullSequence = () => {
    console.log('🎯 Running full overlay sequence...');
    clearQueue();
    
    // Добавляем все оверлеи в очередь
    testClutchMVP();
    testRoundSummary();
    testStatsTable();
  };

  const testAllMVPTypes = () => {
    console.log('🎯 Testing all MVP types...');
    clearQueue();
    
    testClutchMVP();
    testEntryMVP();
    testUtilityMVP();
    testSupportMVP();
  };

  return (
    <div className="mvp-test-panel">
      <h2>Overlay Test Panel</h2>
      
      <div className="test-section">
        <h3>MVP Оверлеи (5 сек каждый):</h3>
        <div className="test-buttons">
          <button onClick={testClutchMVP}>🧨 Clutch MVP</button>
          <button onClick={testEntryMVP}>💥 Entry MVP</button>
          <button onClick={testUtilityMVP}>🔥 Utility MVP</button>
          <button onClick={testSupportMVP}>🧩 Support MVP</button>
          <button onClick={testAllMVPTypes}>🎯 Все MVP</button>
        </div>
      </div>

      <div className="test-section">
        <h3>Другие оверлеи:</h3>
        <div className="test-buttons">
          <button onClick={testRoundSummary}>📊 Round Summary</button>
          <button onClick={testStatsTable}>📈 Stats Table</button>
        </div>
      </div>

      <div className="test-section">
        <h3>Полная последовательность:</h3>
        <div className="test-buttons">
          <button onClick={testFullSequence}>🎬 MVP → Summary → Stats</button>
          <button onClick={clearQueue}>🗑️ Очистить очередь</button>
        </div>
      </div>

      <div className="test-info">
        <h4>ℹ️ Информация:</h4>
        <ul>
          <li>Оверлеи показываются последовательно в очереди</li>
          <li>Каждый оверлей показывается 5 секунд</li>
          <li>Можно добавить несколько оверлеев подряд</li>
          <li>Кнопка "Очистить очередь" удаляет все ожидающие оверлеи</li>
        </ul>
      </div>
    </div>
  );
};

export default OverlayTest;
