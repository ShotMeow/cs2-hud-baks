import Weapon from "./../Weapon/Weapon";
import { Player, Side, WeaponRaw } from "csgogsi";
import './sideboxes.scss'

// Функция для форматирования валюты с разделителем тысяч
function formatCurrency(amount: number): string {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

interface Props {
  sides?: "reversed";
  show: boolean;
  side: "CT" | "T";
  players: Player[];
  loss: number;
  equipment: number;
  money: number;
  orientation?: "left" | "right";
}

function getUtilityStatus(amount: number) {
  // 🟢 FULL: ≥ 15 гранат на команду
  if (amount >= 15) {
    return { status: 'FULL', color: '#22f222' };
  }
  
  // 🟠 LIMITED: 6 – 14 гранат
  if (amount >= 6) {
    return { status: 'LIMITED', color: '#FAC000' };
  }
  
  // 🔴 NONE: ≤ 5 гранат
  return { status: 'NONE', color: '#f21822' };
}

function utilityColor(side: "CT" | "T") {
  const colors = {
    ct: '#8258FF',
    t: '#FF5500'
  };
  const sideKey = side.toLowerCase() as 'ct' | 't';
  return colors[sideKey];
}

function sum(grenades: WeaponRaw[], name: string) {
  return (
    grenades.filter((grenade) => grenade.name === name).reduce(
      (prev, next) => ({
        ...next,
        ammo_reserve: (prev.ammo_reserve || 0) + (next.ammo_reserve || 0),
      }),
      { name: "", ammo_reserve: 0 },
    )
      .ammo_reserve || 0
  );
}

function parseGrenades(players: Player[], side: Side) {
  const grenades = players
    .filter((player) => player.team.side === side)
    .map((player) =>
      Object.values(player.weapons).filter((weapon) =>
        weapon.type === "Grenade"
      )
    )
    .flat()
    .map((grenade) => ({
      ...grenade,
      name: grenade.name.replace("weapon_", ""),
    }));
  return grenades;
}

export function summarise(players: Player[], side: Side) {
  const grenades = parseGrenades(players, side);
  return {
    hg: sum(grenades, "hegrenade"),
    flashes: sum(grenades, "flashbang"),
    smokes: sum(grenades, "smokegrenade"),
    inc: sum(grenades, "incgrenade") + sum(grenades, "molotov"),
  };
}

const LossIndicator = ({ active, side }: { active: boolean; side: "CT" | "T" }) => {
  const colors = {
    ct: '#8258FF',
    t: '#FF5500'
  };
  const sideKey = side.toLowerCase() as 'ct' | 't';
  
  return (
    <div 
      className="loss-indicator"
      style={{ 
        backgroundColor: active ? colors[sideKey] : 'rgba(255, 255, 255, 0.1)'
      }}
    />
  );
};

const GrenadeContainer = (
  { grenade, amount }: { grenade: string; amount: number },
) => {
  return (
    <div className="grenade_container">
      <div className="grenade_image">
        <Weapon weapon={grenade} active={false} isGrenade />
      </div>
      <div className="grenade_amount">{amount}</div>
    </div>
  );
};

// Определяем статус экономики команды
function getEconomyStatus(equipment: number, money: number, playerCount: number = 5) {
  const avgMoney = money / playerCount;
  
  // 🟢 STABLE: Средний баланс ≥ $4000 или Equipment Value > $22,000
  if (avgMoney >= 4000 || equipment > 22000) {
    return { status: 'STABLE', color: '#22f222', bgColor: 'rgba(34, 242, 34, 0.2)' };
  }
  
  // 🔴 BROKE: Equipment Value < $14,000 и нет запасов денег
  if (equipment < 14000) {
    return { status: 'BROKE', color: '#f21822', bgColor: 'rgba(242, 24, 34, 0.2)' };
  }
  
  // 🟠 RISK: Полный закуп, но средний баланс < $2000
  if (avgMoney < 2000) {
    return { status: 'RISK', color: '#FAC000', bgColor: 'rgba(250, 192, 0, 0.2)' };
  }
  
  // По умолчанию STABLE
  return { status: 'STABLE', color: '#22f222', bgColor: 'rgba(34, 242, 34, 0.2)' };
}

const SideBox = ({ players, side, show, loss, equipment, money, orientation = "left" }: Props) => {
  const grenades = summarise(players, side);
  const total = Object.values(grenades).reduce((a, b) => a + b, 0);
  
  // Определяем статус экономики
  const economyStatus = getEconomyStatus(equipment, money);
  
  // Определяем статус utility
  const utilityStatus = getUtilityStatus(total);
  
  // Цвет команды
  const teamColor = utilityColor(side);
  
  const isRight = orientation === "right";
  
  // Loss Bonus блок
  const lossBonusBlock = (
    <div className="loss-bonus-section">
      <div className="section-header">
        <div className="section-title">LOSS BONUS</div>
        <div className="loss-indicators">
          <LossIndicator side={side} active={(loss - 1400) / 500 >= 1} />
          <LossIndicator side={side} active={(loss - 1400) / 500 >= 2} />
          <LossIndicator side={side} active={(loss - 1400) / 500 >= 3} />
          <LossIndicator side={side} active={(loss - 1400) / 500 >= 4} />
        </div>
      </div>
      <div className="section-value" style={{ color: teamColor }}>{formatCurrency(loss)}$</div>
    </div>
  );
  
  // Equipment Value блок
  const equipmentBlock = (
    <div className="equipment-section">
      <div className="section-title">EQUIPMENT VALUE</div>
      <div className="equipment-value-row">
        <div className="section-value" style={{ color: teamColor }}>{formatCurrency(equipment)}$</div>
        <div 
          className="economy-badge"
          style={{ 
            backgroundColor: economyStatus.bgColor,
            color: economyStatus.color
          }}
        >
          {economyStatus.status}
        </div>
      </div>
    </div>
  );
  
  return (
    <div className={`sidebox-container ${side || ""} ${orientation} ${show ? "show" : "hide"}`}>
      {/* Верхний блок: Loss Bonus + Equipment Value */}
      <div className="top-block">
        {isRight ? (
          <>
            {equipmentBlock}
            {lossBonusBlock}
          </>
        ) : (
          <>
            {lossBonusBlock}
            {equipmentBlock}
          </>
        )}
      </div>
      
      {/* Нижний блок: Utility + Гранаты */}
      <div className="bottom-block">
        {isRight ? (
          <>
            <GrenadeContainer grenade="hegrenade" amount={grenades.hg} />
            <GrenadeContainer grenade="flashbang" amount={grenades.flashes} />
            <GrenadeContainer
              grenade={side === "CT" ? "incgrenade" : "molotov"}
              amount={grenades.inc}
            />
            <GrenadeContainer grenade="smokegrenade" amount={grenades.smokes} />
            <div className="utility-status">
              <div className="utility-title">UTILITY</div>
              <div className="utility-state" style={{ color: utilityStatus.color }}>
                {utilityStatus.status}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="utility-status">
              <div className="utility-title">UTILITY</div>
              <div className="utility-state" style={{ color: utilityStatus.color }}>
                {utilityStatus.status}
              </div>
            </div>
            <GrenadeContainer grenade="smokegrenade" amount={grenades.smokes} />
            <GrenadeContainer
              grenade={side === "CT" ? "incgrenade" : "molotov"}
              amount={grenades.inc}
            />
            <GrenadeContainer grenade="flashbang" amount={grenades.flashes} />
            <GrenadeContainer grenade="hegrenade" amount={grenades.hg} />
          </>
        )}
      </div>
    </div>
  );
};
export default SideBox;
