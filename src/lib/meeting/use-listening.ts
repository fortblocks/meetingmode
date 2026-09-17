import { useEffect, useRef } from "react";
import { LIVE_DEMO_LINES } from "./fixtures";
import { liveMeetingCues, transcribeChunk } from "./grok";
import { useMeeting } from "./store";
import {
  CUE_INTERVAL_MS,
  MAX_CUE_CALLS_PER_SESSION,
  MAX_STT_CHUNKS_PER_SESSION,
} from "./types";

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result ?? "");
      const comma = res.indexOf(",");
      resolve(comma >= 0 ? res.slice(comma + 1) : res);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function useListening() {
  const listening = useMeeting((s) => s.listening);
  const settings = useMeeting((s) => s.settings);
  const appendTranscript = useMeeting((s) => s.appendTranscript);
  const setCues = useMeeting((s) => s.setCues);
  const setMicActive = useMeeting((s) => s.setMicActive);
  const setAudioUploading = useMeeting((s) => s.setAudioUploading);
  const addRecordingChunk = useMeeting((s) => s.addRecordingChunk);
  const addStreamedMs = useMeeting((s) => s.addStreamedMs);
  const setListenHint = useMeeting((s) => s.setListenHint);
  const setUsingDemoAudio = useMeeting((s) => s.setUsingDemoAudio);
  const stopListen = useMeeting((s) => s.stopListen);
  const fairUseStopped = useMeeting((s) => s.fairUseStopped);

  const cueCalls = useRef(0);
  const sttChunks = useRef(0);
  const lastTranscriptLen = useRef(0);
  const lastCueAt = useRef(0);
  const demoIndex = useRef(0);

  useEffect(() => {
    if (!listening) {
      cueCalls.current = 0;
      sttChunks.current = 0;
      lastTranscriptLen.current = 0;
      demoIndex.current = 0;
      lastCueAt.current = 0;
      return;
    }

    let cancelled = false;
    let recorder: MediaRecorder | null = null;
    let stream: MediaStream | null = null;
    let demoTimer: number | undefined;
    let cueTimer: number | undefined;
    let usageTimer: number | undefined;

    const startDemo = () => {
      if (demoTimer) return;
      demoTimer = window.setInterval(() => {
        const line = LIVE_DEMO_LINES[demoIndex.current];
        if (!line) {
          demoIndex.current = 0;
          return;
        }
        appendTranscript(`${line.speaker}: ${line.text}`);
        demoIndex.current += 1;
      }, 2800);
    };

    const startMic = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setMicActive(true);
        setUsingDemoAudio(false);
        setListenHint(
          "Microphone on. Call audio is sent to xAI only while Listening.",
        );
        const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
        recorder = new MediaRecorder(stream, { mimeType: mime });
        recorder.ondataavailable = async (ev) => {
          if (!ev.data || ev.data.size < 800 || cancelled) return;
          addRecordingChunk(ev.data);
          if (sttChunks.current >= MAX_STT_CHUNKS_PER_SESSION) return;
          sttChunks.current += 1;
          setAudioUploading(true);
          try {
            const audioBase64 = await blobToBase64(ev.data);
            const result = await transcribeChunk({
              data: {
                audioBase64,
                mimeType: ev.data.type || "audio/webm",
                userKey: settings.xaiApiKey || undefined,
              },
            });
            if (cancelled) return;
            if (result.ok && result.text) {
              appendTranscript(result.text);
            }
          } catch {
            /* ignore chunk errors */
          } finally {
            if (!cancelled) setAudioUploading(false);
          }
        };
        recorder.start(5000);
        // Still run the sample ticker so the overlay has content if STT is quiet.
        startDemo();
      } catch {
        setMicActive(false);
        setUsingDemoAudio(true);
        setListenHint(
          "Microphone unavailable — playing a sample call so cues still work. Stop listening ends upload.",
        );
        startDemo();
      }
    };

    void startMic();

    cueTimer = window.setInterval(() => {
      const store = useMeeting.getState();
      if (!store.listening) return;
      const text = store.transcript;
      if (text.length <= lastTranscriptLen.current) return;
      if (cueCalls.current >= MAX_CUE_CALLS_PER_SESSION) return;
      if (Date.now() - lastCueAt.current < CUE_INTERVAL_MS - 200) return;
      lastTranscriptLen.current = text.length;
      lastCueAt.current = Date.now();
      cueCalls.current += 1;
      const recent = text.slice(-1800);
      void liveMeetingCues({
        data: {
          mode: store.settings.listenMode,
          userContext: store.settings.userContext,
          agenda: store.settings.agenda,
          recent,
          userKey: store.settings.xaiApiKey || undefined,
        },
      }).then((cues) => {
        if (cancelled) return;
        setCues(
          {
            now: cues.now,
            say: cues.say,
            watch: cues.watch,
            parked: cues.parked,
          },
          cues.error ?? null,
        );
      });
    }, CUE_INTERVAL_MS);

    usageTimer = window.setInterval(() => {
      addStreamedMs(1000);
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(demoTimer);
      window.clearInterval(cueTimer);
      window.clearInterval(usageTimer);
      recorder?.stop();
      stream?.getTracks().forEach((t) => t.stop());
      setMicActive(false);
      setAudioUploading(false);
    };
  }, [
    listening,
    settings.xaiApiKey,
    appendTranscript,
    setCues,
    setMicActive,
    setAudioUploading,
    addRecordingChunk,
    addStreamedMs,
    setListenHint,
    setUsingDemoAudio,
  ]);

  useEffect(() => {
    if (fairUseStopped && listening) stopListen();
  }, [fairUseStopped, listening, stopListen]);
}
