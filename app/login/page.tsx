import { Marque } from "@/components/marque";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { suite } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-4 pb-16">
      <Marque />
      <LoginForm suite={typeof suite === "string" ? suite : undefined} />
    </main>
  );
}
