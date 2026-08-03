import { useCallback, useEffect, useRef, useState } from 'react';

export const useMicTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState(null);

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const startTest = useCallback(async () => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;

      console.log("Audio Track:", stream.getAudioTracks()[0]);
      console.log("Settings:", stream.getAudioTracks()[0].getSettings());

      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      const audioContext = new AudioContextClass();

      audioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      console.log("AudioContext:", audioContext.state);

      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;

      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);

      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.fftSize);

      setIsTesting(true);

      const update = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteTimeDomainData(dataArray);

        let sumSquares = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const sample = (dataArray[i] - 128) / 128;
          sumSquares += sample * sample;
        }

        const rms = Math.sqrt(sumSquares / dataArray.length);

        const level = Math.min(100, Math.round(rms * 400));

        setAudioLevel(level);

        console.log("RMS:", rms, "Level:", level);

        animationFrameRef.current = requestAnimationFrame(update);
      };

      update();
    } catch (err) {
      console.error(err);

      setError(err.message || "Failed to access microphone");
    }
  }, []);

  const stopTest = useCallback(() => {
    setIsTesting(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    setAudioLevel(0);
  }, []);

  useEffect(() => {
    return () => stopTest();
  }, [stopTest]);

  return {
    isTesting,
    audioLevel,
    error,
    startTest,
    stopTest,
  };
};