import "server-only";
import { cookies } from "next/headers";

export type Theme = "system" | "light" | "dark";
export const THEME_COOKIE = "theme";

export async function lireTheme(): Promise<Theme> {
  const v = (await cookies()).get(THEME_COOKIE)?.value;
  return v === "light" || v === "dark" ? v : "system";
}
