import { useEffect, useState } from 'react';

export const useGlobalAudioSpeed = () => {
  const getStoredSpeed = () => parseFloat(localStorage.getItem('audioSpeed') || '1');

  const [speed, setSpeedState] = useState<number>(getStoredSpeed);

  const setSpeed = (newSpeed: number) => {
    localStorage.setItem('audioSpeed', newSpeed.toString());
    setSpeedState(newSpeed);
    window.dispatchEvent(new CustomEvent('audioSpeedChange', { detail: newSpeed }));
  };

  useEffect(() => {
    const listener = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === 'number') setSpeedState(detail);
    };
    window.addEventListener('audioSpeedChange', listener);
    return () => window.removeEventListener('audioSpeedChange', listener);
  }, []);

  return { speed, setSpeed };
};
