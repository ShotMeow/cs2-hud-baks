import React, { useState, useEffect, useRef } from 'react';

import { KillEvent, Player } from 'csgogsi';
import Kill from './Kill';
import './killfeed.scss';
import { onGSI } from '../../API/contexts/actions';


export interface ExtendedKillEvent extends KillEvent {
    type: 'kill'
}

export interface BombEvent {
    player: Player,
    type: 'plant' | 'defuse'
}

export interface AnimatedEvent {
    id: string;
    isFadingOut?: boolean;
    event: BombEvent | ExtendedKillEvent;
}

const KillfeedComponent = () => {
    const [ events, setEvents ] = useState<AnimatedEvent[]>([]);
    const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // Добавление нового события с анимацией
    const addEvent = (event: BombEvent | ExtendedKillEvent) => {
        const id = `${Date.now()}-${Math.random()}`;
        const animatedEvent: AnimatedEvent = { event, id };
        
        setEvents(prev => [...prev, animatedEvent]);
        
        // Автоматически скрывать событие через 5 секунд
        const timeout = setTimeout(() => {
            fadeOutEvent(id);
        }, 5000);
        
        timeoutRefs.current.set(id, timeout);
    };

    // Плавное скрытие события
    const fadeOutEvent = (id: string) => {
        setEvents(prev => prev.map(event => 
            event.id === id ? { ...event, isFadingOut: true } : event
        ));
        
        // Полностью удалить событие после анимации
        const removeTimeout = setTimeout(() => {
            removeEvent(id);
        }, 800);
        
        timeoutRefs.current.set(`${id}-fadeout`, removeTimeout);
    };

    // Удаление события
    const removeEvent = (id: string) => {
        setEvents(prev => prev.filter(event => event.id !== id));
        
        // Очистка таймеров
        const timeout = timeoutRefs.current.get(id);
        if (timeout) {
            clearTimeout(timeout);
            timeoutRefs.current.delete(id);
        }
        
        const fadeTimeout = timeoutRefs.current.get(`${id}-fadeout`);
        if (fadeTimeout) {
            clearTimeout(fadeTimeout);
            timeoutRefs.current.delete(`${id}-fadeout`);
        }
    };

    // Очистка всех событий
    const clearAllEvents = () => {
        timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
        timeoutRefs.current.clear();
        setEvents([]);
    };

    onGSI("kill", kill => {
        addEvent({...kill, type: 'kill'});
    }, []);

    onGSI("data", data => {
        if(data.round && data.round.phase === "freezetime"){
            if(Number(data.phase_countdowns.phase_ends_in) < 10 && events.length > 0){
                clearAllEvents();
            }
        }
    }, []);

    // Очистка таймеров при unmount
    useEffect(() => {
        const timeouts = timeoutRefs.current;
        return () => {
            timeouts.forEach(timeout => clearTimeout(timeout));
        };
    }, []);

    return (
        <div className="killfeed">
            {events.map(event => (
                <Kill 
                    key={event.id} 
                    event={event.event} 
                    className={event.isFadingOut ? 'fade-out' : ''}
                />
            ))}
        </div>
    );
}

export default React.memo(KillfeedComponent);
