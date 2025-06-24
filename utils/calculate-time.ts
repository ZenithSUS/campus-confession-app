export function timeDifference(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    if (seconds === 1 || seconds === 0 || seconds < 0) return `${seconds} sec`;
    return `${seconds} secs`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return `${minutes} min`;
    return `${minutes} mins`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    if (hours === 1) return `${hours} hr`;
    return `${hours} hrs`;
  } else {
    const days = Math.floor(seconds / 86400);
    if (days === 1) return `${days} day`;
    return `${days} days`;
  }
}
