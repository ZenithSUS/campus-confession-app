export function shuffleData<T>(data: T[], seed: number) {
  return [...data].sort(() => seed);
}
