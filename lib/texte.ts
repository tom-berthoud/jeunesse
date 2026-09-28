/** Pour comparer sans tenir compte de la casse ni des accents (« zoe » trouve « Zoé »). */
export const normaliser = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
