-- Nom de catégorie unique sans tenir compte de la casse.
--
-- La page d'un jour réutilise une catégorie existante quand on retape son nom
-- (« rangement fête » retombe sur « Rangement fête »). La base le garantit
-- aussi : sans cet index, Réglages ou deux saisies simultanées pouvaient créer
-- « Char » et « char », deux lignes au classement pour la même chose.
--
-- La contrainte `categories_libelle_key` reste : `seed.sql` s'appuie dessus
-- (`on conflict (libelle)`).

create unique index categories_libelle_casse_key on public.categories (lower(libelle));
