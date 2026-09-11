"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Loader2 } from "lucide-react";
import { useBooking } from "@/components/booking/booking-context";
import { getPublicLocations } from "@/app/actions/public-booking";

interface PublicLocation {
  id: string;
  name: string;
  address: string;
}

const isComplete = (v: string, placeholder?: string) =>
  !!v && v.trim() !== "" && v.trim() !== placeholder;

export default function SedePage() {
  const { data, setLocation, loggedPatient } = useBooking();
  const router = useRouter();
  const [locations, setLocations] = useState<PublicLocation[]>([]);
  const [selected, setSelected] = useState<string>(data.locationId || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const patientDataComplete = !!(
    loggedPatient &&
    isComplete(data.firstName, "Sin nombre") &&
    isComplete(data.lastName, "Sin apellido") &&
    isComplete(data.email) &&
    isComplete(data.phone)
  );

  useEffect(() => {
    if (data.type === "ONLINE") {
      router.replace(patientDataComplete ? "/reservar/horario" : "/reservar/datos");
    }
  }, [data.type, patientDataComplete, router]);

  useEffect(() => {
    async function load() {
      try {
        const result = await getPublicLocations();
        setLocations(result);
        if (result.length === 0) {
          setError("Todavía no hay sedes disponibles. Contactanos para coordinar tu turno.");
        }
      } catch {
        setError("No pudimos cargar las sedes. Intentá de nuevo.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const continueWith = (locationId: string, name: string, address: string) => {
    setLocation(locationId, name, address);
    router.push(patientDataComplete ? "/reservar/horario" : "/reservar/datos");
  };

  const handleContinue = () => {
    const found = locations.find((l) => l.id === selected);
    if (!found) return;
    continueWith(found.id, found.name, found.address);
  };

  const handleSelect = (location: PublicLocation) => {
    setSelected(location.id);
    continueWith(location.id, location.name, location.address);
  };

  if (data.type === "ONLINE") {
    return (
      <div className="text-center py-12 text-sm text-[#999]">Redirigiendo...</div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 m-0">
        Elegí la sede
      </h1>
      <p className="text-sm text-[#666] mb-8 m-0">
        Seleccioná dónde querés atenderte.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-sm text-[#999]">
          <Loader2 size={16} className="animate-spin" />
          Cargando sedes...
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-sm text-[#999] m-0">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {locations.map((location) => (
              <button
                key={location.id}
                onClick={() => handleSelect(location)}
                className={`group flex flex-col items-start gap-4 p-6 rounded-xl border bg-white transition-all duration-300 text-left cursor-pointer ${
                  selected === location.id
                    ? "border-[#1a1a1a] shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
                    : "border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.15)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[rgba(0,0,0,0.03)] flex items-center justify-center transition-colors duration-300 group-hover:bg-[rgba(0,0,0,0.06)]">
                  <Building2 size={22} strokeWidth={1.5} className="text-[#1a1a1a]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1a1a1a] m-0 mb-1">
                    {location.name}
                  </h3>
                  <p className="text-sm text-[#666] m-0 leading-relaxed flex items-start gap-1.5">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-[#999]" />
                    {location.address}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => router.push("/reservar")}
              className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-[rgba(0,0,0,0.1)] text-sm font-medium text-[#666] transition-colors hover:bg-[rgba(0,0,0,0.02)] cursor-pointer"
            >
              Volver
            </button>
            <button
              onClick={handleContinue}
              disabled={!selected}
              className={`inline-flex items-center justify-center h-11 px-8 rounded-lg text-sm font-semibold transition-colors flex-1 cursor-pointer ${
                selected
                  ? "bg-[#1a1a1a] text-white hover:bg-[#333]"
                  : "bg-[rgba(0,0,0,0.06)] text-[#999] cursor-not-allowed"
              }`}
            >
              Continuar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
