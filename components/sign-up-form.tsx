"use client";

import { cn } from "@/lib/utils";
import {
  activateAccount,
  getActivationSession,
  lookupAccountByDni,
  registerNewAccount,
  requestActivationCode,
  verifyActivationCode,
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

type View = "loading" | "dni" | "new" | "email" | "code" | "password" | "already";

function SignUpFormInner() {
  const searchParams = useSearchParams();
  const preDni = searchParams.get("dni") || "";
  const router = useRouter();

  const [view, setView] = useState<View>("loading");
  const [dni, setDni] = useState(preDni);
  const [firstName, setFirstName] = useState(searchParams.get("firstName") || "");
  const [lastName, setLastName] = useState(searchParams.get("lastName") || "");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [emailMasked, setEmailMasked] = useState<string | null>(null);
  const [hasEmail, setHasEmail] = useState(false);
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
          setEmailMasked(session.emailMasked);
          setView("password");
        } else if (preDni) {
          setView("dni");
          void runLookup(preDni);
        } else {
          setView("dni");
        }
      })
      .catch(() => {
        if (active) setView(preDni ? "dni" : "dni");
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
        setView("new");
        return;
      }
      if (result.alreadyActive) {
        setView("already");
        return;
      }
      if (result.firstName) setFirstName(result.firstName);
      if (result.lastName) setLastName(result.lastName);
      setHasEmail(result.hasEmail);
      setEmailMasked(result.emailMasked);
      setView("email");
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

  const handleNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await registerNewAccount({ dni, firstName, lastName, password });
      if (result?.error) throw new Error(result.error);
      router.push(result.redirectTo || "/paciente/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await requestActivationCode(dni, hasEmail ? undefined : email);
      if (result?.error) throw new Error(result.error);
      if (result.emailMasked) setEmailMasked(result.emailMasked);
      setView("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await verifyActivationCode(dni, code, hasEmail ? undefined : email);
      if (result?.error) throw new Error(result.error);
      setView("password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await activateAccount({ password, firstName, lastName });
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
    view === "password"
      ? "Creá tu contraseña"
      : view === "code"
        ? "Ingresá el código"
        : view === "email"
          ? "Verificá tu email"
          : "Crear cuenta";

  const description =
    view === "password"
      ? "Con tu DNI y esta contraseña vas a poder entrar siempre."
      : view === "code"
        ? `Enviamos un código de 6 dígitos a ${emailMasked ?? "tu email"}.`
        : view === "email"
          ? "Ya tenés una ficha con nosotros. Verificá tu identidad para activar tu cuenta."
          : view === "new"
            ? "No encontramos tu DNI. Completá tus datos para crear la cuenta."
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
          ) : view === "new" ? (
            <form onSubmit={handleNewSubmit} className="flex flex-col gap-4">
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
          ) : view === "email" ? (
            <div className="flex flex-col gap-4">
              {hasEmail ? (
                <p className="text-sm m-0">
                  Vamos a enviar el código a <strong>{emailMasked}</strong>.
                </p>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button onClick={handleRequestCode} className="w-full" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar código"}
              </Button>
            </div>
          ) : view === "code" ? (
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Código de 6 dígitos</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verificando..." : "Verificar código"}
              </Button>
              <button
                type="button"
                onClick={handleRequestCode}
                disabled={isLoading}
                className="text-sm text-muted-foreground underline underline-offset-4"
              >
                Reenviar código
              </button>
            </form>
          ) : (
            <form onSubmit={handleActivate} className="flex flex-col gap-4">
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
                {isLoading ? "Activando..." : "Activar cuenta"}
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
