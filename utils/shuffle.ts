export function shuffleData(data: Object[]) {
  return [...data].sort(() => Math.random() - 0.5);
}
