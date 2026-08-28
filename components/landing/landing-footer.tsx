import Link from "next/link";
import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="py-10 px-[clamp(20px,5vw,80px)] bg-[#0c0c0e] border-t border-[rgba(255,255,255,0.06)]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col">
          <Link href="/" className="no-underline">
            <Image
              src="/images/iconMauroAcostaWhite.png"
              alt="Mauro Acosta"
              width={688}
              height={363}
              className="h-[22px] w-auto"
            />
          </Link>
          <span className="text-[rgba(255,255,255,0.3)] text-xs mt-1.5">
            Gestión nutricional
          </span>
        </div>

        <nav className="flex items-center gap-6">
          <a href="#servicios" className="text-[rgba(255,255,255,0.4)] text-xs no-underline transition-colors hover:text-white">
            Servicios
          </a>
          <a href="#calculadora" className="text-[rgba(255,255,255,0.4)] text-xs no-underline transition-colors hover:text-white">
            Calculadora
          </a>
          <a href="#como-trabajo" className="text-[rgba(255,255,255,0.4)] text-xs no-underline transition-colors hover:text-white">
            Cómo trabajo
          </a>
          <a href="#contacto" className="text-[rgba(255,255,255,0.4)] text-xs no-underline transition-colors hover:text-white">
            Contacto
          </a>
          <Link href="/auth/login" className="text-[rgba(255,255,255,0.4)] text-xs no-underline transition-colors hover:text-white">
            Iniciar sesión
          </Link>
        </nav>

        <p className="text-[rgba(255,255,255,0.2)] text-xs m-0">
          &copy; {new Date().getFullYear()} Mauro Acosta
        </p>
      </div>
    </footer>
  );
}
