"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { savePatientAnamnesis, type AnamnesisInput } from "@/app/actions/anamnesis";
import { toast } from "sonner";

type Data = Partial<AnamnesisInput> & { status?: string; nextControl?: string | null };
type SaveAction = (data: AnamnesisInput) => Promise<unknown>;

export function AnamnesisForm({ patientId, initialData, patientMode = false, onSave }: { patientId: string; initialData?: Data | null; patientMode?: boolean; onSave?: SaveAction }) {
  const [form, setForm] = useState<Data>(initialData || {});
  const [saving, setSaving] = useState(false);
  const set = (key: keyof AnamnesisInput, value: string | boolean | number) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await (onSave ? onSave(form as AnamnesisInput) : savePatientAnamnesis(patientId, form as AnamnesisInput));
      toast.success(patientMode ? "Anamnesis enviada" : "Anamnesis guardada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar");
    } finally { setSaving(false); }
  };

  return <form onSubmit={submit} className="space-y-5">
    <Card className="border-emerald-100 bg-emerald-50/40"><CardContent className="p-4 text-sm leading-relaxed text-emerald-950">Completá la información por partes. No hace falta responder todo de una vez. Estos datos ayudan a personalizar tu acompañamiento nutricional.</CardContent></Card>
    <Accordion type="multiple" defaultValue={["consulta", "preferencias"]} className="space-y-3">
      <Section value="consulta" title="Consulta y alimentación" description="Motivo, objetivos y rutina alimentaria habitual">
        <div className="grid gap-4 md:grid-cols-2"><TextField label="Motivo principal de consulta" value={form.consultationReason} set={(v) => set("consultationReason", v)} /><TextField label="Objetivo principal" value={form.mainObjective} set={(v) => set("mainObjective", v)} /><Field label="Comidas por día" value={String(form.mealsPerDay ?? "")} set={(v) => set("mealsPerDay", v)} /><Field label="Agua aproximada (L/día)" value={String(form.waterIntake ?? "")} set={(v) => set("waterIntake", v)} /></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">{[["breakfast", "Desayuno habitual", "¿Qué solés desayunar?"], ["lunch", "Almuerzo habitual", "¿Qué comés normalmente?"], ["snack", "Merienda habitual", "¿Qué solés merendar?"], ["dinner", "Cena habitual", "¿Qué solés cenar?"], ["snacksDrinks", "Colaciones, picoteos y bebidas", "Incluí bebidas, dulces o picoteos"]].map(([key, label, placeholder]) => <TextField key={key} label={label} placeholder={placeholder} value={form[key as keyof AnamnesisInput]} set={(v) => set(key as keyof AnamnesisInput, v)} />)}</div>
      </Section>
      <Section value="preferencias" title="Gustos y preferencias" description="Para diseñar un plan realista y sostenible">
        <div className="grid gap-4 md:grid-cols-2"><TextField label="Alimentos que te gustan y querés mantener" value={form.likedFoods} set={(v) => set("likedFoods", v)} /><TextField label="Alimentos que no te gustan o no consumís" value={form.dislikedFoods} set={(v) => set("dislikedFoods", v)} /><TextField label="Alimentos difíciles de controlar" value={form.difficultFoods} set={(v) => set("difficultFoods", v)} /><BooleanField label="¿Comés fuera de casa?" value={form.eatsOut} set={(v) => set("eatsOut", v)} /><Field label="¿Cuántas veces por semana?" value={String(form.eatsOutFrequency ?? "")} set={(v) => set("eatsOutFrequency", v)} /></div>
      </Section>
      <Section value="actividad" title="Actividad física" description="Movimiento, entrenamiento y objetivos deportivos">
        <div className="grid gap-4 md:grid-cols-2"><BooleanField label="¿Realizás actividad física?" value={form.physicalActivity} set={(v) => set("physicalActivity", v)} /><Field label="Actividad" value={String(form.activityName ?? "")} set={(v) => set("activityName", v)} /><Field label="Días por semana" value={String(form.activityDays ?? "")} set={(v) => set("activityDays", v)} /><Field label="Duración (minutos)" value={String(form.activityDuration ?? "")} set={(v) => set("activityDuration", v)} /><Field label="Horario habitual" value={String(form.activitySchedule ?? "")} set={(v) => set("activitySchedule", v)} /><Field label="Nivel" value={String(form.activityLevel ?? "")} set={(v) => set("activityLevel", v)} /><TextField label="Objetivo deportivo" value={form.sportsObjective} set={(v) => set("sportsObjective", v)} /></div>
      </Section>
      <Section value="bienestar" title="Sueño, estrés y digestión" description="Información cotidiana que puede afectar tu alimentación">
        <div className="grid gap-4 md:grid-cols-2"><Field label="Horas de sueño" value={String(form.sleepHours ?? "")} set={(v) => set("sleepHours", v)} /><Field label="Calidad del descanso" value={String(form.sleepQuality ?? "")} set={(v) => set("sleepQuality", v)} /><Field label="Nivel de estrés" value={String(form.stressLevel ?? "")} set={(v) => set("stressLevel", v)} /><Field label="Nivel de energía" value={String(form.energyLevel ?? "")} set={(v) => set("energyLevel", v)} /><TextField label="Síntomas digestivos" placeholder="Hinchazón, gases, acidez, estreñimiento..." value={form.digestiveSymptoms} set={(v) => set("digestiveSymptoms", v)} /><Field label="Frecuencia intestinal (veces/semana)" value={String(form.bowelFrequency ?? "")} set={(v) => set("bowelFrequency", v)} /><TextField label="Observaciones digestivas" value={form.digestiveNotes} set={(v) => set("digestiveNotes", v)} /></div>
      </Section>
      <Section value="historial" title="Antecedentes y adherencia" description="Contanos qué experiencias pueden ayudarnos a acompañarte mejor">
        <div className="grid gap-4 md:grid-cols-2"><TextField label="Suplementos actuales" value={form.supplements} set={(v) => set("supplements", v)} /><BooleanField label="¿Realizaste dietas anteriormente?" value={form.previousDiets} set={(v) => set("previousDiets", v)} /><TextField label="¿Qué fue lo más difícil de mantener?" value={form.adherenceDifficulty} set={(v) => set("adherenceDifficulty", v)} /><Field label="Disposición al cambio (1–10)" type="number" value={String(form.readinessScore ?? "")} set={(v) => set("readinessScore", Number(v) || 0)} /><TextField label="¿Qué te gustaría lograr en los próximos meses?" value={form.treatmentGoal} set={(v) => set("treatmentGoal", v)} /><TextField label="Primer objetivo acordado" value={form.agreedGoal} set={(v) => set("agreedGoal", v)} /></div>
      </Section>
      {!patientMode && <Section value="profesional" title="Datos profesionales" description="Información reservada para el equipo nutricional"><div className="grid gap-4 md:grid-cols-2"><Field label="Próximo control" type="date" value={String(form.nextControl ?? "")} set={(v) => set("nextControl", v)} /><Field label="Método antropométrico" value={String(form.anthropometryMethod ?? "")} set={(v) => set("anthropometryMethod", v)} /><Field label="Grasa visceral" value={String(form.visceralFat ?? "")} set={(v) => set("visceralFat", v)} /><TextField label="Observaciones privadas" value={form.professionalNotes} set={(v) => set("professionalNotes", v)} /></div></Section>}
    </Accordion>
    <div className="flex justify-end"><Button disabled={saving}>{saving ? "Guardando..." : patientMode ? "Enviar anamnesis" : "Guardar anamnesis"}</Button></div>
  </form>;
}

function Section({ value, title, description, children }: { value: string; title: string; description: string; children: React.ReactNode }) { return <AccordionItem value={value} className="rounded-xl border bg-card px-4"><AccordionTrigger className="py-4 text-left hover:no-underline"><div><p className="font-semibold">{title}</p><p className="mt-0.5 text-xs font-normal text-muted-foreground">{description}</p></div></AccordionTrigger><AccordionContent className="pb-5">{children}</AccordionContent></AccordionItem>; }
function Field({ label, value, set, type = "text" }: { label: string; value: string; set: (value: string) => void; type?: string }) { return <div className="space-y-2"><Label>{label}</Label><Input type={type} value={value} onChange={(event) => set(event.target.value)} /></div>; }
function TextField({ label, value, set, placeholder }: { label: string; value: unknown; set: (value: string) => void; placeholder?: string }) { return <div className="space-y-2 md:col-span-2"><Label>{label}</Label><Textarea rows={2} placeholder={placeholder} value={String(value ?? "")} onChange={(event) => set(event.target.value)} /></div>; }
function BooleanField({ label, value, set }: { label: string; value?: boolean; set: (value: boolean) => void }) { return <div className="space-y-2"><Label>{label}</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value == null ? "" : value ? "true" : "false"} onChange={(event) => { if (event.target.value) set(event.target.value === "true"); }}><option value="">Sin informar</option><option value="true">Sí</option><option value="false">No</option></select></div>; }
