import "server-only";

export const CURRENT_STUDENT_ID = "S001";

export function formatSlot(slot: string): string {
  const [hoursText, minutes = "00"] = slot.split(":");
  const hours = Number(hoursText);
  if (!Number.isInteger(hours) || hours < 0 || hours > 23 || !/^\d{2}$/.test(minutes)) {
    throw new Error(`Invalid pickup slot: ${slot}`);
  }

  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${period}`;
}
