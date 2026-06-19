export const BUILT_IN_GUESTS = [
  { username: "Louisa", fullName: "Louisa Xu", isAdmin: true },
  { username: "Anders", fullName: "Anders Ørsted", isAdmin: false },
  { username: "Emma", fullName: "Emma Juan Roug Nielsen", isAdmin: false },
  { username: "Frederik", fullName: "Frederik Hoffmann Bertelsen", isAdmin: false },
  { username: "Gustav", fullName: "Gustav Lunding Smith", isAdmin: false },
  { username: "Julius", fullName: "Julius Winkel", isAdmin: false },
  { username: "Kasper", fullName: "Kasper Petersen", isAdmin: false },
  { username: "Laura", fullName: "Laura Rovsing Meiborg", isAdmin: false },
  { username: "Marie", fullName: "Marie Samsøe", isAdmin: false },
  { username: "Nicolai", fullName: "Nicolai Sode Mikkelsen", isAdmin: false },
  { username: "Maya", fullName: "Maya Findshøj", isAdmin: false }
];

export const EVENT_INFO = {
  title: "Forsinket kandidatfejring",
  host: "Louisa Xu",
  date: "Tirsdag den 7. juli",
  time: "Kl. 13.00 – 21.00",
  address: "Holger Danskes Vej 28, 2000 Frederiksberg"
};

export const ANSWERS = ["Ja", "Måske", "Nej"];

export function normalizeUsername(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/\s+/g, " ");

  if (!cleaned) return "";

  return cleaned
    .split(" ")[0]
    .toLocaleLowerCase("da-DK")
    .replace(/^./, char => char.toLocaleUpperCase("da-DK"));
}

export function expectedPassword(username) {
  return `${username}123`;
}
