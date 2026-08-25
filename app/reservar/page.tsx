import Link from "next/link";

const types = [
  {
    id: "first",
    title: "Primera consulta",
    description: "Evaluación completa, antecedentes y plan de acción inicial.",
    icon: "01",
  },
  {
    id: "follow_up",
    title: "Seguimiento",
    description: "Control periódico, ajustes y acompanhamiento continuo.",
    icon: "02",
  },
  {
    id: "online",
    title: "Consulta online",
    description: "Por videollamada, con la misma cercanía y calidad.",
    icon: "03",
  },
  {
    id: "in_person",
    title: "Consulta presencial",
    description: "En el consultorio, con mediciones antropométricas.",
    icon: "04",
  },
];

export default function ReservarPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 m-0">
        ¿Qué tipo de consulta necesitás?
      </h1>
      <p className="text-sm text-[#666] mb-8 m-0">
        Elegí la opción que mejor se adapte a tu situación.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {types.map((type) => (
          <Link
            key={type.id}
            href={`/reservar/datos?type=${type.id}`}
            className="group flex flex-col gap-4 p-6 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white no-underline transition-all duration-300 hover:border-[rgba(0,0,0,0.15)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
          >
            <span className="text-[rgba(0,0,0,0.1)] text-3xl font-bold leading-none">
              {type.icon}
            </span>
            <div>
              <h3 className="text-base font-semibold text-[#1a1a1a] m-0 mb-1 group-hover:text-[#1a1a1a]">
                {type.title}
              </h3>
              <p className="text-sm text-[#666] m-0 leading-relaxed">
                {type.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
