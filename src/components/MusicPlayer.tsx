"use client";

import { useEffect, useRef, useState } from "react";

type Song = {
  title: string;
  artist: string;
  src: string;
};

const PLAYLIST: Song[] = [
  {
    title: "Yoshi's Story - Ending Story",
    artist: "Yoshi's Story",
    src: "/songs/Yoshi%27s%20Story-%20Ending%20Story.mp3",
  },
  {
    title: "Caterpillar Cafe",
    artist: "Solaris",
    src: "/songs/song%20that%20plays%20when%20you%20enter%20the%20caterpillar%20cafe%20by%20Solaris.mp3",
  },
  {
    title: "A Letter",
    artist: "Tsundere Twintails",
    src: "/songs/A%20Letter%20by%20Tsundere%20Twintails.mp3",
  },
];

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const remainder = whole % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function SkipBackIcon() {
  return (
    <svg className="music-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5h2v14H6z" />
      <path d="m19 6-9 6 9 6z" />
    </svg>
  );
}

function SkipForwardIcon() {
  return (
    <svg className="music-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 5h2v14h-2z" />
      <path d="m5 6 9 6-9 6z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="music-icon music-icon--play" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8 5 11 7-11 7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="music-icon music-icon--pause" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h3v14H7z" />
      <path d="M14 5h3v14h-3z" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg className="music-icon music-icon--volume" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path
        d="M16 8.5a5 5 0 0 1 0 7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M18.5 6a8.5 8.5 0 0 1 0 12"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [songIndex, setSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.45);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const song = PLAYLIST[songIndex];
  const songLabel = `${song.title} by ${song.artist}`;
  const titleIsLong = songLabel.length > 18;

  const syncDuration = (audio: HTMLAudioElement) => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;

    const play = async () => {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
    };

    play();
  }, [songIndex, isPlaying]);

  const playCurrent = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    playCurrent();
  };

  const goToSong = (nextIndex: number) => {
    setSongIndex((nextIndex + PLAYLIST.length) % PLAYLIST.length);
    setCurrentTime(0);
    setDuration(0);
  };

  const seek = (value: string) => {
    const audio = audioRef.current;
    const nextTime = Number(value);
    if (!audio || !Number.isFinite(nextTime)) return;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <section className="music-player" aria-label="Music player">
      <audio
        ref={audioRef}
        src={song.src}
        preload="metadata"
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
          syncDuration(e.currentTarget);
        }}
        onLoadedMetadata={(e) => syncDuration(e.currentTarget)}
        onLoadedData={(e) => syncDuration(e.currentTarget)}
        onDurationChange={(e) => syncDuration(e.currentTarget)}
        onCanPlay={(e) => syncDuration(e.currentTarget)}
        onEnded={() => goToSong(songIndex + 1)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="music-row">
        <div className="music-meta">
          <div className={`music-title${titleIsLong ? " is-long" : ""}`} title={songLabel}>
            <span className="music-title-track">
              <span>{songLabel}</span>
              {titleIsLong && <span aria-hidden="true">{songLabel}</span>}
            </span>
          </div>
        </div>

        <div className="music-controls">
          <button type="button" onClick={() => goToSong(songIndex - 1)} aria-label="Previous song" title="Previous">
            <SkipBackIcon />
          </button>
          <button
            type="button"
            className="music-play"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button type="button" onClick={() => goToSong(songIndex + 1)} aria-label="Next song" title="Next">
            <SkipForwardIcon />
          </button>
        </div>
      </div>

      <div className="music-sliders">
        <div className="music-progress-wrap">
          <div className="music-timer">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            className="music-progress"
            min="0"
            max={duration || 0}
            step="1"
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => seek(e.target.value)}
            aria-label="Song progress"
          />
        </div>

        <label className="music-volume">
          <VolumeIcon />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
          />
        </label>
      </div>
    </section>
  );
}
