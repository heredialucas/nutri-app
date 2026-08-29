"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, CheckCircle, AlertCircle } from "lucide-react";
import { updateMyProfile } from "@/app/actions/patient-portal";

interface ProfileData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string;
    billingType: string;
    gender: string;
    documentNumber: string;
    city: string;
    address: string;
    occupation: string;
    healthInsurance: string;
}

function toDateInput(value?: string | null) {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
}

const inputClass =
    "h-11 px-4 w-full rounded-lg border border-[rgba(0,0,0,0.1)] bg-white text-sm text-[#1a1a1a] outline-none transition-colors focus:border-[#1a1a1a]";

const labelClass = "text-xs font-medium text-[#1a1a1a] uppercase tracking-[0.05em]";

export function ProfileForm({ profile }: { profile: Partial<ProfileData> }) {
    const router = useRouter();
    const [form, setForm] = useState({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        birthDate: toDateInput(profile.birthDate),
        billingType: profile.billingType || "particular",
        gender: profile.gender || "",
        documentNumber: profile.documentNumber || "",
        city: profile.city || "",
        address: profile.address || "",
        occupation: profile.occupation || "",
        healthInsurance: profile.healthInsurance || "",
    });
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (status !== "idle") setStatus("idle");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.phone.trim()) {
            setStatus("error");
            setMessage("El teléfono es obligatorio para reservar turnos.");
            return;
        }
        setStatus("loading");
        setMessage("");
        try {
            await updateMyProfile({
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                phone: form.phone,
                birthDate: form.birthDate || undefined,
                billingType: form.billingType,
                gender: form.gender || undefined,
                documentNumber: form.documentNumber || undefined,
                city: form.city || undefined,
                address: form.address || undefined,
                occupation: form.occupation || undefined,
                healthInsurance: form.healthInsurance || undefined,
            });
            setStatus("success");
            setMessage("Datos guardados correctamente.");
            router.refresh();
        } catch (e) {
            setStatus("error");
            setMessage(e instanceof Error ? e.message : "Error al guardar los datos.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="firstName" className={labelClass}>
                        Nombre *
                    </label>
                    <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={form.firstName}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="lastName" className={labelClass}>
                        Apellido *
                    </label>
                    <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={form.lastName}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className={labelClass}>
                    Email *
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className={inputClass}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className={labelClass}>
                    Teléfono *
                </label>
                <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="Ej: 381 670-9189"
                    value={form.phone}
                    onChange={handleChange}
                    className={inputClass}
                />
                <p className="text-xs text-[#999] m-0">
                    Necesario para gestionar tus turnos.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="birthDate" className={labelClass}>
                        Fecha de nacimiento
                    </label>
                    <input
                        id="birthDate"
                        name="birthDate"
                        type="date"
                        value={form.birthDate}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="documentNumber" className={labelClass}>
                        DNI
                    </label>
                    <input
                        id="documentNumber"
                        name="documentNumber"
                        type="text"
                        inputMode="numeric"
                        value={form.documentNumber}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="gender" className={labelClass}>
                        Género
                    </label>
                    <select
                        id="gender"
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        className={inputClass}
                    >
                        <option value="">Sin especificar</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Otro">Otro</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="billingType" className={labelClass}>
                        Obra social / Particular
                    </label>
                    <select
                        id="billingType"
                        name="billingType"
                        value={form.billingType}
                        onChange={handleChange}
                        className={inputClass}
                    >
                        <option value="particular">Particular</option>
                        <option value="obra_social">Obra social</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="city" className={labelClass}>
                        Ciudad
                    </label>
                    <input
                        id="city"
                        name="city"
                        type="text"
                        value={form.city}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="occupation" className={labelClass}>
                        Ocupación
                    </label>
                    <input
                        id="occupation"
                        name="occupation"
                        type="text"
                        value={form.occupation}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="address" className={labelClass}>
                        Dirección
                    </label>
                    <input
                        id="address"
                        name="address"
                        type="text"
                        value={form.address}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="healthInsurance" className={labelClass}>
                        Obra social (nombre)
                    </label>
                    <input
                        id="healthInsurance"
                        name="healthInsurance"
                        type="text"
                        placeholder="Ej: OSDE, IOMA..."
                        value={form.healthInsurance}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>
            </div>

            {status === "success" && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                    <CheckCircle size={16} />
                    {message}
                </div>
            )}

            {status === "error" && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    <AlertCircle size={16} />
                    {message}
                </div>
            )}

            <button
                type="submit"
                disabled={status === "loading"}
                className="mt-4 inline-flex items-center justify-center gap-2 h-11 px-8 rounded-lg bg-[#1a1a1a] text-white text-sm font-semibold transition-colors hover:bg-[#333] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {status === "loading" ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <Save size={16} />
                )}
                Guardar cambios
            </button>
        </form>
    );
}