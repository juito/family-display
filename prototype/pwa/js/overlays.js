import { paint as personPaint } from "./demo.js";
import { ICONS, SLOTS, FAMILY_CAL, esc, shortName, parseStamp, weekdayWide, whenLabel, minutesText } from "./util.js";
import { avatar, recipeThumb, memberOf, sheet } from "./screens.js";

export function renderModal(state) {
  const modal = state.modal;
  if (!modal) return "";
  if (modal.type === "event") {
    const ev = state.events.find((e) => e.id === modal.id) || modal.event;
    if (!ev) return "";
    const member = memberOf(state, ev.memberId);
    const who = (ev.who || []).map((id) => (memberOf(state, id) || {}).name).filter(Boolean).join(", ") || "Everyone";
    return sheet("Event", `
      <div class="row">${member ? avatar(member, 40) : ""}<span class="grow"><div class="title">${esc((ev.title || "").trim() || "Untitled event")}</div><div class="sub">${esc(whenLabel(ev))}</div></span></div>
      <div class="card" style="margin-top:12px">
        <div class="row"><span class="muted">Date</span><span class="grow" style="text-align:right">${esc(weekdayWide(parseStamp(ev.start)))}</span></div>
        ${ev.location ? `<div class="row"><span class="muted">Where</span><span class="grow" style="text-align:right">${esc(ev.location)}</span></div>` : ""}
        <div class="row"><span class="muted">Who</span><span class="grow" style="text-align:right">${esc(who)}</span></div>
        <div class="row"><span class="muted">Calendar</span><span class="grow" style="text-align:right">${esc(ev.calendar || FAMILY_CAL)}</span></div>
      </div>
      <button class="btn danger" style="margin-top:16px" data-act="ask-del-event" data-id="${esc(ev.id)}">Delete event\u2026</button>
      <p class="footer-note">${ev.repeat && ev.repeat !== "never" ? "Deleting this one event needs no PIN. Deleting all future or all events of the series asks for the parent PIN." : "It is removed from the family calendar on every device. No parent PIN needed, same as the display."}</p>
    `);
  }
  if (modal.type === "recipe") {
    const r = state.recipes.find((x) => x.id === modal.id);
    if (!r) return "";
    const mins = minutesText(r);
    const ings = (r.ingredients || []).map((i) => `<div class="row">${esc(i.label || i.text || i.item || "")}</div>`).join("");
    const steps = (r.steps || []).map((s, i) => `<div class="row"><b style="color:var(--accent-ink)">${i + 1}</b><span>${esc(s)}</span></div>`).join("");
    return sheet("Recipe", `
      ${r.photoUrl ? `<div class="recipe-hero" data-photo="${esc(r.photoUrl)}"></div>` : ""}
      <div class="row">${recipeThumb(r, 84)}<span class="grow">
        <div class="title" style="font-size:20px">${esc(r.title)}</div>
        <div class="sub">${[mins, r.servings ? "serves " + r.servings : null, r.tag].filter(Boolean).map(esc).join(" \u00b7 ")}</div>
        <div class="stars-edit">${[1,2,3,4,5].map((n) => `<button data-act="rate" data-id="${esc(r.id)}" data-n="${n}">${n <= (r.rating || 0) ? "\u2605" : "\u2606"}</button>`).join("")}</div>
      </span></div>
      <div class="group-head">Ingredients</div><div class="card">${ings}</div>
      <div class="group-head">Steps</div><div class="card">${steps}</div>
      <button class="btn danger" style="margin-top:16px" data-act="del-recipe" data-id="${esc(r.id)}">${ICONS.lock} Delete recipe\u2026</button>
      <p class="footer-note">Deleting needs the parent PIN. It goes to Recently deleted on the display for 30 days.</p>
    `);
  }
  if (modal.type === "picker") {
    const slot = modal.slot;
    const fits = state.recipes.filter((r) => (r.types || []).includes(slot));
    const others = state.recipes.filter((r) => !(r.types || []).includes(slot));
    const row = (r) => `<button class="row" data-act="pick-recipe" data-id="${esc(r.id)}">${recipeThumb(r)}<span class="grow title">${esc(r.title)}</span></button>`;
    return sheet("Pick a recipe", `
      <div class="group-head">${esc((SLOTS.find((s) => s.id === slot) || {}).label || slot)}</div>
      <div class="card">${fits.map(row).join("")}</div>
      ${others.length ? `<div class="group-head">Other recipes</div><div class="card">${others.map(row).join("")}</div>` : ""}
    `);
  }
  if (modal.type === "add-event") {
    const people = state.snapshot.members.map((m) => {
      const p = personPaint(m.person, m.color);
      return `<button type="button" class="chip person" data-act="who" data-id="${m.id}" style="background:${p.fill};color:${p.ink}">${esc(shortName(m.name))}</button>`;
    }).join("");
    return sheet("New event", `
      <div class="field"><label>Title</label><input id="ev-title" placeholder="What's happening?"></div>
      <div class="field"><label>Date</label><input id="ev-date" type="date" value="${esc(state.selectedDay)}"></div>
      <div class="field"><label>Start</label><input id="ev-start" type="time" value="16:00"></div>
      <div class="field"><label>End</label><input id="ev-end" type="time" value="17:00"></div>
      <div class="field"><label>Who</label><div class="chips">${people}</div></div>
      <button class="btn" data-act="save-event">Add event</button>
    `);
  }
  if (modal.type === "add-task") {
    const people = state.snapshot.members.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join("");
    return sheet("New task", `
      <div class="field"><label>Title</label><input id="task-title" placeholder="Chore, e.g. Feed the dog"></div>
      <div class="field"><label>Who</label><select id="task-who">${people}</select></div>
      <div class="field"><label>Time of day</label><select id="task-tod"><option>morning</option><option selected>afternoon</option><option>evening</option></select></div>
      <div class="field"><label>Stars</label><input id="task-stars" type="number" min="0" max="5" value="1"></div>
      <button class="btn" data-act="save-task">Add</button>
    `);
  }
  if (modal.type === "give") {
    const m = memberOf(state, modal.id);
    return sheet("Give Stars", `
      <div class="row">${avatar(m, 40)}<div class="title">Give ${esc(shortName(m.name))} bonus stars</div></div>
      <div class="field"><label>Stars</label><input id="give-stars" type="number" min="1" max="20" value="2"></div>
      <div class="field"><label>Why (shown on the display)</label><input id="give-reason" placeholder="e.g. Helped with the groceries"></div>
      <button class="btn" data-act="save-give" data-id="${m.id}">Give</button>
    `);
  }
  return "";
}

export function renderConfirm(state) {
  const c = state.confirm;
  if (!c) return "";
  if (c.type === "event") {
    const ev = state.events.find((e) => e.id === c.id);
    if (!ev) return "";
    const recurring = ev.repeat && ev.repeat !== "never";
    const title = (ev.title || "").trim() || "Untitled event";
    return `<div class="confirm-back" data-act="close-confirm"><div>
      <div class="confirm">
        <h3>Are you sure?</h3>
        <p>${recurring
          ? `\u201c${esc(title)}\u201d repeats. Choose what to delete from the family calendar ${FAMILY_CAL}.`
          : `\u201c${esc(title)}\u201d is deleted from the family calendar ${FAMILY_CAL} on every device.`}</p>
        ${recurring
          ? `<button class="destructive" data-act="del-event" data-id="${esc(ev.id)}" data-scope="this">This event</button>
             <button class="destructive" data-act="del-event" data-id="${esc(ev.id)}" data-scope="following">This and following (parent PIN)</button>
             <button class="destructive" data-act="del-event" data-id="${esc(ev.id)}" data-scope="all">All events (parent PIN)</button>`
          : `<button class="destructive" data-act="del-event" data-id="${esc(ev.id)}" data-scope="this">Delete event</button>`}
      </div>
      <div class="confirm cancel-group"><button data-act="close-confirm">Cancel</button></div>
    </div></div>`;
  }
  if (c.type === "grocery") {
    return `<div class="confirm-back" data-act="close-confirm"><div>
      <div class="confirm"><h3>Delete \u2018${esc(c.text)}\u2019?</h3>
        <p>It is removed from Groceries. You can tap Undo for a few seconds right after.</p>
        <button class="destructive" data-act="del-groc" data-id="${esc(c.id)}">Delete</button></div>
      <div class="confirm cancel-group"><button data-act="close-confirm">Cancel</button></div>
    </div></div>`;
  }
  if (c.type === "unpair") {
    return `<div class="confirm-back" data-act="close-confirm"><div>
      <div class="confirm"><h3>Unpair this iPhone?</h3>
        <p>The display forgets this phone's key. You'll need the parent PIN now, and to pair again.</p>
        <button class="destructive" data-act="do-unpair">Unpair</button></div>
      <div class="confirm cancel-group"><button data-act="close-confirm">Cancel</button></div>
    </div></div>`;
  }
  return "";
}

export function renderPin(state) {
  if (!state.pin) return "";
  const digits = state.pinDigits || "";
  const dots = [0,1,2,3].map((i) => `<b class="${i < digits.length ? "on" : ""}"></b>`).join("");
  const keys = ["1","2","3","4","5","6","7","8","9","cancel","0","back"];
  const btns = keys.map((k) => {
    if (k === "cancel") return `<button class="ghost" data-act="pin-key" data-id="cancel">Cancel</button>`;
    if (k === "back") return `<button class="ghost" data-act="pin-key" data-id="back">\u232b</button>`;
    return `<button data-act="pin-key" data-id="${k}">${k}</button>`;
  }).join("");
  return `<div class="pin-back"><div class="pin">
    <div class="lock">${ICONS.lock}</div>
    <h2>Enter parent PIN</h2>
    <p class="purpose">${esc(state.pin.purpose || "This needs the parent PIN.")}</p>
    <div class="dots">${dots}</div>
    <div class="msg">${esc(state.pinMsg || "")}</div>
    <div class="pad">${btns}</div>
    <p class="footer-note">Forgot the PIN? On the display, tap Forgot PIN? and scan the code with a parent's phone.</p>
  </div></div>`;
}

export function renderMenu(state) {
  if (!state.menu) return "";
  return `<div class="quick-menu" data-act="menu-close"><ul>
    <li><button data-act="add" data-id="event">Event</button></li>
    <li><button data-act="add" data-id="task">Task</button></li>
    <li><button data-act="add" data-id="grocery">Grocery</button></li>
    <li><button data-act="add" data-id="meal">Meal</button></li>
    <li><button data-act="add" data-id="photo">Photo</button></li>
  </ul></div>`;
}
