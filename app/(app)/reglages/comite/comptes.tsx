"use client";

import { useActionState } from "react";
import { changerActivation, changerRole, creerCompte, reinitialiserMotDePasse } from "./actions";
import { ETAT_INITIAL, type EtatAction } from "@/lib/action";
import { Alert, Button, cn, Field, Input, Repli } from "@/components/ui";
import type { Tables } from "@/lib/types/database";

function Retour({ etat }: { etat: EtatAction }) {
  if (etat.erreur) return <Alert>{etat.erreur}</Alert>;
  if (etat.ok)
    return (
      <Alert tone="success">
        <span className="select-all">{etat.ok}</span>
      </Alert>
    );
  return null;
}

const fmt = new Intl.DateTimeFormat("fr-CH", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Zurich" });

export function CompteCard({
  profil,
  email,
  derniereConnexion,
  estMoi,
  mdpSuggere,
}: {
  profil: Tables<"profiles">;
  email: string;
  derniereConnexion: string | null;
  estMoi: boolean;
  mdpSuggere: string;
}) {
  const [etatRole, role, pRole] = useActionState(changerRole, ETAT_INITIAL);
  const [etatAct, activer, pAct] = useActionState(changerActivation, ETAT_INITIAL);
  const [etatMdp, reinit, pMdp] = useActionState(reinitialiserMotDePasse, ETAT_INITIAL);

  return (
    <Repli
      className={cn(!profil.actif && "opacity-60")}
      entete={
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">
              {profil.nom} {estMoi && <span className="text-xs font-normal text-ink-faint">(toi)</span>}
            </span>
            <span className="block truncate text-xs text-ink-muted">{email}</span>
          </span>
          {profil.role === "admin" && (
            <span className="rounded bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-on-accent">admin</span>
          )}
          {!profil.actif && <span className="text-[11px] text-ink-faint">désactivé</span>}
        </>
      }
    >
      <p className="text-xs text-ink-faint">
        Dernière connexion : {derniereConnexion ? fmt.format(new Date(derniereConnexion)) : "jamais"}
      </p>

      {!estMoi && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <form action={role}>
              <input type="hidden" name="id" value={profil.id} />
              <input type="hidden" name="role" value={profil.role === "admin" ? "comite" : "admin"} />
              <Button variant="outline" disabled={pRole} className="w-full">
                {profil.role === "admin" ? "Retirer admin" : "Passer admin"}
              </Button>
            </form>
            <form
              action={activer}
              onSubmit={(e) => {
                if (profil.actif && !confirm(`Désactiver le compte de ${profil.nom} ?`)) e.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={profil.id} />
              <input type="hidden" name="actif" value={String(!profil.actif)} />
              <Button variant={profil.actif ? "danger" : "outline"} disabled={pAct} className="w-full">
                {profil.actif ? "Désactiver" : "Réactiver"}
              </Button>
            </form>
          </div>
          <Retour etat={etatRole} />
          <Retour etat={etatAct} />

          <form action={reinit} className="space-y-2">
            <input type="hidden" name="id" value={profil.id} />
            <Field label="Mot de passe provisoire">
              <div className="flex gap-2">
                <Input name="password" defaultValue={mdpSuggere} required minLength={8} className="font-mono" />
                <Button variant="outline" disabled={pMdp}>
                  Définir
                </Button>
              </div>
            </Field>
            <Retour etat={etatMdp} />
          </form>
        </>
      )}
    </Repli>
  );
}

export function NouveauCompte({ mdpSuggere }: { mdpSuggere: string }) {
  const [etat, action, pending] = useActionState(creerCompte, ETAT_INITIAL);

  return (
    <div className="space-y-2">
      <form action={action} key={etat.ok} className="card space-y-3 p-4">
        <Input name="nom" placeholder="Nom" aria-label="Nom" required maxLength={60} autoComplete="off" />
        <Input name="email" type="email" placeholder="E-mail" aria-label="E-mail" required autoComplete="off" />
        <Field label="Mot de passe provisoire">
          <Input name="password" defaultValue={mdpSuggere} required minLength={8} className="font-mono" />
        </Field>
        {etat.erreur && <Alert>{etat.erreur}</Alert>}
        <Button disabled={pending} className="w-full">
          Créer le compte
        </Button>
      </form>
      {etat.ok && (
        <Alert tone="success">
          <span className="select-all">{etat.ok}</span>
        </Alert>
      )}
    </div>
  );
}
