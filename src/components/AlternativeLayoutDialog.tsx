"use client"

import { useMemo, useState } from "react"
import { Code2, Download, Save } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useSlaughterhouses, useTrips, useTrucks } from "@/lib/storage"

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const tabs = ["Viagens", "Abastecimentos", "Manutenções", "Pedágios", "Descontos", "Reembolsos"]

export function AlternativeLayoutDialog({ open, title, onBack }: { open: boolean; title: string; onBack: () => void }) {
  const [trucks] = useTrucks()
  const [slaughterhouses] = useSlaughterhouses()
  const [trips] = useTrips()
  const [truckId, setTruckId] = useState("")
  const [destination, setDestination] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [receivedValue, setReceivedValue] = useState("")
  const [notes, setNotes] = useState("")
  const [activeTab, setActiveTab] = useState("Viagens")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [tripEdits, setTripEdits] = useState<Record<string, { cte: string; minuta: string }>>({})
  const [jsonOpen, setJsonOpen] = useState(false)

  const filteredTrips = useMemo(() => {
    if (!truckId || !destination) return []
    return trips.filter((trip) => trip.truckId === truckId && trip.destination === destination && (!dateFrom || trip.date >= dateFrom) && trip.date <= paymentDate)
  }, [dateFrom, destination, paymentDate, trips, truckId])
  const selectedTrips = filteredTrips.filter((trip) => selectedIds.includes(trip.id))
  const grossValue = selectedTrips.reduce((total, trip) => total + (trip.tableValue ?? trip.finalValue ?? 0), 0)
  const rentValue = grossValue * 0.1
  const expectedValue = grossValue - rentValue
  const ready = Boolean(truckId && destination)
  const jsonValue = { date: paymentDate, destination, tripIds: selectedTrips.map((trip) => trip.id), trips: selectedTrips.map((trip) => ({ ...trip, cte: tripEdits[trip.id]?.cte ?? trip.cte, minuta: tripEdits[trip.id]?.minuta ?? trip.minuta })), grossValue, rentValue, reimbursedValue: 0, expectedValue, receivedValue: Number(receivedValue.replace(",", ".")) || 0, notes }

  const toggleTrip = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const editTrip = (id: string, key: "cte" | "minuta", value: string) => setTripEdits((current) => ({ ...current, [id]: { cte: current[id]?.cte ?? trips.find((trip) => trip.id === id)?.cte ?? "", minuta: current[id]?.minuta ?? trips.find((trip) => trip.id === id)?.minuta ?? "", [key]: value } }))

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onBack()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Selecione as viagens incluídas neste recebimento e confira o resumo.</DialogDescription></DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4 rounded-lg border bg-muted/30 p-4"><div><p className="text-xs text-muted-foreground">Data do pagamento</p><button type="button" className="font-semibold underline-offset-2 hover:underline" onClick={() => { const value = window.prompt("Editar data do pagamento", paymentDate); if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) setPaymentDate(value) }}>{paymentDate.split("-").reverse().join("/")}</button></div></div>
          <Card><CardContent className="grid gap-4 pt-6 sm:grid-cols-3"><div><Label>Caminhão <span className="text-destructive">*</span></Label><Select value={truckId} onValueChange={(value) => { setTruckId(value); setSelectedIds([]) }}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{trucks.map((truck) => <SelectItem key={truck.id} value={truck.id}>{truck.plate}{truck.name ? ` — ${truck.name}` : ""}</SelectItem>)}</SelectContent></Select></div><div><Label>Frigorífico <span className="text-destructive">*</span></Label><Select value={destination} onValueChange={(value) => { setDestination(value); setSelectedIds([]) }}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{slaughterhouses.filter((item) => item.active).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="date-from">Data inicial</Label><Input id="date-from" type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setSelectedIds([]) }} /></div></CardContent></Card>
          {ready && <Card><CardHeader><div className="flex flex-wrap gap-2">{tabs.map((tab) => <Button key={tab} type="button" size="sm" variant={activeTab === tab ? "secondary" : "ghost"} onClick={() => setActiveTab(tab)}>{tab}</Button>)}</div></CardHeader><CardContent>{activeTab !== "Viagens" ? <p className="py-8 text-center text-sm text-muted-foreground">Esta sessão está em construção</p> : <div className="space-y-3">{filteredTrips.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{dateFrom ? "Nenhuma viagem encontrada no período." : "Informe uma data inicial ou selecione as viagens disponíveis até a data do pagamento."}</p> : filteredTrips.map((trip) => { const edit = tripEdits[trip.id] ?? { cte: trip.cte ?? "", minuta: trip.minuta ?? "" }; const bruto = trip.tableValue ?? trip.finalValue ?? 0; const liquido = trip.finalValue ?? bruto; return <div key={trip.id} className="flex items-center gap-3 rounded-xl border px-3 py-3 text-sm"><div className="flex w-full items-start gap-3"><Checkbox className="mt-1" checked={selectedIds.includes(trip.id)} onCheckedChange={() => toggleTrip(trip.id)} />{selectedIds.includes(trip.id) && <Input className="w-32 shrink-0" inputMode="decimal" aria-label={`Valor recebido da viagem ${trip.id}`} placeholder={money(liquido)} value={receivedValue} onChange={(event) => setReceivedValue(event.target.value)} />}<div className="min-w-0 flex-1"><div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="truncate font-medium">{trip.origin} → {slaughterhouses.find((item) => item.id === trip.destination)?.name ?? trip.destination}</p><p className="truncate text-xs text-muted-foreground">{trip.date} • {trucks.find((truck) => truck.id === trip.truckId)?.plate ?? "Caminhão"} • {trip.distance ?? 0} km</p></div><div className="shrink-0 text-left sm:text-right"><p className="text-xs text-muted-foreground">Líquido</p><p className="font-semibold">{money(liquido)}</p><p className="font-semibold text-primary">{money(liquido)}</p></div></div><div className="mt-2 flex flex-wrap items-center gap-2 text-xs">{edit.cte ? <button type="button" className="text-primary underline-offset-2 hover:underline" onClick={() => { const value = window.prompt("Editar CTe", edit.cte); if (value !== null) editTrip(trip.id, "cte", value) }}>CTe: {edit.cte}</button> : <button type="button" className="text-primary underline-offset-2 hover:underline" onClick={() => { const value = window.prompt("Informar CTe", ""); if (value !== null) editTrip(trip.id, "cte", value) }}>Adicionar CTe</button>}<span>Bruto: {money(bruto)}</span>{edit.minuta ? <button type="button" className="text-primary underline-offset-2 hover:underline" onClick={() => { const value = window.prompt("Editar Minuta", edit.minuta); if (value !== null) editTrip(trip.id, "minuta", value) }}>Minuta: {edit.minuta}</button> : null}</div></div></div></div> })}</div>}</CardContent></Card>}
          <Card><CardContent className="flex flex-col gap-4 pt-6"><div className="grid gap-3 sm:grid-cols-4"><div><p className="text-sm text-muted-foreground">Valor bruto</p><p className="font-semibold">{money(grossValue)}</p></div><div><p className="text-sm text-muted-foreground">Aluguel de 10%</p><p className="font-semibold text-destructive">- {money(rentValue)}</p></div><div><p className="text-sm text-muted-foreground">Reembolsos e ressarcimentos</p><p className="font-semibold">{money(0)}</p></div><div><p className="text-sm text-muted-foreground">Valor esperado</p><p className="text-lg font-bold">{money(expectedValue)}</p></div></div><Separator /><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="received-value">Valor recebido neste dia</Label><Input id="received-value" inputMode="decimal" placeholder="Se vazio, usa o valor líquido" value={receivedValue} onChange={(event) => setReceivedValue(event.target.value)} /></div><div><Label htmlFor="payment-notes">Observação</Label><Textarea id="payment-notes" rows={2} placeholder="Opcional" value={notes} onChange={(event) => setNotes(event.target.value)} /></div></div></CardContent></Card>
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => toast.info("A geração do registro será disponibilizada nesta versão.")}><Download data-icon="inline-start" /> Baixar registro</Button><Button type="button" variant="outline" size="icon" aria-label="Exibir JSON do recebimento" title="Exibir JSON" onClick={() => setJsonOpen(true)}><Code2 /></Button><Button type="button" disabled title="O popup está em construção"><Save data-icon="inline-start" /> Salvar recebimento</Button></DialogFooter>
      </DialogContent>
      <Dialog open={jsonOpen} onOpenChange={setJsonOpen}><DialogContent><DialogHeader><DialogTitle>JSON do recebimento</DialogTitle></DialogHeader><pre className="max-h-[55vh] overflow-auto rounded-lg bg-muted p-4 text-xs">{JSON.stringify(jsonValue, null, 2)}</pre></DialogContent></Dialog>
    </Dialog>
  )
}
