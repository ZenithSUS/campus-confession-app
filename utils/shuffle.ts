export function shuffleData<T>(data: T[]) {
  return [...data].sort(() => Math.random() - 0.5);
}
