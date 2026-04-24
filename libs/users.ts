export type User = {
  id: string;
  name: string;
  email: string;
};

export const SEED_USERS: User[] = [
  { id: "u1", name: "Mate Oqroshiashvili", email: "mate@academy.test" },
  { id: "u2", name: "Nino Beridze", email: "nino@academy.test" },
  { id: "u3", name: "Giorgi Kapanadze", email: "giorgi@academy.test" },
  { id: "u4", name: "Ana Tsulaia", email: "ana@academy.test" },
  { id: "u5", name: "Luka Tabatadze", email: "luka@academy.test" },
];
