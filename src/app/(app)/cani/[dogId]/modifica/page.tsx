"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PawPrint } from "lucide-react";
import { DogForm } from "@/components/dogs/DogForm";
import { tryCreateSupabaseBrowserClient } from "@/lib/supabase/optional";
import type { Database } from "@/types/database";

type Dog = Database["public"]["Tables"]["dogs"]["Row"];

export default function ModificaCanePage() {
  const params = useParams<{ dogId: string }>();
  const dogId = params?.dogId ?? null;
  const supabase = tryCreateSupabaseBrowserClient();

  const [dog, setDog] = useState<Dog | null | "loading">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dogId || !supabase) {
      setDog(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("dogs")
        .select("*")
        .eq("id", dogId)
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setDog(null);
        return;
      }
      if (!data) {
        setError("Cane non trovato o non hai i permessi per modificarlo.");
        setDog(null);
        return;
      }
      setDog(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [dogId, supabase]);

  if (dog === "loading") {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-sm text-slate-300">Caricamento scheda...</CardContent>
        </Card>
      </div>
    );
  }

  if (!dog) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-2xl bg-slate-950/40 p-3 ring-1 ring-inset ring-slate-800">
              <PawPrint className="h-5 w-5 text-blue-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Impossibile aprire la scheda</p>
              <p className="mt-1 text-xs text-slate-300">
                {error ?? "Cane non trovato."}
              </p>
              <Button className="mt-4" variant="primary" size="md" onClick={() => history.back()}>
                Torna indietro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <DogForm mode={{ kind: "update", initial: dog }} />;
}
