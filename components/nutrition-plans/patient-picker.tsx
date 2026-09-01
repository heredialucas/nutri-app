"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export interface PickerPatient { id: string; firstName: string; lastName: string; email?: string | null; documentNumber?: string | null }

export function PatientPicker({ patients, selectedIds, onChange, label = "Paciente/s" }: { patients: PickerPatient[]; selectedIds: string[]; onChange: (ids: string[]) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const selected = patients.filter((patient) => selectedIds.includes(patient.id));
  const toggle = (id: string) => onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  return <div className="space-y-2"><div className="flex items-center justify-between"><label className="text-sm font-medium">{label}</label><span className="text-xs text-muted-foreground">{selected.length ? `${selected.length} seleccionado${selected.length === 1 ? "" : "s"}` : "Opcional"}</span></div><Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal"><span className="flex min-w-0 items-center gap-2 truncate"><Users className="size-4 shrink-0 text-muted-foreground" />{selected.length ? selected.map((patient) => `${patient.firstName} ${patient.lastName}`).join(", ") : "Buscar y seleccionar pacientes"}</span><ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-[min(420px,calc(100vw-2rem))] p-0" align="start"><Command><CommandInput placeholder="Buscar por nombre, email o DNI..." /><CommandList><CommandEmpty>No se encontraron pacientes.</CommandEmpty>{patients.map((patient) => { const checked = selectedIds.includes(patient.id); return <CommandItem key={patient.id} value={`${patient.firstName} ${patient.lastName} ${patient.email ?? ""} ${patient.documentNumber ?? ""}`} onSelect={() => toggle(patient.id)}><Check className={`mr-2 size-4 ${checked ? "opacity-100" : "opacity-0"}`} /><span>{patient.firstName} {patient.lastName}</span>{patient.email && <span className="ml-auto text-xs text-muted-foreground">{patient.email}</span>}</CommandItem>; })}</CommandList></Command></PopoverContent></Popover>{selected.length > 0 && <div className="flex flex-wrap gap-1.5">{selected.map((patient) => <Badge key={patient.id} variant="secondary" className="gap-1">{patient.firstName} {patient.lastName}<button type="button" aria-label={`Quitar ${patient.firstName} ${patient.lastName}`} onClick={() => toggle(patient.id)}><X className="size-3" /></button></Badge>)}</div>}<p className="text-xs text-muted-foreground">Podés crear un plan genérico, asignarlo a una persona o seleccionar varias.</p></div>;
}
