"use client";

import { cn } from "@/lib/utils";
import {
  getActivationSession,
  lookupAccountByDni,
  registerOrActivateAccount,
} from "@/app/actions/activation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Loader2 } from "lucide-react";

type View = "loading" | "dni" | "password" | "already";

function SignUpFormInner() {
  const searchParams = useSearchParams();
  const preDni = searchParams.get("dni") || "";
  const router = useRouter();

  const [view, setView] = useState<View>("loading");
  const [dni, setDni] = useState(preDni);
  const [firstName, setFirstName] = useState(searchParams.get("firstName") || "");
  const [lastName, setLastName] = useState(searchParams.get("lastName") || "");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Detecta si viene de una reserva (cookie de activación)
  useEffect(() => {
    let active = true;
    getActivationSession()
      .then((session) => {
        if (!active) return;
        if (session.pending) {
          setDni(session.dni);
          if (session.firstName) setFirstName(session.firstName);
          if (session.lastName) setLastName(session.lastName);
          setView("password");
        } else if (preDni) {
          setView("dni");
          void runLookup(preDni);
        } else {
          setView("dni");
        }
      })
      .catch(() => {
        if (active) setView("dni");
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runLookup = async (value: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await lookupAccountByDni(value);
      if (!result.found) {
        setView("password");
        return;
      }
      if (result.alreadyActive) {
        setView("already");
        return;
      }
      if (result.firstName) setFirstName(result.firstName);
      if (result.lastName) setLastName(result.lastName);
      setView("password");
    } catch {
      setError("No pudimos verificar el DNI. Reintentá.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDniSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni.trim()) {
      setError("Ingresá tu DNI.");
      return;
    }
    await runLookup(dni);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await registerOrActivateAccount({
        dni,
        firstName,
        lastName,
        password,
      });
      if (result?.error) throw new Error(result.error);
      router.push(result.redirectTo || "/paciente/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  if (view === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
      </div>
    );
  }

  const title =
    view === "password" ? "Creá tu contraseña" : "Crear cuenta";

  const description =
    view === "password"
      ? "Completá tus datos y elegí una contraseña. Vas a ingresar siempre con tu DNI."
      : view === "already"
        ? "Ese DNI ya tiene una cuenta activa."
        : "Ingresá tu DNI para empezar.";

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {view === "already" ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground m-0">
                El DNI {dni} ya tiene una cuenta activa. Iniciá sesión con tu contraseña.
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/login">Iniciar sesión</Link>
              </Button>
              <p className="text-sm text-muted-foreground m-0 text-center">
                ¿Olvidaste tu contraseña?{" "}
                <Link href="/auth/forgot-password" className="underline underline-offset-4">
                  Recuperala
                </Link>
              </p>
            </div>
          ) : view === "dni" ? (
            <form onSubmit={handleDniSubmit} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  type="text"
                  inputMode="numeric"
                  placeholder="Sin puntos"
                  required
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verificando..." : "Continuar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  type="text"
                  inputMode="numeric"
                  value={dni}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">Repetir contraseña</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
            </form>
          )}

          {view !== "already" && (
            <div className="mt-4 text-center text-sm">
              ¿Ya tenés una cuenta?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Iniciar sesión
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Cargando...</div>}>
        <SignUpFormInner />
      </Suspense>
    </div>
  );
}
