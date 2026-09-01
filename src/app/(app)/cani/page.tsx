"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Pencil, PawPrint, Plus, Trash2 } from "lucide-react";
import { tryCreateSupabaseBrowserClient } from "@/lib/supabase/optional";
import type { Database } from "@/types/database";
import { deleteDogPhotoIfOwned } from "@/lib/dog-photo-upload";

type Dog = Database["public"]["Tables"]["dogs"]["Row"];

export default function CaniPage() {
  const router = useRouter();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const supabase = tryCreateSupabaseBrowserClient();

  useEffect(() => {
    async function loadDogs() {
      if (!supabase) return;
      setLoading(true);
      const { data } = await supabase.from("dogs").select("*").order("created_at", { ascending: false });
      if (data) setDogs(data);
      setLoading(false);
    }
    void loadDogs();
  }, [supabase]);

  const removeDog = async (dog: Dog) => {
    if (!supabase) return;
    setRemovingId(dog.id);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const ownerId = userData.user?.id;
      const { error } = await supabase.from("dogs").delete().eq("id", dog.id);
      if (!error) {
        setDogs((prev) => prev.filter((d) => d.id !== dog.id));
        if (ownerId) {
          // cleanup asincrono, non bloccante
          void deleteDogPhotoIfOwned(supabase, ownerId, dog.photo_url);
        }
      }
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">I miei cani</h2>
        <p className="text-sm leading-relaxed text-slate-200">
          Registra i tuoi cani con foto, taglia, peso e note.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-300">Lista</p>
            <p className="text-lg font-semibold tracking-tight">
              {loading
                ? "..."
                : dogs.length
                  ? `${dogs.length} ${dogs.length === 1 ? "cane" : "cani"}`
                  : "Nessun cane ancora"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950/40 p-3 ring-1 ring-inset ring-slate-800">
            <PawPrint className="h-5 w-5 text-blue-300" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!loading && dogs.length ? (
            <div className="grid gap-3">
              {dogs.map((dog) => (
                <div
                  key={dog.id}
                  className="rounded-2xl bg-slate-950/40 p-4 ring-1 ring-inset ring-slate-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-900/60 ring-1 ring-inset ring-slate-800">
                        {dog.photo_url ? (
                          <img src={dog.photo_url} alt={dog.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-500">
                            <Camera className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{dog.name}</p>
                        <p className="mt-1 text-xs text-slate-300">
                          {dog.breed ? dog.breed : "Razza non indicata"} · {dog.size}
                          {dog.weight ? ` · ${dog.weight} kg` : ""}
                        </p>
                        {dog.notes ? (
                          <p className="mt-2 line-clamp-2 text-xs text-slate-300">{dog.notes}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="md"
                        className="h-10 w-10 px-0"
                        onClick={() => router.push(`/cani/${dog.id}/modifica`)}
                        aria-label="Modifica cane"
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        className="h-10 w-10 px-0"
                        onClick={() => removeDog(dog)}
                        aria-label="Rimuovi cane"
                        disabled={removingId === dog.id}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : loading ? (
            <div className="rounded-2xl bg-slate-950/40 p-4 ring-1 ring-inset ring-slate-800 text-sm text-slate-300">
              Caricamento...
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-950/40 p-4 ring-1 ring-inset ring-slate-800">
              <p className="text-sm font-semibold">Aggiungi il primo cane</p>
              <p className="mt-1 text-xs text-slate-300">Ci vogliono meno di 60 secondi.</p>
            </div>
          )}

          <Link href="/cani/nuovo">
            <Button className="w-full" variant="primary">
              <Plus className="h-5 w-5" />
              Registra un cane
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
