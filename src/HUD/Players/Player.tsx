import * as I from "csgogsi";
import Weapon from "./../Weapon/Weapon";
import Avatar from "./Avatar";
import React from "react";
import { HealthFull, C4, Defuse as DefuseIcon, ArmorHelmet, ArmorFull } from "../../assets/Icons";

interface IProps {
  player: I.Player,
  isObserved: boolean,
}

const compareWeapon = (weaponOne: I.WeaponRaw, weaponTwo: I.WeaponRaw) => {
  if (weaponOne.name === weaponTwo.name &&
    weaponOne.paintkit === weaponTwo.paintkit &&
    weaponOne.type === weaponTwo.type &&
    weaponOne.ammo_clip === weaponTwo.ammo_clip &&
    weaponOne.ammo_clip_max === weaponTwo.ammo_clip_max &&
    weaponOne.ammo_reserve === weaponTwo.ammo_reserve &&
    weaponOne.state === weaponTwo.state
  ) return true;

  return false;
}

const compareWeapons = (weaponsObjectOne: I.Weapon[], weaponsObjectTwo: I.Weapon[]) => {
  const weaponsOne = [...weaponsObjectOne].sort((a, b) => a.name.localeCompare(b.name))
  const weaponsTwo = [...weaponsObjectTwo].sort((a, b) => a.name.localeCompare(b.name))

  if (weaponsOne.length !== weaponsTwo.length) return false;

  return weaponsOne.every((weapon, i) => compareWeapon(weapon, weaponsTwo[i]));
}

const arePlayersEqual = (playerOne: I.Player, playerTwo: I.Player) => {
  if (playerOne.name === playerTwo.name &&
    playerOne.steamid === playerTwo.steamid &&
    playerOne.observer_slot === playerTwo.observer_slot &&
    playerOne.defaultName === playerTwo.defaultName &&
    playerOne.clan === playerTwo.clan &&
    playerOne.stats.kills === playerTwo.stats.kills &&
    playerOne.stats.assists === playerTwo.stats.assists &&
    playerOne.stats.deaths === playerTwo.stats.deaths &&
    playerOne.stats.mvps === playerTwo.stats.mvps &&
    playerOne.stats.score === playerTwo.stats.score &&
    playerOne.state.health === playerTwo.state.health &&
    playerOne.state.armor === playerTwo.state.armor &&
    playerOne.state.helmet === playerTwo.state.helmet &&
    playerOne.state.defusekit === playerTwo.state.defusekit &&
    playerOne.state.flashed === playerTwo.state.flashed &&
    playerOne.state.smoked === playerTwo.state.smoked &&
    playerOne.state.burning === playerTwo.state.burning &&
    playerOne.state.money === playerTwo.state.money &&
    playerOne.state.round_killhs === playerTwo.state.round_killhs &&
    playerOne.state.round_kills === playerTwo.state.round_kills &&
    playerOne.state.round_totaldmg === playerTwo.state.round_totaldmg &&
    playerOne.state.equip_value === playerTwo.state.equip_value &&
    playerOne.state.adr === playerTwo.state.adr &&
    playerOne.avatar === playerTwo.avatar &&
    !!playerOne.team.id === !!playerTwo.team.id &&
    playerOne.team.side === playerTwo.team.side &&
    playerOne.country === playerTwo.country &&
    playerOne.realName === playerTwo.realName &&
    compareWeapons(playerOne.weapons, playerTwo.weapons)
  ) return true;

  return false;
}
const Player = ({ player, isObserved }: IProps) => {

  const weapons = player.weapons.map(weapon => ({ ...weapon, name: weapon.name.replace("weapon_", "") }));
  const primary = weapons.filter(weapon => !['C4', 'Pistol', 'Knife', 'Grenade', undefined].includes(weapon.type))[0] || null;
  const secondary = weapons.filter(weapon => weapon.type === "Pistol")[0] || null;
  const grenades = weapons.filter(weapon => weapon.type === "Grenade");

  const hasBomb = weapons.some(weapon => weapon.type === "C4");
  const hasDefuse = player.state.defusekit;

  // Создаём массив предметов для отображения в футере (гранаты + бомба/дефуз)
  const footerItems: Array<{ type: 'grenade' | 'bomb' | 'defuse' | 'empty', data?: any, isActive?: boolean }> = [];
  
  // Добавляем гранаты
  grenades.forEach(grenade => {
    footerItems.push({ type: 'grenade', data: grenade, isActive: grenade.state === 'active' });
  });
  
  // Добавляем бомбу или дефуз
  if (hasBomb) {
    const bombWeapon = weapons.find(w => w.type === 'C4');
    footerItems.push({ type: 'bomb', isActive: bombWeapon?.state === 'active' });
  } else if (hasDefuse) {
    footerItems.push({ type: 'defuse', isActive: false });
  }

  // Функция для размещения предметов в виде пирамиды (центр, лево, право, лево, право)
  const arrangeItemsInPyramid = (items: typeof footerItems): (typeof footerItems[0] | null)[] => {
    const slots: (typeof footerItems[0] | null)[] = [null, null, null, null, null];
    const positions = [2, 1, 3, 0, 4]; // Центр, лево, право, крайний лево, крайний право
    
    items.forEach((item, index) => {
      if (index < 5) {
        slots[positions[index]] = item;
      }
    });
    
    return slots;
  };

  const arrangedSlots = arrangeItemsInPyramid(footerItems);

  // Цвета команд с прозрачностью для фона HP бара
  const teamColors = {
    t: { background: 'rgba(255, 85, 0, 0.3)', fill: '#FF5500' },
    ct: { background: 'rgba(130, 88, 255, 0.3)', fill: '#8258FF' }
  };
  const sideKey = player.team.side.toLowerCase() as 't' | 'ct';
  const colors = teamColors[sideKey] || teamColors.t;

  const currentWeapon = primary || secondary;
  const ammoPercentage = currentWeapon && currentWeapon.ammo_clip_max && currentWeapon.ammo_clip_max > 0 
    ? ((currentWeapon.ammo_clip || 0) / currentWeapon.ammo_clip_max) * 100 
    : 0;

  return (
    <div className={`player ${player.state.health === 0 ? "dead" : ""}`}>
      {/* Аватарка с HP баром и никнеймом */}
      <div className={`avatar-container ${isObserved ? 'active' : ''}`}>
        <Avatar 
          teamId={player.team.id} 
          steamid={player.steamid} 
          url={player.avatar} 
          height={120} 
          width={132} 
          showSkull={player.state.health === 0} 
          showCam={false} 
          sidePlayer={true} 
        />
        <div className="hp-bar-container">
          <div 
            className="hp-bar-background" 
            style={{ backgroundColor: colors.background }}
          >
            <div 
              className="hp-bar-fill" 
              style={{ 
                width: `${player.state.health}%`,
                backgroundColor: colors.fill
              }}
            />
          </div>
          <div className="player-index">{player.observer_slot}</div>
          <div className="nickname">{player.name}</div>
        </div>
      </div>

      {/* Оружие и HP */}
      <div className={`weapon-ammo-row ${player.state.health === 0 ? 'hidden' : ''}`}>
        <div className="weapon-container">
          <div 
            className="weapon-wrapper"
            style={{
              WebkitMaskImage: currentWeapon ? `linear-gradient(to right, black ${ammoPercentage}%, rgba(0, 0, 0, 0.4) ${ammoPercentage}%)` : undefined,
              maskImage: currentWeapon ? `linear-gradient(to right, black ${ammoPercentage}%, rgba(0, 0, 0, 0.4) ${ammoPercentage}%)` : undefined
            }}
          >
            {currentWeapon && (
              <Weapon 
                weapon={currentWeapon.name} 
                active={currentWeapon.state === "active"} 
              />
            )}
          </div>
        </div>
        <div className="hp-display">
          {player.state.armor > 0 && (
            <div className="armor-icon">
              {player.state.helmet ? <ArmorHelmet /> : <ArmorFull />}
            </div>
          )}
          <HealthFull />
          <span className="hp-value">{player.state.health}</span>
        </div>
      </div>

      {/* Статистика K/D и деньги */}
      <div className="stats-row">
        <div className="kd-stat">
            <span className="stat-label">K</span>
            <span className="stat-value">{player.stats.kills}</span>
            {player.state.round_kills !== 0 && <span className="stat-assists">{player.state.round_kills}</span>}
          </div>
          <div className="kd-stat">
            <span className="stat-label">D</span>
            <span className="stat-value">{player.stats.deaths}</span>
          </div>
        <div className="money">{player.state.money}</div>
      </div>

      {/* Футер с предметами (гранаты + бомба/дефуз) в 5 слотов */}
      <div className={`footer-items ${player.state.health === 0 ? 'hidden' : ''}`}>
        {arrangedSlots.map((slot, index) => (
          <div key={index} className={`item-slot ${slot?.isActive ? 'active' : ''} ${sideKey}`}>
            {slot === null ? (
              <div className="empty-dot" />
            ) : slot.type === 'grenade' ? (
              <Weapon 
                weapon={slot.data.name} 
                active={slot.data.state === "active"} 
                isGrenade 
              />
            ) : slot.type === 'bomb' ? (
              <C4 />
            ) : slot.type === 'defuse' ? (
              <DefuseIcon />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

const arePropsEqual = (prevProps: Readonly<IProps>, nextProps: Readonly<IProps>) => {
  if (prevProps.isObserved !== nextProps.isObserved) return false;

  return arePlayersEqual(prevProps.player, nextProps.player);
}

export default React.memo(Player, arePropsEqual);
//export default Player;
