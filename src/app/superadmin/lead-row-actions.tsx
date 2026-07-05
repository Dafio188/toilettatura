"use client";

import { useState } from "react";
import { Trash2, Loader2, ChevronDown } from "lucide-react";
import { updateLeadStatusAction, deleteLeadAction } from "./lead-actions";
import { toast } from "sonner";

interface LeadRowActionsProps {
  leadId: string;
  status: string;
}

const getStatusLabel = (s: string) => {
  switch (s) {
    case "new": return "Nuovo";
    case "contacted": return "Contattato";
    case "negotiating": return "In trattativa";
    case "callback": return "Da ricontattare";
    case "closed": return "Chiuso (Firmato)";
    default: return s;
  }
};

export default function LeadRowActions({ leadId, status }: LeadRowActionsProps) {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setLoadingStatus(true);
    try {
      const res = await updateLeadStatusAction(leadId, newStatus);
      if (res.success) {
        toast.success(`Stato aggiornato a "${getStatusLabel(newStatus)}"`);
      } else {
        toast.error(res.error || "Errore durante l'aggiornamento.");
      }
    } catch (err) {
      toast.error("Si è verificato un errore.");
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Sei sicuro di voler eliminare questo contatto?")) return;
    setLoadingDelete(true);
    try {
      const res = await deleteLeadAction(leadId);
      if (res.success) {
        toast.success("Contatto eliminato.");
      } else {
        toast.error(res.error || "Errore durante l'eliminazione.");
      }
    } catch (err) {
      toast.error("Si è verificato un errore.");
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {loadingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-400" />}
      
      <div className="relative inline-block text-left">
        <select
          value={status}
          onChange={(e) => void handleStatusChange(e.target.value)}
          disabled={loadingStatus || loadingDelete}
          className="appearance-none pr-8 pl-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-200 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 cursor-pointer disabled:opacity-50 transition-all hover:bg-slate-900/40"
        >
          <option value="new" className="bg-slate-900 text-slate-200">Nuovo</option>
          <option value="contacted" className="bg-slate-900 text-slate-200">Contattato</option>
          <option value="negotiating" className="bg-slate-900 text-slate-200">In trattativa</option>
          <option value="callback" className="bg-slate-900 text-slate-200">Da ricontattare</option>
          <option value="closed" className="bg-slate-900 text-slate-200">Chiuso (Firmato)</option>
        </select>
        <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-slate-400 pointer-events-none" />
      </div>

      <button
        onClick={() => void handleDelete()}
        disabled={loadingStatus || loadingDelete}
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 transition-all hover:bg-rose-500/20 disabled:opacity-50"
        title="Elimina contatto"
      >
        {loadingDelete ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
