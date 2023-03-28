export function formatTime(time: Date | string | number) {
  const timestamp = new Date(Number(time));
  const dateString = `${timestamp.getFullYear()}/${timestamp.getMonth() + 1}/${timestamp.getDate()}`;
  const timeString = `${timestamp.getHours()}:${timestamp.getMinutes()}:${timestamp.getSeconds()}`;

  return `${dateString} ${timeString}`;
}
