import { LoginForm } from "@/components/login-form";
import { getCurrentUser, isPatientUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Page({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const { reset } = await searchParams;
  const user = await getCurrentUser();
  if (user) {
    if (isPatientUser(user)) {
      redirect("/paciente/dashboard");
    }
    redirect("/dashboard/users");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </Link>
        </div>
         <LoginForm resetSuccess={reset === "success"} />
      </div>
    </div>
  );
}
