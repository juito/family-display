export const TZ = "America/Los_Angeles";
export const FAMILY_CAL = "EBI & EBI";

export const SLOTS = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snack" }
];

export const ICONS = {
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M8 3.5v3M16 3.5v3M3.5 10h17"/></svg>',
  chores: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6.2l1.3 1.3 2.2-2.4M4.5 12.2l1.3 1.3 2.2-2.4M4.5 18.2l1.3 1.3 2.2-2.4"/></svg>',
  food: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 3v8M6 3v8M10 3v8M8 11v10M16 3c0 4 2 6 2 8v10M16 3v8"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h2l1.2 9.5a2 2 0 0 0 2 1.7h8.2a2 2 0 0 0 2-1.6L21 8H7"/><circle cx="10" cy="19.5" r="1.4"/><circle cx="18" cy="19.5" r="1.4"/></svg>',
  photos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="14" height="12" rx="2"/><path d="M8 18l8-3 5 3V9l-4 5"/><rect x="7" y="3" width="14" height="12" rx="2"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1 1 0 0 0 .1-2l1.8-1-1.8-3.2-2 .6a7.6 7.6 0 0 0-4.7-2.7L12.2 2h-2.6l-.6 2.7a7.6 7.6 0 0 0-4.7 2.7l-2-.6L0.5 12l1.8 1a1 1 0 0 0 .1 2l-1.8 1 1.8 3.2 2-.6a7.6 7.6 0 0 0 4.7 2.7l.6 2.7h2.6l.6-2.7a7.6 7.6 0 0 0 4.7-2.7l2 .6 1.8-3.2-1.8-1z"/></svg>',
  remote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="2.5" width="8" height="19" rx="3"/><circle cx="12" cy="8" r="1.4"/><path d="M12 12v6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>',
  chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 6l-6 6 6 6"/></svg>',
  chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 6l6 6-6 6"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  face: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 10.5c.2-2 1.5-3 4-3s3.8 1 4 3M9 15.5c.8.9 1.8 1.3 3 1.3s2.2-.4 3-1.3"/><circle cx="9" cy="10" r=".8" fill="currentColor"/><circle cx="15" cy="10" r=".8" fill="currentColor"/></svg>',
  display: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.2l2.5 6.4 6.9.4-5.3 4.3 1.8 6.6L12 17.4 5.9 21l1.8-6.6L2.4 10l6.9-.4z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12.5l4.2 4.2L19 7.5"/></svg>'
};

export function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function shortName(name) {
  const kept = [...String(name)].filter((ch) => {
    const cp = ch.codePointAt(0);
    return !(cp > 0x238C && /\p{Extended_Pictographic}/u.test(ch));
  }).join("").replace(/\s+/g, " ").trim();
  return kept || String(name).trim();
}

function partsInTZ(date, opts) {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...opts }).formatToParts(date);
}
function pick(parts, type) { return (parts.find((p) => p.type === type) || {}).value; }

export function isoDay(date) {
  const p = partsInTZ(date, { year: "numeric", month: "2-digit", day: "2-digit" });
  return pick(p, "year") + "-" + pick(p, "month") + "-" + pick(p, "day");
}

export function parseStamp(s) {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + "T00:00:00");
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function startOfWeek(date) {
  const day = isoDay(date);
  const [y, m, d] = day.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d, 12);
  const wd = new Date(utc).getUTCDay();
  const back = (wd + 6) % 7;
  return new Date(utc - back * 86400000);
}

export function addDays(date, n) {
  return new Date(date.getTime() + n * 86400000);
}

export function formatTime(date) {
  const p = partsInTZ(date, { hour: "numeric", minute: "2-digit", hour12: true });
  return pick(p, "hour") + ":" + pick(p, "minute") + " " + pick(p, "dayPeriod");
}

export function formatHM(date) {
  const p = partsInTZ(date, { hour: "numeric", minute: "2-digit", hour12: true });
  return pick(p, "hour") + ":" + pick(p, "minute");
}

export function monthTitle(date) {
  const p = partsInTZ(date, { month: "long", year: "numeric" });
  return pick(p, "month") + " " + pick(p, "year");
}

export function weekdayWide(date) {
  const p = partsInTZ(date, { weekday: "long", month: "short", day: "numeric" });
  return pick(p, "weekday") + ", " + pick(p, "month") + " " + pick(p, "day");
}

export function weekdayNarrow(date) {
  return pick(partsInTZ(date, { weekday: "narrow" }), "weekday");
}

export function dayNum(date) {
  return Number(pick(partsInTZ(date, { day: "numeric" }), "day"));
}

export function whenLabel(ev) {
  if (ev.allDay) return "All day";
  const a = parseStamp(ev.start), b = parseStamp(ev.end);
  if (!a || !b) return "";
  return formatTime(a) + " \u2013 " + formatTime(b);
}

export function minutesText(recipe) {
  if (!recipe || !recipe.minutes) return null;
  return recipe.minutes + " min";
}

export function monthDay(date) {
  const p = partsInTZ(date, { month: "short", day: "numeric" });
  return pick(p, "month") + " " + pick(p, "day");
}
