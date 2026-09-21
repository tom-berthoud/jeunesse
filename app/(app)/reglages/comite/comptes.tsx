"use client";

import { useActionState } from "react";
import { changerActivation, changerRole, creerCompte, reinitialiserMotDePasse } from "./actions";
import { ETAT_INITIAL, type EtatAction } from "@/lib/action";
import { Alert, Button, cn, Field, Input } from "@/components/ui";
import type { Tables } from "@/lib/types/database";

function Retour({ etat }: { etat: EtatAction }) {
  if (etat.erreur) return <Alert tone="danger">{etat.erreur}</Alert>;
  if (etat.ok) return <Alert tone="success"><span className="select-all">{etat.ok}</span></Alert>;
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
    <details className={cn("card", !profil.actif && "opacity-60")}>
      <summary className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2">
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">
            {profil.nom} {estMoi && <span className="text-xs font-normal text-ink-faint">(toi)</span>}
          </span>
          <span className="block truncate text-xs text-ink-muted">{email}</span>
        </span>
        {profil.role === "admin" && <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[11px] font-medium text-brand">admin</span>}
        {!profil.actif && <span className="text-[11px] text-ink-faint">désactivé</span>}
        {profil.actif && profil.doit_changer_mdp && <span className="text-[11px] text-ink-faint">jamais connecté</span>}
      </summary>

      <div className="space-y-4 border-t border-line p-4">
        <p className="text-xs text-ink-faint">
          Dernière connexion : {derniereConnexion ? fmt.format(new Date(derniereConnexion)) : "jamais"}
        </p>

        {estMoi ? (
          <p className="text-sm text-ink-muted">Ton propre rôle et ton activation ne se modifient pas ici.</p>
        ) : (
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
              <Field label="Nouveau mot de passe provisoire">
                <div className="flex gap-2">
                  <Input name="password" defaultValue={mdpSuggere} required minLength={8} className="font-mono" />
                  <Button variant="outline" disabled={pMdp}>Définir</Button>
                </div>
              </Field>
              <Retour etat={etatMdp} />
            </form>
          </>
        )}
      </div>
    </details>
  );
}

export function NouveauCompte({ mdpSuggere }: { mdpSuggere: string }) {
  const [etat, action, pending] = useActionState(creerCompte, ETAT_INITIAL);

  return (
    <div className="space-y-2">
      <form action={action} key={etat.ok} className="card space-y-3 p-4">
        <p className="text-sm font-medium">Nouveau compte</p>
        <Field label="Nom">
          <Input name="nom" required maxLength={60} autoComplete="off" />
        </Field>
        <Field label="E-mail">
          <Input name="email" type="email" required autoComplete="off" />
        </Field>
        <Field label="Mot de passe provisoire" hint="À changer à la première connexion">
          <Input name="password" defaultValue={mdpSuggere} required minLength={8} className="font-mono" />
        </Field>
        {etat.erreur && <Alert tone="danger">{etat.erreur}</Alert>}
        <Button disabled={pending} className="w-full">
          {pending ? "Création…" : "Créer le compte"}
        </Button>
      </form>
      {etat.ok && <Alert tone="success"><span className="select-all">{etat.ok}</span></Alert>}
    </div>
  );
}
