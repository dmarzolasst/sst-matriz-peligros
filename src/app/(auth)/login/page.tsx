import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">SST · GTC 45</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900">Matriz de Peligros</h1>
        <p className="mt-1 text-sm text-slate-500">Inicia sesión para continuar.</p>
        <LoginForm />
      </div>
    </div>
  );
}
