import { adjectives } from "@/data/adjectives";
import { animals } from "@/data/animals";
import { User } from "./types";

export function assignName(processedUsers: User[]) {
  // Generate a random name
  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(Math.random() * 900 + 100);
  let name = `${randomAdjective} ${randomAnimal}${number}`;

  if (processedUsers.length === 0) return name;

  while (processedUsers.some((user) => user.name === name)) {
    name = `${randomAdjective} ${randomAnimal}${number}`;
  }

  return name;
}
