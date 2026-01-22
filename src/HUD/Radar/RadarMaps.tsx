import { useState, useEffect } from "react";
import "./radar.scss";
import { Match, Veto, Tournament } from "../../API/types";
import { Map, CSGO, Team } from 'csgogsi';
import Radar from './Radar'
import api from '../../API';

import { useAction } from "../../API/contexts/actions";

interface Props { match: Match | null, map: Map, game: CSGO }

const RadarMaps = ({ match, map, game }: Props) => {
    const [ radarSize, setRadarSize ] = useState(366);
    const [ tournament, setTournament ] = useState<Tournament | null>(null);

    useEffect(() => {
        api.tournaments.get().then(({ tournament }) => {
            if(tournament){
                setTournament(tournament);
            }
        })
    }, []);

    useAction('radarBigger', () => {
        setRadarSize(p => p+10);
    }, []);

    useAction('radarSmaller', () => {
        setRadarSize(p => p-10);
    }, []);

    return (
        <div id={`radar_maps_container`}>
            {match ? <MapsBar match={match} map={map} game={game} tournament={tournament} /> : null}
            <Radar radarSize={radarSize} game={game} />
        </div>
    );
}

export default RadarMaps;

const MapsBar = ({ match, map, tournament }: Props & { tournament: Tournament | null }) => {
    if (!match) return null;

    const tournamentName = tournament?.name;
    const bestOfText = `BEST OF ${match.matchType.slice(-1)}`;
    const bestofLabel = tournamentName ? `${tournamentName} | ${bestOfText}` : bestOfText;

    if (!match.vetos.length) {
        return <div id="maps_container">
            <div className="bestof">{bestofLabel}</div>
        </div>;
    }

    const picks = match.vetos.filter(veto => veto.type !== "ban" && veto.mapName);
    
    if (picks.length > 3) {
        const current = picks.find(veto => map.name.includes(veto.mapName));
        if (!current) return <div id="maps_container">
            <div className="bestof">{bestofLabel}</div>
        </div>;
        return <div id="maps_container">
            <div className="bestof">{bestofLabel}</div>
            {<MapEntry veto={current} map={map} team={current.type === "decider" ? null : map.team_ct.id === current.teamId ? map.team_ct : map.team_t} />}
        </div>
    }
    
    return <div id="maps_container">
        <div className="bestof">{bestofLabel}</div>
        {match.vetos.filter(veto => veto.type !== "ban").filter(veto => veto.teamId || veto.type === "decider").map(veto => <MapEntry key={veto.mapName} veto={veto} map={map} team={veto.type === "decider" ? null : map.team_ct.id === veto.teamId ? map.team_ct : map.team_t} />)}
    </div>
}

const MapEntry = ({ veto, map }: { veto: Veto, map: Map, team: Team | null }) => {
    return <div className="veto_entry">
        <div className={`map_name ${map.name.includes(veto.mapName) ? 'active' : ''}`}>{veto.mapName.replace("de_", "")}</div>
    </div>
}