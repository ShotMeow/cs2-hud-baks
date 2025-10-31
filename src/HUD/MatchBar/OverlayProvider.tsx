import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import './overlay-provider.scss';
import { GSI } from '../../API/HUD';
import * as I from 'csgogsi';

// Типы плашек
export type OverlayType = 'mvp' | 'roundSummary' | 'statsTable' | 'other';

interface OverlayItem {
  id: string;
  type: OverlayType;
  component: ReactNode;
  duration: number; // Длительность показа в мс
}

interface OverlayContextType {
  currentOverlay: OverlayItem | null;
  enqueueOverlay: (overlay: Omit<OverlayItem, 'id'>) => void;
  clearQueue: () => void;
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error('useOverlay must be used within OverlayProvider');
  }
  return context;
};

interface Props {
  children: ReactNode;
}

export const OverlayProvider: React.FC<Props> = ({ children }) => {
  const [currentOverlay, setCurrentOverlay] = useState<OverlayItem | null>(null);
  const [queue, setQueue] = useState<OverlayItem[]>([]);
  const isProcessing = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Добавление оверлея в очередь
  const enqueueOverlay = useCallback((overlay: Omit<OverlayItem, 'id'>) => {
    const id = `${overlay.type}_${Date.now()}_${Math.random()}`;
    const newOverlay = { ...overlay, id };
    
    setQueue(prev => [...prev, newOverlay]);
  }, []);

  // Очистка очереди
  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentOverlay(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isProcessing.current = false;
  }, []);

  // Обработка очереди
  useEffect(() => {
    if (isProcessing.current || queue.length === 0) {
      return;
    }

    isProcessing.current = true;
    const nextOverlay = queue[0];
    
    // Показываем текущий оверлей
    setCurrentOverlay(nextOverlay);
    
    // Удаляем из очереди
    setQueue(prev => prev.slice(1));
    
    // Скрываем через duration
    timeoutRef.current = setTimeout(() => {
      setCurrentOverlay(null);
      isProcessing.current = false;
      timeoutRef.current = null;
    }, nextOverlay.duration);
  }, [queue, currentOverlay]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const value = {
    currentOverlay,
    enqueueOverlay,
    clearQueue
  };

  return (
    <OverlayContext.Provider value={value}>
      {children}
      
      {/* Рендерим текущий оверлей */}
      {currentOverlay && (
        <div className="overlay-container">
          <div key={currentOverlay.id} className="overlay-item">
            {currentOverlay.component}
          </div>
        </div>
      )}
    </OverlayContext.Provider>
  );
};

// Хук для добавления оверлеев в очередь
export const useOverlayQueue = () => {
  const { enqueueOverlay, clearQueue } = useOverlay();

  return {
    enqueueOverlay,
    clearQueue
  };
};
