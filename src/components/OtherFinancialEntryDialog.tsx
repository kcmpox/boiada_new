import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useSlaughterhouses, useTrucks, useOtherDeductionReimbursements, useActiveTrips, uid, type OtherDeductionReimbursement } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type EntryMode = "reembolso" | "desconto";

export function OtherFinancialEntryDialog({ mode }: { mode: EntryMode }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"diesel" | "outros" | "multa_contratual">(mode === "reembolso" ? "outros" : "multa_contratual");
  const [trucks] = useTrucks();
  const [slaughterhouses] = useSlaughterhouses();
  const [trips] = useActiveTrips();
  const [, setRecords] = useOtherDeductionReimbursements();
  const [form, setForm] = useState({ truckId: "", destination: "", tripId: "", date: new Date().toISOString().slice(0, 10), description: "", amount: "" });
  const title = mode === "reembolso" ? "Novo reembolso" : "Novo desconto";
  const update = (key: string, value: string) => setForm((previous) => ({ ...previous, [key]: value }));
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount.replace(",", "."));
    if (!form.truckId || !form.destination || !form.description.trim() || !Number.isFinite(amount) || amount <= 0) {
      toast.error("Informe caminhão, frigorífico, descrição e um valor positivo.");
      return;
    }
    const record: OtherDeductionReimbursement = { id: uid(), date: form.date, truckId: form.truckId, destination: form.destination, tripId: form.tripId || undefined, type: mode === "reembolso" ? "acrescimo" : "abatimento", category: "outros", amount, description: form.description.trim(), createdAt: new Date().toISOString() };
    setRecords((previous) => [record, ...previous]);
    setOpen(false);
    setForm({ truckId: "", destination: "", tripId: "", date: new Date().toISOString().slice(0, 10), description: "", amount: "" });
    toast.success(`${title} criado.`);
  };
  return <>
    <Button onClick={() => setOpen(true)}><Plus data-icon="inline-start" /> {title}</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Escolha o tipo e preencha os dados do lançamento.</DialogDescription></DialogHeader>
      <div className="flex flex-col gap-4"><div><Label>Tipo de {mode}</Label><Select value={type} onValueChange={(value) => setType(value as typeof type)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{mode === "reembolso" ? <><SelectItem value="diesel">Repasse do diesel</SelectItem><SelectItem value="outros">Outros</SelectItem></> : <><SelectItem value="multa_contratual">Multa Contratual</SelectItem><SelectItem value="outros">Outros</SelectItem></>}</SelectContent></Select></div>
        {type !== "outros" ? <Card className="flex min-h-40 items-center justify-center p-6 text-center"><div><Building2 className="mx-auto mb-3 size-9 text-muted-foreground" /><p className="font-medium">Esta página está em construção.</p></div></Card> : <form onSubmit={save} className="grid gap-4 sm:grid-cols-2"><div><Label>Caminhão</Label><Select value={form.truckId} onValueChange={(value) => update("truckId", value)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{trucks.map((truck) => <SelectItem key={truck.id} value={truck.id}>{truck.plate} — {truck.name}</SelectItem>)}</SelectContent></Select></div><div><Label>Frigorífico</Label><Select value={form.destination} onValueChange={(value) => update("destination", value)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{slaughterhouses.filter((item) => item.active).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div><div><Label>CTe/minuta</Label><Select value={form.tripId || "none"} onValueChange={(value) => update("tripId", value === "none" ? "" : value)}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent><SelectItem value="none">Sem vínculo</SelectItem>{trips.filter((trip) => (!form.truckId || trip.truckId === form.truckId) && (!form.destination || trip.destination === form.destination)).map((trip) => <SelectItem key={trip.id} value={trip.id}>{trip.cte || trip.minuta || trip.id}</SelectItem>)}</SelectContent></Select></div><div><Label>Data</Label><Input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} /></div><div className="sm:col-span-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(event) => update("description", event.target.value)} /></div><div><Label>Valor</Label><Input inputMode="decimal" value={form.amount} onChange={(event) => update("amount", event.target.value)} placeholder="0,00" /></div><DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">Salvar {mode}</Button></DialogFooter></form>}
      </div>
    </DialogContent></Dialog>
  </>;
}
