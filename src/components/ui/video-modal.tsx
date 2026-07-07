"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoModalProps {
  /** Testo del pulsante trigger */
  label?: string;
  /** Poster (anteprima) del video */
  poster?: string;
  /** Sorgenti video in ordine di preferenza */
  sources: { src: string; type: string }[];
}

export function VideoModal({
  label = "Vedi demo prenotazione",
  poster,
  sources,
}: VideoModalProps) {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  /* Apri / chiudi */
  const openModal = () => setOpen(true);
  const closeModal = useCallback(() => {
    setOpen(false);
    videoRef.current?.pause();
  }, []);

  /* Sincronizza <dialog> con lo stato */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  /* Chiudi cliccando sul backdrop */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    const isOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
    if (isOutside) closeModal();
  };

  /* Chiudi con Escape (nativo del browser su <dialog>) */
  useEffect(() => {
    const dialog = dialogRef.current;
    const onCancel = (e: Event) => {
      e.preventDefault();
      closeModal();
    };
    dialog?.addEventListener("cancel", onCancel);
    return () => dialog?.removeEventListener("cancel", onCancel);
  }, [closeModal]);

  return (
    <>
      {/* Pulsante trigger */}
      <Button
        className="w-full"
        variant="primary"
        onClick={openModal}
        aria-haspopup="dialog"
      >
        <Play className="mr-2 h-4 w-4" />
        {label}
      </Button>

      {/* Modale */}
      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        className="
          m-auto max-h-[90dvh] w-full max-w-4xl
          rounded-2xl border border-slate-800
          bg-slate-950 p-0 shadow-2xl
          backdrop:bg-black/70 backdrop:backdrop-blur-sm
          open:flex open:flex-col
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
          <p className="text-sm font-semibold text-slate-100">
            Demo — Prenotazione DogWash24
          </p>
          <button
            onClick={closeModal}
            aria-label="Chiudi video"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video */}
        <div className="overflow-hidden rounded-b-2xl bg-black">
          {open && (
            <video
              ref={videoRef}
              controls
              autoPlay
              playsInline
              preload="metadata"
              poster={poster}
              className="aspect-video w-full"
            >
              {sources.map((s) => (
                <source key={s.src} src={s.src} type={s.type} />
              ))}
              Il tuo browser non supporta il tag video.
            </video>
          )}
        </div>
      </dialog>
    </>
  );
}
