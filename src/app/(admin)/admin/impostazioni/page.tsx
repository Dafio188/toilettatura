import { requireAdmin } from "@/lib/auth/require-admin";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Store, Users } from "lucide-react";
import { normalizeTenantPublicBranding } from "@/lib/tenant-branding";
import { updateSystemSettings, updateTenantPublicBranding, uploadTenantPublicLogo } from "./actions";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ImpostazioniPage() {
  const { supabase, tenantId } = await requireAdmin();

  const { data } = await supabase.from("system_settings").select("*").eq("tenant_id", tenantId).maybeSingle();
  const settings = data as any; // bypass "never" type inference issue
  const { data: tenant } = await (supabase.from("tenants") as any).select("name, slug, settings").eq("id", tenantId).maybeSingle();
  const branding = normalizeTenantPublicBranding((tenant as any)?.settings?.publicBranding, (tenant as any)?.name || "DogWash24");

  const mode = settings?.mode || "HYBRID";
  const maxAssisted = settings?.max_concurrent_assisted || 1;
  const enableAssisted = settings?.enable_assisted_wash ?? true;
  const priceAssisted = settings?.price_assisted_wash_credits ?? 10;
  const enableFull = settings?.enable_full_grooming ?? true;
  const priceFull = settings?.price_full_grooming_credits ?? 50;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Impostazioni Sistema</h1>
        <p className="text-sm text-slate-400">Configura la modalità operativa, le capacità e il catalogo servizi del salone.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-semibold">Configurazione Generale</h2>
            </div>
            <p className="text-sm text-slate-400">Determina come il salone accetta le prenotazioni.</p>
          </CardHeader>
          <CardContent>
            <form action={updateSystemSettings} className="space-y-6">
              
              <div className="space-y-3">
                <label className="text-sm font-medium">Modalità Operativa</label>
                <div className="grid gap-2">
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${mode === "HYBRID" ? "border-cyan-500 bg-cyan-500/10" : "border-slate-800 bg-slate-900/40 hover:bg-slate-800/60"}`}>
                    <input type="radio" name="mode" value="HYBRID" defaultChecked={mode === "HYBRID"} className="mt-1" />
                    <div>
                      <p className="font-medium text-slate-50">Ibrida (Consigliata)</p>
                      <p className="text-xs text-slate-400">I clienti possono scegliere tra Self-Service e Servizi Assistiti in fase di prenotazione.</p>
                    </div>
                  </label>
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${mode === "SELF_ONLY" ? "border-cyan-500 bg-cyan-500/10" : "border-slate-800 bg-slate-900/40 hover:bg-slate-800/60"}`}>
                    <input type="radio" name="mode" value="SELF_ONLY" defaultChecked={mode === "SELF_ONLY"} className="mt-1" />
                    <div>
                      <p className="font-medium text-slate-50">Solo Self-Service</p>
                      <p className="text-xs text-slate-400">Tutte le prenotazioni sono self-service. I servizi assistiti non vengono mostrati ai clienti.</p>
                    </div>
                  </label>
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${mode === "ASSISTED_ONLY" ? "border-cyan-500 bg-cyan-500/10" : "border-slate-800 bg-slate-900/40 hover:bg-slate-800/60"}`}>
                    <input type="radio" name="mode" value="ASSISTED_ONLY" defaultChecked={mode === "ASSISTED_ONLY"} className="mt-1" />
                    <div>
                      <p className="font-medium text-slate-50">Solo Assistito / Toelettatura</p>
                      <p className="text-xs text-slate-400">Tutte le prenotazioni richiedono un operatore. Ideale per saloni tradizionali.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-400" />
                  Capacità Staff Simultanea
                </label>
                <p className="text-xs text-slate-400">Quanti cani possono essere serviti in modalità assistita nello stesso momento? Dipende dal numero di toelettatori presenti in turno oggi.</p>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    name="max_concurrent_assisted" 
                    defaultValue={maxAssisted} 
                    min="0" 
                    max="10" 
                    className="w-24 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                  />
                  <span className="text-sm text-slate-400">operatori attivi</span>
                </div>
              </div>

              <div className="my-4 h-px bg-slate-800/60" />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-cyan-400">Catalogo Servizi Staff</h3>
                <p className="text-xs text-slate-400">Configura i servizi che richiedono l&apos;operatore (visibili se in modalità Ibrida o Solo Assistito).</p>
                
                {/* Servizio 1: Lavaggio Assistito */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-50">Lavaggio Assistito</p>
                      <p className="text-[11px] text-slate-400">Il cliente aiuta l&apos;operatore. Il cliente paga anche la vasca al minuto.</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" name="enable_assisted_wash" defaultChecked={enableAssisted} className="peer sr-only" />
                      <div className="peer h-6 w-11 rounded-full bg-slate-800 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/30"></div>
                    </label>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400 w-24">Costo Fisso:</span>
                    <input 
                      type="number" 
                      name="price_assisted_wash_credits" 
                      defaultValue={priceAssisted} 
                      min="0" 
                      className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-50"
                    />
                    <span className="text-xs text-slate-400">crediti</span>
                  </div>
                </div>

                {/* Servizio 2: Toelettatura Completa */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-50">Toelettatura Completa</p>
                      <p className="text-[11px] text-slate-400">Il cliente lascia il cane (Drop-off). Include l&apos;uso della vasca.</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" name="enable_full_grooming" defaultChecked={enableFull} className="peer sr-only" />
                      <div className="peer h-6 w-11 rounded-full bg-slate-800 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/30"></div>
                    </label>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400 w-24">Costo Fisso:</span>
                    <input 
                      type="number" 
                      name="price_full_grooming_credits" 
                      defaultValue={priceFull} 
                      min="0" 
                      className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-50"
                    />
                    <span className="text-xs text-slate-400">crediti</span>
                  </div>
                </div>

              </div>

              <Button type="submit" variant="primary" className="w-full">
                Salva Impostazioni
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-violet-400" />
              <h2 className="text-lg font-semibold">Homepage Pubblica</h2>
            </div>
            <p className="text-sm text-slate-400">Personalizza la schermata iniziale che i clienti vedono prima del login.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <form action={uploadTenantPublicLogo} encType="multipart/form-data" className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_file">Logo del salone</Label>
                  {branding.logoUrl ? (
                    <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white p-2">
                        <Image
                          src={branding.logoUrl}
                          alt={`Logo ${branding.clientDisplayName}`}
                          width={160}
                          height={160}
                          className="h-auto w-full object-contain"
                        />
                      </div>
                      <div className="text-xs text-slate-400">
                        <p className="font-semibold text-slate-200">Logo attuale</p>
                        <p>Formati supportati: PNG, JPG, WEBP</p>
                        <p>Dimensione massima: 2 MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-5 text-xs text-slate-500">
                      Nessun logo caricato. Puoi caricarlo qui e usarlo subito nella homepage pubblica.
                    </div>
                  )}
                  <input
                    id="logo_file"
                    name="logo_file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-500/15 file:px-3 file:py-2 file:text-sm file:font-medium file:text-violet-200 hover:file:bg-violet-500/25"
                    required
                  />
                </div>

                <Button type="submit" variant="secondary" className="w-full">
                  Carica Logo
                </Button>
              </form>

              <form action={updateTenantPublicBranding} className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
                <p className="font-semibold text-slate-200">{branding.clientDisplayName}</p>
                <p className="mt-1">Tenant: {(tenant as any)?.slug || "default"}</p>
                <p className="mt-1">Puoi personalizzare testi, co-branding e logo mostrati prima del login.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_display_name">Nome pubblico del salone</Label>
                <Input
                  id="client_display_name"
                  name="client_display_name"
                  defaultValue={branding.clientDisplayName}
                  placeholder="Es. Boutique Pelo Milano"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">URL logo pubblico</Label>
                <Input
                  id="logo_url"
                  name="logo_url"
                  defaultValue={branding.logoUrl ?? ""}
                  placeholder="https://xxxx.supabase.co/storage/v1/object/public/... oppure /logo.png"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_title">Titolo principale</Label>
                <Input
                  id="hero_title"
                  name="hero_title"
                  defaultValue={branding.heroTitle}
                  placeholder="Titolo mostrato in homepage"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_subtitle">Sottotitolo</Label>
                <Input
                  id="hero_subtitle"
                  name="hero_subtitle"
                  defaultValue={branding.heroSubtitle}
                  placeholder="Messaggio breve ad alto impatto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_description">Descrizione pubblica</Label>
                <Textarea
                  id="hero_description"
                  name="hero_description"
                  defaultValue={branding.heroDescription}
                  placeholder="Spiega cosa può fare il cliente nell'app"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_info">Informazioni aggiuntive</Label>
                <Input
                  id="contact_info"
                  name="contact_info"
                  defaultValue={branding.contactInfo ?? ""}
                  placeholder="Es. Via Roma 10 · WhatsApp 333 1234567"
                />
              </div>

              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-50">Mostra il brand DogWash24</p>
                  <p className="text-xs text-slate-400">Attiva il co-branding nella schermata pubblica.</p>
                </div>
                <input
                  type="checkbox"
                  name="show_platform_branding"
                  defaultChecked={branding.showPlatformBranding}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-violet-400"
                />
              </label>

              <Button type="submit" variant="primary" className="w-full">
                Salva Homepage Pubblica
              </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
