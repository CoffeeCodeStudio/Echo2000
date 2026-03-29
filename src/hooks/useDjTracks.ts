import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DjTrack {
  id: string;
  title: string;
  artist: string;
  file_url: string;
  duration_seconds: number | null;
  genre: string | null;
  play_count: number;
  sort_order: number;
}

export function useDjTracks() {
  const [tracks, setTracks] = useState<DjTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    const { data } = await supabase
      .from("dj_tracks")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (data && data.length > 0) {
      setTracks(data);
    }
  };

  const currentTrack = tracks[currentIndex] || null;

  const setupAudio = useCallback((track: DjTrack) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    const audio = new Audio(track.file_url);
    audio.volume = volume;
    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });
    audio.addEventListener("ended", () => {
      nextTrack();
    });
    audioRef.current = audio;
    return audio;
  }, [volume]);

  const play = useCallback(() => {
    if (!currentTrack) return;
    let audio = audioRef.current;
    if (!audio || !audio.src) {
      audio = setupAudio(currentTrack);
    }
    audio.play().then(() => {
      setIsPlaying(true);
      progressInterval.current = setInterval(() => {
        if (audioRef.current) {
          setProgress(audioRef.current.currentTime);
        }
      }, 250);
    }).catch(console.error);
  }, [currentTrack, setupAudio]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    if (progressInterval.current) clearInterval(progressInterval.current);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const nextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    const next = (currentIndex + 1) % tracks.length;
    setCurrentIndex(next);
    setProgress(0);
    if (progressInterval.current) clearInterval(progressInterval.current);
    const audio = setupAudio(tracks[next]);
    if (isPlaying) {
      audio.play().then(() => {
        progressInterval.current = setInterval(() => {
          if (audioRef.current) setProgress(audioRef.current.currentTime);
        }, 250);
      }).catch(console.error);
    }
  }, [tracks, currentIndex, isPlaying, setupAudio]);

  const prevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    const prev = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentIndex(prev);
    setProgress(0);
    if (progressInterval.current) clearInterval(progressInterval.current);
    const audio = setupAudio(tracks[prev]);
    if (isPlaying) {
      audio.play().then(() => {
        progressInterval.current = setInterval(() => {
          if (audioRef.current) setProgress(audioRef.current.currentTime);
        }, 250);
      }).catch(console.error);
    }
  }, [tracks, currentIndex, isPlaying, setupAudio]);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  return {
    tracks, currentTrack, isPlaying, progress, duration, volume,
    togglePlay, nextTrack, prevTrack, changeVolume, fetchTracks,
  };
}
