"use client"

import { useMemo, useState } from "react"
import { Download, Save, Search } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useSlaughterhouses, useTrips, useTrucks } from "@/lib/storage"

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

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

  const filteredTrips = useMemo(() => {
    if (!truckId || !destination || !dateFrom) return []
    return trips.filter((trip) => trip.truckId === truckId && trip.destination === destination && trip.date >= dateFrom && trip.date <= paymentDate)
  }, [dateFrom, destination, paymentDate, trips, truckId])

  const grossValue = filteredTrips.reduce((total, trip) => total + (trip.finalValue ?? trip.tableValue ?? 0), 0)
  const rentValue = grossValue * 0.1
  const expectedValue = grossValue - rentValue
  const ready = Boolean(truckId && destination && dateFrom)

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onBack()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Consulte o período do recebimento e confira o resumo financeiro.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4 rounded-lg border bg-muted/30 p-4">
            <div><p className="text-xs text-muted-foreground">Data do pagamento</p><p className="font-semibold">{paymentDate.split("-").reverse().join("/")}</p></div>
            <div className="w-44"><Label htmlFor="payment-date">Alterar data</Label><Input id="payment-date" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} /></div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">1. Filtros do recebimento</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div><Label>Caminhão <span className="text-destructive">*</span></Label><Select value={truckId} onValueChange={setTruckId}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{trucks.filter((truck) => truck.active).map((truck) => <SelectItem key={truck.id} value={truck.id}>{truck.plate}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Frigorífico <span className="text-destructive">*</span></Label><Select value={destination} onValueChange={setDestination}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{slaughterhouses.filter((item) => item.active).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label htmlFor="date-from">Data inicial <span className="text-destructive">*</span></Label><Input id="date-from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></div>
            </CardContent>
          </Card>

          {ready && <Card><CardHeader><CardTitle className="text-base">2. Viagens e lançamentos</CardTitle></CardHeader><CardContent><p className="py-4 text-center text-sm text-muted-foreground">Esta sessão está em construção</p></CardContent></Card>}

          <Card>
            <CardHeader><CardTitle className="text-base">3. Resumo financeiro</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-4"><div><p className="text-sm text-muted-foreground">Valor bruto</p><p className="font-semibold">{money(grossValue)}</p></div><div><p className="text-sm text-muted-foreground">Aluguel de 10%</p><p className="font-semibold text-destructive">- {money(rentValue)}</p></div><div><p className="text-sm text-muted-foreground">Reembolsos e ressarcimentos</p><p className="font-semibold">{money(0)}</p></div><div><p className="text-sm text-muted-foreground">Valor esperado</p><p className="text-lg font-bold">{money(expectedValue)}</p></div></div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="received-value">Valor recebido neste dia</Label><Input id="received-value" inputMode="decimal" placeholder="R$ 0,00" value={receivedValue} onChange={(event) => setReceivedValue(event.target.value)} /></div><div><Label htmlFor="payment-notes">Observação</Label><Textarea id="payment-notes" rows={2} placeholder="Opcional" value={notes} onChange={(event) => setNotes(event.target.value)} /></div></div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter><Button type="button" variant="outline" onClick={() => toast.info("A geração do registro será disponibilizada nesta versão.")}><Download data-icon="inline-start" /> Baixar registro</Button><Button type="button" disabled title="O popup está em construção"><Save data-icon="inline-start" /> Salvar recebimento</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
