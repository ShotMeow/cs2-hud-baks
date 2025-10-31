import React, { useState } from "react";
import { Player } from "csgogsi";
import Weapon from "./../Weapon/Weapon";
import Avatar from "./Avatar";
import TeamLogo from "./../MatchBar/TeamLogo";
import "./observed.scss";
import { getCountry } from "./../countries";
import { ArmorHelmet, ArmorFull, HealthFull, Bullets } from './../../assets/Icons';
import { apiUrl } from './../../API';
import { useAction } from "../../API/contexts/actions";


const Statistic = React.memo(({ label, value, color }: { label: string; value: string | number; color?: string }) => {
	return (
		<div className="stat">
			<span className="label">{label}</span>
			<span className="value" style={{ color }}>{value}</span>
		</div>
	);
});

const Observed = ({ player }: { player: Player | null }) => {
	const [ showCam, setShowCam ] = useState(true);

	useAction('toggleCams', () => {
		setShowCam(p => !p);
	});

	if (!player) return null;
	
	const currentWeapon = player.weapons.filter(weapon => weapon.state === "active")[0];
	const grenades = player.weapons.filter(weapon => weapon.type === "Grenade");
	const { stats } = player;
	const healthPercent = player.state.health;
	
	return (
		<div className={`observed ${player.team.side}`}>
			{/* Аватарка игрока */}
			<Avatar 
				teamId={player.team.id} 
				url={player.avatar} 
				steamid={player.steamid} 
				height={140} 
				width={140} 
				showCam={showCam} 
				slot={player.observer_slot} 
			/>
			
			{/* Индикатор здоровья */}
			<div className="health-bar">
				<div className="health-fill" style={{ width: `${healthPercent}%` }}></div>
				<div className="health-info">
					<HealthFull />
					<span className="health-value">{player.state.health}</span>
				</div>
				<div className="armor-info">
					<span className="armor-value">{player.state.armor}</span>
					{player.state.helmet ? <ArmorHelmet /> : <ArmorFull />}
				</div>
			</div>
			
			{/* Никнейм и патроны */}
			<div className="info-row">
				<div className="username">{player.name}</div>
				<div className="weapon-ammo">
					{currentWeapon && <Weapon weapon={currentWeapon.name} active={true} />}
					<div className="ammo-info">
						<span className="ammo-clip">{(currentWeapon && currentWeapon.ammo_clip) || "-"}</span>
						<span className="ammo-separator">/</span>
						<span className="ammo-reserve">{(currentWeapon && currentWeapon.ammo_reserve) || "-"}</span>
					</div>
				</div>
			</div>
			
			{/* Футер со статистикой и гранатами */}
			<div className="footer-row">
				<div className="stats-badges">
					<div className="badge">
						<span className="stat-label">K</span>
						<span className="stat-value">{stats.kills}</span>
						{player.state.round_kills !== 0 && <span className="stat-assists">{player.state.round_kills}</span>}
					</div>
					<div className="badge">
						<span className="stat-label">D</span>
						<span className="stat-value">{stats.deaths}</span>
					</div>
					<div className="badge">
						<span className="stat-label">A</span>
						<span className="stat-value">{stats.assists}</span>
					</div>
				</div>
				<div className="grenades-badges">
					{grenades.map(grenade => (
						<React.Fragment key={`${player.steamid}_${grenade.name}_${grenade.ammo_reserve || 1}`}>
							<div className="badge grenade-badge">
								<Weapon weapon={grenade.name} active={grenade.state === "active"} isGrenade />
							</div>
							{grenade.ammo_reserve === 2 && (
								<div className="badge grenade-badge">
									<Weapon weapon={grenade.name} active={grenade.state === "active"} isGrenade />
								</div>
							)}
						</React.Fragment>
					))}
				</div>
			</div>
		</div>
	);
}

export default Observed;