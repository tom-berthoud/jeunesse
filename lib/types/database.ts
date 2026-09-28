// Types de la base, écrits à la main d'après supabase/migrations/.
// Même format que `supabase gen types typescript` : à régénérer par l'outil
// dès que la CLI est reliée au projet, et à tenir à jour à chaque migration.

type FK<Name extends string, Col extends string, Ref extends string> = {
  foreignKeyName: Name;
  columns: [Col];
  isOneToOne: false;
  referencedRelation: Ref;
  referencedColumns: ["id"];
};

export type RoleComite = "admin" | "comite";
export type StatutMembre = "actif" | "passif";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nom: string;
          role: RoleComite;
          actif: boolean;
          doit_changer_mdp: boolean;
          created_at: string;
        };
        Insert: never; // créé par le déclencheur on_auth_user_created
        // `authenticated` n'a le droit d'écrire que nom et doit_changer_mdp ;
        // role et actif passent par le client admin (clé secrète).
        Update: { nom?: string; role?: RoleComite; actif?: boolean; doit_changer_mdp?: boolean };
        Relationships: [];
      };
      membres: {
        Row: {
          id: string;
          prenom: string;
          nom: string;
          statut: StatutMembre;
          archive: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          prenom: string;
          nom: string;
          statut?: StatutMembre;
          archive?: boolean;
        };
        Update: {
          prenom?: string;
          nom?: string;
          statut?: StatutMembre;
          archive?: boolean;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          libelle: string;
          couleur: string;
          ordre: number;
          archivee: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          libelle: string;
          couleur?: string;
          ordre?: number;
          archivee?: boolean;
        };
        Update: {
          libelle?: string;
          couleur?: string;
          ordre?: number;
          archivee?: boolean;
        };
        Relationships: [];
      };
      seances: {
        Row: {
          id: string;
          date: string;
          categorie_id: string;
          remarque: string | null;
          poids: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          categorie_id: string;
          remarque?: string | null;
          poids?: number;
        };
        // `authenticated` n'a le droit d'écrire que la remarque et le poids.
        Update: { remarque?: string | null; poids?: number };
        Relationships: [
          FK<"seances_categorie_id_fkey", "categorie_id", "categories">,
          FK<"seances_created_by_fkey", "created_by", "profiles">,
        ];
      };
      presences: {
        Row: {
          seance_id: string;
          membre_id: string;
          added_by: string;
          added_at: string;
          poids: number | null;
        };
        Insert: { seance_id: string; membre_id: string; poids?: number | null };
        // Seule colonne accordée en UPDATE (migration 0004).
        Update: { poids?: number | null };
        Relationships: [
          FK<"presences_seance_id_fkey", "seance_id", "seances">,
          FK<"presences_membre_id_fkey", "membre_id", "membres">,
          FK<"presences_added_by_fkey", "added_by", "profiles">,
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      compteur: {
        Args: { p_debut: string; p_fin: string; p_categorie?: string | null };
        Returns: {
          membre_id: string;
          prenom: string;
          nom: string;
          statut: StatutMembre;
          archive: boolean;
          // numeric : somme des poids des séances, donc 2.5 possible.
          presences: number;
        }[];
      };
      is_admin: { Args: never; Returns: boolean };
      is_comite: { Args: never; Returns: boolean };
    };
    Enums: {
      role_comite: RoleComite;
      statut_membre: StatutMembre;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
