import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { suite } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-2xl font-semibold">JCSD — Présences</h1>
      <LoginForm suite={typeof suite === "string" ? suite : undefined} />
    </main>
  );
}
