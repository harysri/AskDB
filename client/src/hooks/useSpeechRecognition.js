import { useCallback, useEffect, useRef, useState } from "react";

const getSpeechRecognitionCtor = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

/**
 * Web Speech API dictation hook.
 *
 * Streamed as two pieces so the consumer can render the settled text and the
 * in-flight partial separately:
 *  - transcript: confirmed words so far
 *  - interim: the newest, still-mutable partial (re-emitted on every event)
 *
 * Designed for continuous dictation: pauses do NOT stop the session — the
 * mic stays live until stop() is called explicitly (or the component unmounts).
 */
export default function useSpeechRecognition({ lang } = {}) {
  const Ctor = getSpeechRecognitionCtor();
  const supported = Boolean(Ctor);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  // Latest values for callbacks that must not re-create the recognition object.
  const listeningRef = useRef(false);
  const stoppingRef = useRef(false);

  useEffect(() => {
    return () => {
      // Unmount: hard-abort so the browser mic indicator turns off.
      stoppingRef.current = true;
      listeningRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch {
        // No-op: already gone.
      }
    };
  }, []);

  const buildRecognition = useCallback(() => {
    const recognition = new Ctor();
    recognition.lang = lang || navigator.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimText = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }
      if (finalText) {
        setTranscript((prev) => {
          const needsSpace =
            prev.length > 0 &&
            !/\s$/.test(prev) &&
            !/^\s/.test(finalText.trimStart());
          return prev + (needsSpace ? " " : "") + finalText;
        });
      }
      setInterim(interimText);
    };

    recognition.onerror = (event) => {
      const messages = {
        "not-allowed": "Microphone access was denied. Please allow mic permission for this site.",
        "service-not-allowed": "Speech service is unavailable in this browser.",
        "no-speech": "No speech detected — tap the mic and try again.",
        network: "Speech service unavailable. Check your connection and try again.",
        aborted: "",
      };
      const message = messages[event.error] || "Speech recognition failed. Please try again.";
      setError(message);
    };

    recognition.onend = () => {
      // Chrome stops on long silences: restart unless the user asked to stop.
      if (listeningRef.current && !stoppingRef.current) {
        try {
          recognitionRef.current.start();
          return;
        } catch {
          // Fall through to the listening-off path.
        }
      }
      listeningRef.current = false;
      stoppingRef.current = false;
      setIsListening(false);
      setInterim("");
    };

    return recognition;
  }, [Ctor, lang]);

  const start = useCallback(() => {
    if (!supported || listeningRef.current) return;
    setError("");
    setTranscript("");
    setInterim("");
    stoppingRef.current = false;
    const recognition = buildRecognition();
    recognitionRef.current = recognition;
    try {
      recognition.start();
      listeningRef.current = true;
      setIsListening(true);
    } catch (err) {
      listeningRef.current = false;
      setIsListening(false);
      setError("Microphone could not be started. Please try again.");
    }
  }, [supported, buildRecognition]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    stoppingRef.current = true;
    listeningRef.current = false;
    setIsListening(false);
    try {
      recognitionRef.current.stop();
    } catch {
      // No-op: already stopped.
    }
  }, []);

  const toggle = useCallback(() => {
    if (listeningRef.current) stop();
    else start();
  }, [start, stop]);

  const reset = useCallback(() => {
    setTranscript("");
    setInterim("");
    setError("");
  }, []);

  return {
    supported,
    isListening,
    transcript,
    interim,
    error,
    start,
    stop,
    toggle,
    reset,
  };
}
