import React from 'react';
import Weapon from './../Weapon/Weapon';
import flash_assist from './../../assets/flash_assist.png';
import { C4, Defuse, FlashedKill, Headshot, NoScope, SmokeKill, Suicide, Wallbang } from "./../../assets/Icons"
import { ExtendedKillEvent, BombEvent } from "./Killfeed"


const Kill = ({event, className}: { event: ExtendedKillEvent | BombEvent; className?: string }) => {
    // Generate special classes for different kill types
    const getKillClasses = () => {
        const classes = [className || ''];
        
        if (event.type === "kill") {
            // Add team-specific class based on killer team
            if (event.killer) {
                classes.push(`${event.killer.team.side.toLowerCase()}-kill`);
            }
            
            if (event.headshot) classes.push('headshot');
            if (event.wallbang) classes.push('wallbang');
        }
        
        return classes.filter(Boolean).join(' ');
    };

    if (event.type !== "kill") {
        return (
            <div className={`single_kill ${getKillClasses()}`}>
                <div className={`killer_name ${event.player.team.side}`}>{event.player.name}</div>
                <div className="way">
                    {event.type === "plant" ? <C4 height="18px" /> : <Defuse height="18px" />}
                </div>
                <div className={`victim_name`}>{event.type === "plant" ? "planted the bomb" : "defused the bomb"}</div>
            </div>
        )
    }
    
    let weapon = <Weapon weapon={event.weapon} active={false} />;
    if(event.killer === event.victim) {
        weapon = <Suicide />;
    } else if(event.weapon === 'planted_c4'){
        weapon = <Weapon weapon={'c4'} active={false} />
    }
    
    return (
        <div className='single_kill_container'>
            <div className={`single_kill ${getKillClasses()}`}>
                {event.attackerblind ? <FlashedKill /> : null}
                {event.killer ? <div className={`killer ${event.killer.team.side}`}>{event.killer.name}</div> : null}
                {event.assister ?
                    <React.Fragment>
                        <div className="plus">+</div>
                        {event.flashed ? <img src={flash_assist} className="flash_assist" alt={'[FLASH]'} /> : null}
                        <div className={`assister ${event.assister.team.side}`}>{event.assister.name}</div>
                    </React.Fragment>
                    : ''}
                <div className="way">
                    {weapon}
                    {event.thrusmoke ? <SmokeKill /> : null}
                    {event.noscope ? <NoScope /> : null}
                    {event.wallbang ? <Wallbang /> : null}
                    {event.headshot ? <Headshot /> : null}
                </div>
                <div className={`victim ${event.victim.team.side}`}>{event.victim.name}</div>
            </div>
        </div>
    );
}
export default Kill;