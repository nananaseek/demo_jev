"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface RecognitionAlternative {
  transcript: string;
}

interface RecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: RecognitionAlternative;
}

interface RecognitionResultList {
  readonly length: number;
  [index: number]: RecognitionResult;
}

interface RecognitionEvent {
  resultIndex: number;
  results: RecognitionResultList;
}

interface RecognitionErrorEvent {
  error: string;
}

interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type RecognitionConstructor = new () => RecognitionLike;
type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as SpeechWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function messageForError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Доступ до мікрофона вимкнено. Дозвольте його в налаштуваннях браузера.";
    case "no-speech":
      return "Нічого не почули. Натисніть «Надиктувати» і спробуйте ще раз.";
    case "audio-capture":
      return "Мікрофон не знайдено. Перевірте, чи він підʼєднаний.";
    case "network":
      return "Розпізнавання потребує мережі. Перевірте зʼєднання.";
    case "language-not-supported":
      return "Браузер не підтримує розпізнавання українською.";
    default:
      return "Не вдалося розпізнати голос. Спробуйте ще раз.";
  }
}

interface UseSpeechInputOptions {
  lang?: string;
  onTranscript: (transcript: string) => void;
}

export function useSpeechInput({ lang = "uk-UA", onTranscript }: UseSpeechInputOptions) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<RecognitionLike | null>(null);
  const listeningRef = useRef(false);
  const ignoreResultsRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
    },
    [],
  );

  const stop = useCallback(() => {
    ignoreResultsRef.current = true;
    recognitionRef.current?.stop();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const toggle = useCallback(() => {
    if (listeningRef.current) {
      recognitionRef.current?.stop();
      return;
    }

    const Constructor = recognitionConstructor();
    if (!Constructor) {
      setError("Голосове введення не підтримується цим браузером. Спробуйте Chrome або Edge.");
      return;
    }

    ignoreResultsRef.current = false;
    recognitionRef.current?.abort();
    const recognition = new Constructor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      listeningRef.current = true;
      setListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      if (ignoreResultsRef.current) return;
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript ?? "";
        if (result?.isFinal) finalText += transcript;
        else interimText += transcript;
      }

      if (finalText.trim()) {
        onTranscriptRef.current(finalText.trim());
        setInterim("");
      } else {
        setInterim(interimText.trim());
      }
    };

    recognition.onerror = (event) => {
      listeningRef.current = false;
      setListening(false);
      setInterim("");
      if (event.error !== "aborted") setError(messageForError(event.error));
    };

    recognition.onend = () => {
      listeningRef.current = false;
      ignoreResultsRef.current = false;
      setListening(false);
      setInterim("");
    };

    try {
      recognition.start();
      listeningRef.current = true;
    } catch {
      listeningRef.current = false;
      setListening(false);
      setError("Не вдалося запустити розпізнавання. Спробуйте ще раз.");
    }
  }, [lang]);

  return { listening, interim, error, toggle, stop, clearError };
}
