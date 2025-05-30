export function timeDifference(timestamp: string) {
  const Today = new Date();
  let date1 = new Date(timestamp);
  let date2 = new Date(Today.getFullYear(), Today.getMonth(), Today.getDate());
  let difference = date1.getTime() - date2.getTime();

  const daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);
  difference -= daysDifference * 1000 * 60 * 60 * 24;

  const hoursDifference = Math.floor(difference / 1000 / 60 / 60);
  difference -= hoursDifference * 1000 * 60 * 60;

  const minutesDifference = Math.floor(difference / 1000 / 60);
  difference -= minutesDifference * 1000 * 60;

  const secondsDifference = Math.floor(difference / 1000);

  if (daysDifference > 0) {
    return daysDifference + " day/s";
  }
  if (hoursDifference > 0) {
    return hoursDifference + " hour/s";
  }
  if (minutesDifference > 0) {
    return minutesDifference + " minute/s";
  }
  if (secondsDifference > 0) {
    return secondsDifference + " second/s";
  }
}
