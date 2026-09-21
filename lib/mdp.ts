import "server-only";
import { randomInt } from "node:crypto";

// Sans 0/O, 1/l/i : le mot de passe provisoire se dicte ou se recopie depuis un message.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Mot de passe provisoire lisible, p. ex. « k7mq-x3fa-9hwt » (≈ 59 bits). */
export function motDePasseProvisoire() {
  const bloc = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${bloc()}-${bloc()}-${bloc()}`;
}
