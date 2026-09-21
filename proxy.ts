import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Tout sauf les fichiers statiques. `icon` couvre la favicon générée depuis
    // app/icon.png, dont l'URL n'a pas d'extension.
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.json|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
