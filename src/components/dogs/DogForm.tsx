"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Pencil, Save, Trash2, Upload, X } from "lucide-react";
import { tryCreateSupabaseBrowserClient } from "@/lib/supabase/optional";
import type { Database } from "@/types/database";
import {
  describeDogPhotoError,
  deleteDogPhotoIfOwned,
  type DogPhotoValidationError,
  type ValidatedDogPhoto,
  uploadDogPhoto,
  validateDogPhotoFile,
  DOG_PHOTO_ACCEPTED_MIME
} from "@/lib/dog-photo-upload";

type DogSize = Database["public"]["Enums"]["dog_size"];
type DogRow = Database["public"]["Tables"]["dogs"]["Row"];

const sizes: { value: DogSize; label: string }[] = [
  { value: "SMALL", label: "Piccolo" },
  { value: "MEDIUM", label: "Medio" },
  { value: "LARGE", label: "Grande" },
  { value: "GIANT", label: "Gigante" }
];

export type DogFormMode =
  | { kind: "create" }
  | { kind: "update"; initial: DogRow };

type Props = {
  mode: DogFormMode;
};

const ACCEPT_ATTR = Array.from(DOG_PHOTO_ACCEPTED_MIME).join(",");

export function DogForm({ mode }: Props) {
  const router = useRouter();
  const supabase = tryCreateSupabaseBrowserClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState<string>(mode.kind === "update" ? mode.initial.name : "");
  const [breed, setBreed] = useState<string>(mode.kind === "update" ? mode.initial.breed ?? "" : "");
  const [size, setSize] = useState<DogSize>(mode.kind === "update" ? mode.initial.size : "MEDIUM");
  const [weightKg, setWeightKg] = useState<string>(
    mode.kind === "update" && mode.initial.weight ? String(mode.initial.weight).replace(".", ",") : ""
  );
  const [notes, setNotes] = useState<string>(mode.kind === "update" ? mode.initial.notes ?? "" : "");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; text: string }>(null);

  // Gestione foto
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(
    mode.kind === "update" ? mode.initial.photo_url ?? null : null
  );
  const [pendingPhoto, setPendingPhoto] = useState<ValidatedDogPhoto | null>(null);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(null);
  const [removedExisting, setRemovedExisting] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const canSave = useMemo(() => name.trim().length >= 2 && !isSaving, [name, isSaving]);

  const effectivePreview: string | null =
    pendingPhoto && pendingPhotoPreview
      ? pendingPhotoPreview
      : !removedExisting && existingPhotoUrl
        ? existingPhotoUrl
        : null;

  useEffect(() => {
    return () => {
      if (pendingPhotoPreview) URL.revokeObjectURL(pendingPhotoPreview);
    };
  }, [pendingPhotoPreview]);

  const handlePickPhoto = (files: FileList | null) => {
    setPhotoError(null);
    const file = files && files[0] ? files[0] : null;
    if (!file || !supabase) return;

    // userId viene preso tramite auth.getUser nel flow di salvataggio, ma per validate
    // possiamo usare una chiamata veloce a auth.getUser. Però meglio: carichiamo user in parallelo.
    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? null;
      const validatedOrErr = validateDogPhotoFile(file, userId);
      if (validatedOrErr.kind !== "OK") {
        setPhotoError(describeDogPhotoError(validatedOrErr));
        return;
      }
      const validated = validatedOrErr;
      // Revoco precedente preview se esiste
      if (pendingPhotoPreview) URL.revokeObjectURL(pendingPhotoPreview);
      setPendingPhoto(validated);
      setPendingPhotoPreview(URL.createObjectURL(validated.file));
      setRemovedExisting(false);
    })();
  };

  const handleRemovePending = () => {
    if (pendingPhotoPreview) URL.revokeObjectURL(pendingPhotoPreview);
    setPendingPhoto(null);
    setPendingPhotoPreview(null);
    setPhotoError(null);
  };

  const handleRemoveExisting = () => {
    setRemovedExisting(true);
  };

  const handleRestoreExisting = () => {
    setRemovedExisting(false);
  };

  const saveDog = async () => {
    if (!supabase || !canSave) return;
    setIsSaving(true);
    setStatus(null);
    setPhotoError(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setStatus({ ok: false, text: "Devi effettuare l'accesso per salvare un cane." });
        setIsSaving(false);
        return;
      }
      const ownerId = userData.user.id;

      // --- GESTIONE FOTO ---
      // 1. Se c'è pendingPhoto, facciamo upload per ottenere publicUrl
      let finalPhotoUrl: string | null = null;
      if (pendingPhoto) {
        const up = await uploadDogPhoto(supabase, pendingPhoto);
        if (!up.ok) {
          setPhotoError(up.error);
          setStatus({ ok: false, text: "Non è stato possibile caricare la foto. Ritenta." });
          setIsSaving(false);
          return;
        }
        finalPhotoUrl = up.publicUrl;
      } else if (!removedExisting && existingPhotoUrl) {
        finalPhotoUrl = existingPhotoUrl;
      } else {
        finalPhotoUrl = null;
      }

      const weight = weightKg.trim() ? Number(weightKg.replace(",", ".")) : null;
      const finalWeight = weight && Number.isFinite(weight) && weight > 0
        ? Math.round(weight * 10) / 10
        : null;

      // 2. INSERT o UPDATE
      if (mode.kind === "create") {
        const { error } = await supabase.from("dogs").insert({
          owner_id: ownerId,
          name: name.trim(),
          breed: breed.trim() || null,
          size,
          weight: finalWeight,
          notes: notes.trim() || null,
          photo_url: finalPhotoUrl
        });
        if (error) {
          // rollback foto uploadata
          if (finalPhotoUrl) await deleteDogPhotoIfOwned(supabase, ownerId, finalPhotoUrl);
          setStatus({ ok: false, text: "Errore durante il salvataggio: " + error.message });
          setIsSaving(false);
          return;
        }
      } else {
        const currentRow = mode.initial;
        const prevPhoto = currentRow.photo_url;
        const photoChanged = prevPhoto !== finalPhotoUrl;
        const { error } = await supabase
          .from("dogs")
          .update({
            name: name.trim(),
            breed: breed.trim() || null,
            size,
            weight: finalWeight,
            notes: notes.trim() || null,
            photo_url: finalPhotoUrl
          })
          .eq("id", currentRow.id);
        if (error) {
          if (finalPhotoUrl && photoChanged) {
            await deleteDogPhotoIfOwned(supabase, ownerId, finalPhotoUrl);
          }
          setStatus({ ok: false, text: "Errore durante l'aggiornamento: " + error.message });
          setIsSaving(false);
          return;
        }
        // 3. Cleanup foto precedente SOLO se è stata sostituita o rimossa
        if (photoChanged && prevPhoto) {
          await deleteDogPhotoIfOwned(supabase, ownerId, prevPhoto);
        }
      }

      // 4. Successo
      setStatus({ ok: true, text: "Scheda salvata." });
      setTimeout(() => router.push("/cani"), 350);
    } finally {
      setIsSaving(false);
    }
  };

  const title = mode.kind === "create" ? "Registra un cane" : "Modifica il cane";
  const subtitle = mode.kind === "create"
    ? "Inserisci i dati principali. Puoi aggiornarli in qualsiasi momento."
    : "Aggiorna dati e foto della scheda.";
  const headerIcon = mode.kind === "create" ? Upload : Pencil;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm leading-relaxed text-slate-200">{subtitle}</p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-300">Scheda</p>
            <p className="text-lg font-semibold tracking-tight">Dati del cane</p>
          </div>
          <div className="rounded-2xl bg-slate-950/40 p-3 ring-1 ring-inset ring-slate-800">
            {mode.kind === "create"
              ? <Upload className="h-5 w-5 text-blue-300" />
              : <Pencil className="h-5 w-5 text-blue-300" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Foto del cane (opzionale)</Label>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-900/60 ring-1 ring-inset ring-slate-800">
                {effectivePreview ? (
                  <img src={effectivePreview} alt="anteprima foto cane" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-500">
                    <Camera className="h-7 w-7" />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_ATTR}
                  className="hidden"
                  onChange={(e) => handlePickPhoto(e.target.files)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                  {effectivePreview ? "Cambia foto" : "Carica foto"}
                </Button>
                {pendingPhoto && (
                  <Button type="button" variant="ghost" size="md" onClick={handleRemovePending}>
                    <X className="h-4 w-4" />
                    Annulla foto
                  </Button>
                )}
                {!pendingPhoto && !removedExisting && existingPhotoUrl && (
                  <Button type="button" variant="ghost" size="md" onClick={handleRemoveExisting}>
                    <Trash2 className="h-4 w-4" />
                    Rimuovi foto
                  </Button>
                )}
                {!pendingPhoto && removedExisting && existingPhotoUrl && (
                  <Button type="button" variant="ghost" size="md" onClick={handleRestoreExisting}>
                    Ripristina foto
                  </Button>
                )}
              </div>
            </div>
            {photoError ? <p className="text-xs text-rose-400">{photoError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dog-name">Nome</Label>
            <Input
              id="dog-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Luna"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dog-breed">Razza (opzionale)</Label>
            <Input
              id="dog-breed"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="Es. Labrador"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dog-size">Taglia</Label>
              <select
                id="dog-size"
                value={size}
                onChange={(e) => setSize(e.target.value as DogSize)}
                className="h-12 w-full rounded-xl bg-slate-950/40 px-3 text-sm text-slate-50 ring-1 ring-inset ring-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {sizes.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dog-weight">Peso (kg, opzionale)</Label>
              <Input
                id="dog-weight"
                inputMode="decimal"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="Es. 12,5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dog-notes">Note (opzionale)</Label>
            <Textarea
              id="dog-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Allergie, preferenze, ecc."
            />
          </div>

          {status ? (
            <p className={status.ok ? "text-xs text-emerald-400" : "text-xs text-rose-400"}>
              {status.text}
            </p>
          ) : null}

          <div className="flex gap-3">
            <Button className="flex-1" variant="secondary" onClick={() => router.back()} type="button">
              Annulla
            </Button>
            <Button
              className="flex-1"
              variant="primary"
              disabled={!canSave || isSaving}
              onClick={saveDog}
              type="button"
            >
              <Save className="h-5 w-5" />
              {isSaving ? "Salvataggio..." : "Salva"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}