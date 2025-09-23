import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useState, useRef, useEffect } from 'react';
import { useGlobalAudioSpeed } from '../hooks/use-GlobalAudioSpeed';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';

interface AudioPlayerProps {
  src: string;
  useAuth?: boolean;
  className?: string;
}

export const AudioPlayer = ({ src, useAuth = false, className = '' }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { speed, setSpeed } = useGlobalAudioSpeed();

  // Применить скорость при каждом изменении speed или при загрузке аудио
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = speed;
    }
  }, [speed, blobUrl]); // Добавили blobUrl как зависимость

  useEffect(() => {
    if (!useAuth) return;

    const fetchAudio = async () => {
      try {
        const res = await fetch(src, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch audio');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (error) {
        console.error('Ошибка при загрузке аудио:', error);
      }
    };

    fetchAudio();

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [src, useAuth]);

  useEffect(() => {
    const handlePauseAll = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
        setCurrentTime(0);
        setIsPlaying(false);
      }
    };

    window.addEventListener('pauseAllAudio', handlePauseAll);
    return () => {
      window.removeEventListener('pauseAllAudio', handlePauseAll);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      // Применяем скорость после загрузки метаданных
      audio.playbackRate = speed;
    };
    const handleEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    // Синхронизируем состояние с реальным состоянием аудио при монтировании
    const syncState = () => {
      setIsPlaying(!audio.paused);
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnd);

    // Синхронизируем состояние при монтировании
    syncState();

    const handleSpeedChange = (e: Event) => {
      const newSpeed = (e as CustomEvent).detail;
      if (audioRef.current) {
        audioRef.current.playbackRate = newSpeed;
      }
    };

    window.addEventListener('audioSpeedChange', handleSpeedChange);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnd);
      window.removeEventListener('audioSpeedChange', handleSpeedChange);
    };
  }, [speed]); // Добавили speed как зависимость

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isPlaying) {
      window.dispatchEvent(new Event('pauseAllAudio'));
      // Убеждаемся, что скорость правильная перед воспроизведением
      audio.playbackRate = speed;
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = value[0] / 100;
    setVolume(value);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Основной плеер */}
      <div
        className={`flex flex-col gap-2 flex-1 bg-background/50 rounded-lg p-3 border border-black/[0.15] dark:border-white/[0.15] shadow-none ${className}`}
      >
        <div className="flex items-center gap-3">
          <audio
            ref={audioRef}
            src={useAuth ? blobUrl || undefined : src}
            preload="metadata"
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20"
            disabled={useAuth && !blobUrl}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </Button>

          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground min-w-[35px]">
              {formatTime(currentTime)}
            </span>

            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="flex-1"
            />

            <span className="text-xs text-muted-foreground min-w-[35px]">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Блок скорости */}
      <div className="flex flex-col items-center justify-center w-10 gap-[2px]">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0 leading-none"
          onClick={() => {
            const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 2;
            setSpeed(next);
          }}
        >
          <FaChevronUp className="w-4 h-4" />
        </Button>

        <span className="text-xs text-muted-foreground leading-none">{speed}x</span>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0 leading-none"
          onClick={() => {
            const prev = speed === 2 ? 1.5 : speed === 1.5 ? 1 : 1;
            setSpeed(prev);
          }}
        >
          <FaChevronDown className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};