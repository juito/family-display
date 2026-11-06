import { paint as personPaint } from "./demo.js";
import {
  ICONS, SLOTS, FAMILY_CAL, esc, shortName, isoDay, parseStamp, addDays,
  formatHM, monthTitle, weekdayWide, weekdayNarrow, dayNum, whenLabel,
  minutesText, monthDay
} from "./util.js";

export function avatar(member, size = 36) {
  if (!member) return "";
  const p = personPaint(member.person, member.color);
  const fs = Math.round(size * 0.45);
  return `<span class="avatar" style="width:${size}px;height:${size}px;background:${p.fill};color:${p.ink};font-size:${fs}px;border-color:${p.accent}">${esc(member.initial)}</span>`;
}

export function check(done, color) {
  return `<span class="check ${done ? "on" : ""}" style="--ck:${color || "var(--accent-mid)"}">${done ? ICONS.check : ""}</span>`;
}

export function starBadge(n) {
  if (!n) return `<span class="muted">No stars</span>`;
  return `<span class="star">${ICONS.star} ${n}</span>`;
}

export function badge(state) {
  if (state.demo) return `<span class="badge sample"><i></i>Sample data</span>`;
  if (!state.paired) return `<span class="badge warn"><i></i>Not paired</span>`;
  if (state.route === "offline") return `<span class="badge"><i></i>Offline</span>`;
  return `<span class="badge ok"><i></i>${state.route === "tailscale" ? "Tailscale" : "Home Wi-Fi"}</span>`;
}

export function navbar(state, title, segmented) {
  const mid = segmented
    ? `<div class="segmented">${segmented.map((s) => `<button data-act="section" data-id="${s.id}" class="${s.on ? "on" : ""}">${esc(s.label)}</button>`).join("")}</div>`
    : `<h1>${esc(title)}</h1>`;
  return `<header class="navbar">
    <div class="side">${badge(state)}</div>
    ${mid}
    <div class="side right">
      <button class="icon-btn" data-act="open" data-id="remote" aria-label="Remote">${ICONS.remote}</button>
      <button class="icon-btn" data-act="open" data-id="settings" aria-label="Settings">${ICONS.gear}</button>
    </div>
  </header>`;
}

export function tabbar(state) {
  const tabs = [
    ["calendar", "Calendar", ICONS.calendar],
    ["chores", "Chores", ICONS.chores],
    ["food", "Food", ICONS.food],
    ["groceries", "Groceries", ICONS.cart],
    ["photos", "Photos", ICONS.photos]
  ];
  return `<nav class="tabbar">${tabs.map(([id, label, icon]) =>
    `<button data-act="tab" data-id="${id}" class="${state.tab === id ? "on" : ""}">${icon}<span>${label}</span></button>`
  ).join("")}</nav>
  <button class="fab" data-act="menu" aria-label="Add">${ICONS.plus}</button>`;
}

export function empty(state, title, message) {
  if (state.error) return `<div class="banner">${esc(state.error)}</div>`;
  if (state.loading) return `<p class="empty">Loading from the display\u2026</p>`;
  return `<div class="empty"><h2>${esc(title)}</h2><p>${esc(message)}</p></div>`;
}

export function recipeThumb(recipe, size = 56) {
  const idx = ([...recipe.id].reduce((n, ch) => n + ch.codePointAt(0), 0) % 5) + 1;
  const p = personPaint(idx);
  const src = recipe.photoThumbUrl || "";
  return `<div class="thumb ${size < 50 ? "sm" : ""}" style="width:${size}px;height:${size}px">
    <div class="placeholder" style="background:linear-gradient(135deg,${p.fill},${p.accent}8c)" data-photo="${esc(src)}"></div>
  </div>`;
}

export function eventsOn(state, day) {
  const start = parseStamp(day);
  const end = addDays(start, 1);
  return state.events.filter((ev) => {
    const a = parseStamp(ev.start), b = parseStamp(ev.end);
    return a && b && a < end && b > start;
  }).sort((a, b) => (a.allDay === b.allDay ? parseStamp(a.start) - parseStamp(b.start) : (a.allDay ? -1 : 1)));
}

export function nowIndex(items, now) {
  const i = items.findIndex((ev) => !ev.allDay && parseStamp(ev.start) > now);
  return i < 0 ? items.length : i;
}

export function paintFor(state, memberId) {
  const m = state.snapshot.members.find((x) => x.id === memberId);
  if (m) return personPaint(m.person, m.color);
  return personPaint(6);
}

export function memberOf(state, id) {
  return state.snapshot.members.find((m) => m.id === id) || null;
}

export function balance(state, memberId) {
  const earned = state.snapshot.chores.filter((c) => c.memberId === memberId && c.done)
    .reduce((n, c) => n + Math.max(0, c.stars || 0), 0);
  return (state.snapshot.bonus[memberId] || 0) + earned - (state.snapshot.spent[memberId] || 0);
}

export function parentUnlocked(state) {
  return state.parentToken && Date.now() < state.parentExpires;
}

function eventRow(state, ev) {
  const p = paintFor(state, ev.memberId);
  const member = memberOf(state, ev.memberId);
  const title = (ev.title || "").trim() || "Untitled event";
  return `<div class="swipe-wrap" data-swipe="event" data-id="${esc(ev.id)}">
    <button class="event row" data-act="event" data-id="${esc(ev.id)}" style="background:${p.fill};width:100%;text-align:left">
      <i class="bar" style="background:${p.accent}"></i>
      <span class="grow">
        <div class="title" style="color:${p.ink}">${esc(title)}</div>
        <div class="sub" style="color:${p.ink}cc">${esc(whenLabel(ev))}${ev.location ? " · " + esc(ev.location) : ""}</div>
      </span>
      ${ev.repeat && ev.repeat !== "never" ? `<span class="muted">\u21bb</span>` : ""}
      ${member ? avatar(member, 28) : ""}
    </button>
  </div>`;
}

export function calendarScreen(state) {
  const days = [...Array(7)].map((_, i) => addDays(state.weekStart, i));
  const today = isoDay(state.now());
  const counts = days.map((d) => eventsOn(state, isoDay(d)).length);
  const now = state.now();
  const week = days.map((d, i) => {
    const id = isoDay(d);
    return `<button data-act="day" data-id="${id}" class="${id === state.selectedDay ? "sel" : ""} ${id === today ? "today" : ""} ${counts[i] ? "has" : ""}">
      <span class="dow">${esc(weekdayNarrow(d))}</span>
      <span class="dom">${dayNum(d)}</span>
      <span class="dot"></span>
    </button>`;
  }).join("");
  const sections = days.map((d) => {
    const id = isoDay(d);
    const items = eventsOn(state, id);
    const header = `<div class="group-head">${esc(weekdayWide(d))}${id === today ? '<span class="today">Today</span>' : ""}</div>`;
    let body = "";
    if (id === today) {
      const split = nowIndex(items, now);
      body = items.slice(0, split).map((ev) => eventRow(state, ev)).join("")
        + `<div class="now-line"><span>${esc(formatHM(now))}</span><i></i></div>`
        + items.slice(split).map((ev) => eventRow(state, ev)).join("");
      if (!items.length) body += `<div class="card"><div class="row"><span class="muted">Nothing planned</span></div></div>`;
    } else if (!items.length) {
      body = `<div class="card"><div class="row"><span class="muted">Nothing planned</span></div></div>`;
    } else {
      body = items.map((ev) => eventRow(state, ev)).join("");
    }
    return `<section class="group" id="day-${id}">${header}${body}</section>`;
  }).join("");
  return navbar(state, monthTitle(days[0] || now)) + `
  <main class="scroll">
    <div class="cal-top">
    <div class="week-nav">
      <button data-act="week" data-id="-1" aria-label="Previous week">${ICONS.chevL}</button>
      <button class="mid" data-act="today" style="color:var(--accent-ink);font-weight:650">Today</button>
      <button data-act="week" data-id="1" aria-label="Next week">${ICONS.chevR}</button>
    </div>
    <div class="week-strip">${week}</div>
    <p class="footer-note">Family calendar \u00b7 ${FAMILY_CAL}, synced by the display</p>
    </div>
    ${state.error ? `<div class="banner">${esc(state.error)}</div>` : ""}
    ${sections}
  </main>` + tabbar(state);
}

export function memberChips(state) {
  const people = state.snapshot.members;
  const chips = [`<button class="chip ${state.filterMember ? "" : "on"}" data-act="filter" data-id="">Everyone</button>`]
    .concat(people.map((m) => {
      const p = personPaint(m.person, m.color);
      const on = state.filterMember === m.id;
      return `<button class="chip person ${on ? "on" : ""}" data-act="filter" data-id="${m.id}" style="background:${on ? p.fill : p.fill + "73"};color:${p.ink}">
        <span class="mini">${esc(m.initial)}</span>${esc(shortName(m.name))}
      </button>`;
    }));
  return `<div class="chips">${chips.join("")}</div>`;
}

export function choresScreen(state) {
  const members = state.snapshot.members.filter((m) => !state.filterMember || m.id === state.filterMember);
  const blocks = members.map((m) => {
    const items = state.snapshot.chores.filter((c) => c.memberId === m.id);
    if (!items.length) return "";
    const p = personPaint(m.person, m.color);
    const rows = items.map((c) => `<div class="swipe-wrap" data-swipe="chore" data-id="${esc(c.id)}">
      <button class="row ${c.done ? "done" : ""}" data-act="toggle-chore" data-id="${esc(c.id)}" style="background:${c.done ? p.fill : "var(--surface)"}">
        ${check(c.done, p.accent)}
        <span class="grow"><div class="title">${esc(c.title)}</div><div class="sub">${esc((c.tod || "").replace(/^./, (x) => x.toUpperCase()))} \u00b7 ${esc(c.repeat || "")}</div></span>
        ${starBadge(c.stars)}
      </button>
    </div>`).join("");
    return `<section class="group">
      <div class="group-head">${avatar(m, 28)}<span style="color:${p.ink}">${esc(shortName(m.name))}</span> <span>${esc(m.emoji || "")}</span>
        <span style="margin-left:auto" class="muted">${items.filter((c) => c.done).length}/${items.length}</span>
      </div>
      <div class="card">${rows}</div>
    </section>`;
  }).join("");
  return navbar(state, "Chores", [{ id: "chores", label: "Chores", on: true }, { id: "rewards", label: "Rewards", on: false }]) + `
  <main class="scroll">
    ${state.snapshot.chores.length ? memberChips(state) : empty(state, "No chores yet", "Chores added on the display or with + show up here.")}
    ${blocks}
  </main>` + tabbar(state);
}

export function rewardsScreen(state) {
  const cards = state.snapshot.members.filter((m) => m.id !== "family").map((m) => {
    const p = personPaint(m.person, m.color);
    const rewards = state.snapshot.rewards.filter((r) => r.memberId === m.id);
    const bal = balance(state, m.id);
    const rows = rewards.map((r) => `<div class="reward-row">
      <span class="grow">${esc(r.title)}</span>
      <button class="btn" style="width:auto;padding:8px 12px;background:${p.accent}" data-act="redeem" data-id="${esc(r.id)}" ${bal < r.cost ? "disabled" : ""}>
        ${parentUnlocked(state) ? "" : ICONS.lock} ${ICONS.star} ${r.cost}
      </button>
    </div>`).join("");
    return `<article class="reward-card" style="background:${p.fill}">
      <div class="row" style="background:transparent;padding:0">
        ${avatar(m, 44)}
        <span class="grow"><div class="title" style="color:${p.ink}">${esc(m.name)}</div>
        <div class="sub" style="color:${p.ink}bf">${esc(m.role)}${m.age ? " \u00b7 " + m.age : ""}</div></span>
        <span class="star" style="color:${p.ink};font-size:22px">${ICONS.star} ${bal}</span>
      </div>
      ${rows}
      <button class="btn" style="margin-top:12px;background:${p.accent}" data-act="give" data-id="${m.id}">Give stars ${parentUnlocked(state) ? "" : ICONS.lock}</button>
    </article>`;
  }).join("");
  return navbar(state, "Rewards", [{ id: "chores", label: "Chores", on: false }, { id: "rewards", label: "Rewards", on: true }]) + `
  <main class="scroll">${cards || empty(state, "No family members yet", "Add people on the display.")}</main>` + tabbar(state);
}

function mealFor(state, day, slot) {
  return state.meals[day + ":" + slot] || null;
}

export function mealsScreen(state) {
  const days = [...Array(7)].map((_, i) => addDays(state.weekStart, i));
  const today = isoDay(state.now());
  const end = addDays(state.weekStart, 6);
  const sections = days.map((d) => {
    const day = isoDay(d);
    const rows = SLOTS.map((slot) => {
      const meal = mealFor(state, day, slot.id);
      const recipe = meal && meal.recipeId ? state.recipes.find((r) => r.id === meal.recipeId) : null;
      const title = (recipe && recipe.title) || (meal && meal.title);
      const mins = minutesText(recipe);
      return `<div class="swipe-wrap" data-swipe="meal" data-id="${day}:${slot.id}">
        <button class="row" data-act="meal" data-id="${day}:${slot.id}">
          ${recipe ? recipeThumb(recipe, 40) : `<span class="thumb sm" style="background:var(--accent-fill);color:var(--accent-mid)">+</span>`}
          <span class="grow"><div class="sub">${esc(slot.label)}</div>
            <div class="title" style="${title ? "" : "color:var(--text-tertiary);font-weight:500"}">${esc(title || ("Add " + slot.label.toLowerCase()))}</div></span>
          ${meal && meal.status === "idea" ? `<span class="today">Idea</span>` : ""}
          ${mins ? `<span class="muted">${esc(mins)}</span>` : ""}
        </button>
      </div>`;
    }).join("");
    return `<section class="group" id="day-${day}"><div class="group-head">${esc(weekdayWide(d))}${day === today ? '<span class="today">Today</span>' : ""}</div><div class="card">${rows}</div></section>`;
  }).join("");
  return navbar(state, "Meals", [{ id: "meals", label: "Meals", on: true }, { id: "recipes", label: "Recipes", on: false }]) + `
  <main class="scroll">
    <div class="week-nav">
      <button data-act="week" data-id="-1">${ICONS.chevL}</button>
      <div class="mid">${esc(monthDay(state.weekStart))} \u2013 ${esc(monthDay(end))}</div>
      <button data-act="week" data-id="1">${ICONS.chevR}</button>
    </div>
    ${sections}
  </main>` + tabbar(state);
}

export function recipesScreen(state) {
  const filter = state.recipeFilter;
  const shown = state.recipes.filter((r) => !filter || (r.types || []).includes(filter));
  const chips = ["", ...SLOTS.map((s) => s.id)].map((id) => {
    const label = id ? SLOTS.find((s) => s.id === id).label : "All";
    const on = (!filter && !id) || filter === id;
    return `<button class="chip ${on ? "on" : ""}" data-act="rfilter" data-id="${id}">${label}</button>`;
  }).join("");
  const rows = shown.map((r) => {
    const mins = minutesText(r);
    return `<div class="swipe-wrap" data-swipe="recipe" data-id="${esc(r.id)}">
      <button class="row" data-act="recipe" data-id="${esc(r.id)}">
        ${recipeThumb(r)}
        <span class="grow"><div class="title">${esc(r.title)}</div>
          <div class="sub">${mins ? "\u23f1 " + esc(mins) + " \u00b7 " : ""}\u{1f464} ${r.servings} \u00b7 ${esc(r.tag || "")}</div></span>
        ${r.rating ? `<span class="star">${ICONS.star} ${r.rating}</span>` : ""}
      </button>
    </div>`;
  }).join("");
  return navbar(state, "Recipes", [{ id: "meals", label: "Meals", on: false }, { id: "recipes", label: "Recipes", on: true }]) + `
  <main class="scroll">
    <div class="chips">${chips}</div>
    ${state.recipes.length ? `<div class="group-head">${shown.length} recipes</div><div class="card">${rows}</div>` : empty(state, "No recipes yet", "The display's recipe box shows up here.")}
  </main>` + tabbar(state);
}

export function groceriesScreen(state) {
  const open = state.snapshot.groceries.filter((g) => !g.done);
  const done = state.snapshot.groceries.filter((g) => g.done);
  const row = (g) => `<div class="swipe-wrap" data-swipe="grocery" data-id="${esc(g.id)}">
    <button class="row ${g.done ? "done" : ""}" data-act="toggle-groc" data-id="${esc(g.id)}" style="${g.done ? "background:color-mix(in srgb, var(--grocery-fill) 60%, var(--surface))" : ""}">
      ${check(g.done, "var(--grocery-ink)")}
      <span class="grow title">${esc(g.text)}</span>
    </button>
  </div>`;
  return navbar(state, "Groceries") + `
  <main class="scroll">
    <div class="card"><div class="row"><span style="color:var(--grocery-ink);font-size:22px">+</span>
      <input id="groc-new" placeholder="Add an item" style="flex:1;border:0;background:transparent;padding:8px 0;outline:none">
    </div></div>
    ${state.snapshot.groceries.length ? "" : empty(state, "The list is empty", "Add an item above. Everyone at home sees it on the display.")}
    <div class="group-head">To buy \u00b7 ${open.length}</div>
    <div class="card">${open.map(row).join("")}</div>
    ${done.length ? `<div class="group-head">In the cart \u00b7 ${done.length}<button style="margin-left:auto;color:var(--grocery-ink);font-weight:650" data-act="clear-done">Clear done</button></div><div class="card">${done.map(row).join("")}</div>` : ""}
  </main>` + tabbar(state) + (state.undo ? `<div class="undo">\u2018${esc(state.undo.text)}\u2019 deleted <button data-act="undo">Undo</button></div>` : "");
}

export function photosScreen(state) {
  const rows = (state.sends || []).map((s) => `<div class="row">
    <div class="thumb sm" style="background:var(--accent-fill)"></div>
    <span class="grow"><div class="title">${esc(s.name)}</div><div class="sub">${esc(s.note)}</div></span>
    <span style="color:#34C759">\u2713</span>
  </div>`).join("") || `<div class="row"><span class="muted">Nothing sent yet.</span></div>`;
  return navbar(state, "Photos") + `
  <main class="scroll">
    <div class="card" style="padding:16px">
      <div class="row" style="padding:0 0 12px;background:transparent">
        <div class="thumb" style="background:var(--accent-fill);color:var(--accent-ink)">${ICONS.photos}</div>
        <span class="grow"><div class="title">Send to the display</div><div class="sub">New photos join the collage within a minute.</div></span>
      </div>
      <label class="btn" style="cursor:pointer">Choose Photos
        <input id="photo-file" type="file" accept="image/*" multiple class="sr">
      </label>
      <p class="footer-note">The Photos app Share extension is only in the native iPhone app.</p>
    </div>
    <div class="group-head">Recent sends</div>
    <div class="card">${rows}</div>
  </main>` + tabbar(state);
}

export function remoteScreen(state) {
  const st = state.status;
  return navbar(state, "Remote") + `
  <main class="scroll">
    <div class="status">
      <div class="thumb" style="background:var(--accent-fill);color:var(--accent-ink);width:56px;height:56px">${ICONS.display}</div>
      <div><div class="title">${esc((state.paired && state.paired.displayName) || st.name)}</div>
        <div class="sub">${st.awake ? "Awake \u00b7 " + st.brightness + "% brightness" : "Asleep"}</div>
        <div class="muted">Via ${state.demo ? "Sample data" : (state.route === "tailscale" ? "Tailscale" : "Home Wi-Fi")}</div></div>
    </div>
    <div class="remote-grid" style="margin-top:16px">
      <button class="big-btn" data-act="remote" data-id="wake">Wake</button>
      <button class="big-btn sleep" data-act="remote" data-id="sleep">Sleep</button>
    </div>
    <div class="card" style="margin-top:16px;padding:14px">
      <div class="row" style="padding:0 0 10px;background:transparent"><span class="title">Brightness</span><span class="muted">${st.brightness}%</span></div>
      <input class="slider" id="bright" type="range" min="0" max="100" step="5" value="${st.brightness}">
    </div>
    <div class="card" style="margin-top:16px;padding:14px">
      <div class="title" style="margin-bottom:10px">Photos</div>
      <div class="remote-grid">
        <button class="big-btn mid" data-act="remote" data-id="previous-photo">Previous</button>
        <button class="big-btn mid" data-act="remote" data-id="next-photo">Next</button>
      </div>
    </div>
  </main>` + tabbar(state);
}

export function settingsScreen(state, extras) {
  const paired = state.paired;
  const parent = parentUnlocked(state);
  return navbar(state, "Settings") + `
  <main class="scroll">
    <div class="card" style="padding:16px">
      ${paired || state.demo ? `
        <div class="row" style="padding:0 0 8px;background:transparent"><span style="color:#34C759;font-size:28px">\u2713</span>
          <span class="grow"><div class="title">${esc((paired && paired.displayName) || "Family Display")}</div>
          <div class="sub">${state.demo ? "Sample data" : "Paired"}</div></span></div>
        <div class="row"><span class="muted">Home Wi-Fi</span><span class="grow" style="text-align:right">${esc((paired && paired.lanHost) || "192.168.50.223")}</span></div>
        <div class="row"><span class="muted">Device ID</span><span class="grow" style="text-align:right">${esc((paired && paired.deviceId) || "demo")}</span></div>
        <button class="btn danger" data-act="unpair" style="margin-top:8px">Unpair this iPhone</button>` :
        `<div class="title">Pair with your Family Display</div>
         <p class="sub">On the display, open Settings \u2192 Phone app \u2192 Pair a phone.</p>
         <button class="btn" data-act="show-pair" style="margin-top:12px">Enter pairing code</button>`}
    </div>
    <div class="group-head">Parent PIN</div>
    <div class="card">
      <div class="row"><span>Parent mode</span><span class="grow" style="text-align:right">${parent ? "Unlocked" : "Locked"}</span></div>
      ${parent ? `<button class="row" data-act="lock-parent">Lock now</button>` : ""}
    </div>
    <p class="footer-note">Giving stars, redeeming rewards and deleting anything ask for the display's parent PIN. After a correct PIN this phone stays unlocked for 5 minutes.</p>
    <div class="group-head">Face ID</div>
    <div class="card">
      <div class="row"><span>Secure connection</span><span class="grow" style="text-align:right">${extras.secure ? "Yes" : "No (needs https)"}</span></div>
      <div class="row"><span>Face ID unlock</span><span class="grow" style="text-align:right">${extras.hasCred ? "On" : "Off"}</span></div>
      <button class="row" data-act="setup-face">${extras.hasCred ? "Remove Face ID unlock" : "Turn on Face ID unlock"}</button>
    </div>
    <p class="footer-note">Face ID uses a passkey stored on this iPhone. It needs https (Safari will not offer Face ID on plain http).</p>
    <div class="group-head">About</div>
    <div class="card">
      <div class="row"><span>Version</span><span class="grow" style="text-align:right">1.0 PWA</span></div>
      <div class="row"><span>Data</span><span class="grow" style="text-align:right">${state.demo ? "Sample family" : (paired ? "From display only" : "None until paired")}</span></div>
    </div>
  </main>` + tabbar(state);
}

export function pairScreen(state) {
  return `<div class="pair-home">
    <header class="navbar"><div class="side">${badge(state)}</div><h1></h1><div class="side right"><button class="icon-btn" data-act="open" data-id="settings">${ICONS.gear}</button></div></header>
    <div class="hero">${ICONS.display}</div>
    <h1 style="text-align:center">Pair with your Family Display</h1>
    <p style="text-align:center;color:var(--text-secondary)">Calendar, chores, meals, groceries and photos come straight from the display. Nothing shows here until this iPhone is paired.</p>
    <div class="steps">
      <div class="step"><b>1</b><span>On the display, open Settings \u2192 Phone app \u2192 Pair a phone.</span></div>
      <div class="step"><b>2</b><span>Enter the pairing code it shows, or paste it here.</span></div>
    </div>
    ${state.error ? `<div class="banner">${esc(state.error)}</div>` : ""}
    <div class="field" style="margin-top:18px"><label>Pairing code</label><input id="pair-code" placeholder="K7Q-2MX-9PA" autocomplete="off"></div>
    <div class="field"><label>Display address</label><input id="pair-url" value="http://192.168.50.223:8080"></div>
    <button class="btn" data-act="claim">Pair this iPhone</button>
  </div>`;
}

export function lockScreen(state, extras) {
  return `<div class="lock-screen">
    <div class="hero">${ICONS.face}</div>
    <h1>Unlock Family Display</h1>
    <p>Use Face ID to open the app on this iPhone. Your pairing key stays on the phone; Face ID just unlocks it.</p>
    ${state.lockError ? `<div class="banner">${esc(state.lockError)}</div>` : ""}
    ${extras.secure ? "" : `<div class="banner">Face ID needs a secure https connection. Open the https address, then add it to your Home Screen.</div>`}
    <button class="btn" data-act="unlock-face" ${extras.available ? "" : "disabled"}>${ICONS.face} Unlock with Face ID</button>
    <button class="btn ghost" style="margin-top:10px" data-act="unlock-skip">Continue without Face ID</button>
  </div>`;
}

export function sheet(title, inner) {
  return `<div class="sheet-back" data-act="close-modal"><div class="sheet" data-stop="1"><div class="sheet-handle"></div>
    <div class="sheet-bar"><button data-act="close-modal">Close</button><h2>${esc(title)}</h2><span style="width:52px"></span></div>
    <div class="form">${inner}</div>
  </div></div>`;
}
