import { api, loadSession, saveSession } from "./api.js";
import { loadCred, saveCred, registerPasskey, unlockWithPasskey, webauthnAvailable, secureContext } from "./auth.js";
import { snapshot as demoSnapshot, demoEvents, demoMeals, RECIPES as DEMO_RECIPES, STATUS as DEMO_STATUS } from "./demo.js";
import { FAMILY_CAL, isoDay, parseStamp, startOfWeek, addDays } from "./util.js";
import {
  calendarScreen, choresScreen, rewardsScreen, mealsScreen, recipesScreen,
  groceriesScreen, photosScreen, remoteScreen, settingsScreen, pairScreen, lockScreen
} from "./screens.js";
import { renderModal, renderConfirm, renderPin, renderMenu } from "./overlays.js";

const params = new URLSearchParams(location.search);
const DEMO = params.get("demo") === "1" || params.get("demo") === "yes";
const SHOT = params.get("shot") === "1" || params.has("screen");

const state = {
  tab: "calendar",
  section: { chores: "chores", food: "meals" },
  paired: loadSession(),
  demo: DEMO,
  unlocked: true,
  needUnlock: false,
  snapshot: { members: [], chores: [], groceries: [], rewards: [], bonus: {}, spent: {} },
  events: [],
  meals: {},
  recipes: [],
  status: { name: "Family Display", awake: true, brightness: 70 },
  weekStart: startOfWeek(new Date()),
  selectedDay: isoDay(new Date()),
  error: null,
  loading: false,
  route: "lan",
  parentToken: null,
  parentExpires: 0,
  modal: null,
  confirm: null,
  pin: null,
  undo: null,
  filterMember: null,
  recipeFilter: null,
  menu: false,
  sends: [],
  pinDigits: "",
  pinMsg: "",
  nowOverride: null,
  lockError: "",
  now() { return this.nowOverride || new Date(); }
};

if (params.get("now")) {
  const bits = params.get("now").split(":").map(Number);
  const today = isoDay(new Date());
  state.nowOverride = parseStamp(today + "T" + String(bits[0]).padStart(2, "0") + ":" + String(bits[1] || 0).padStart(2, "0") + ":00");
}
const theme = params.get("theme");
if (theme === "dark" || theme === "light") document.documentElement.setAttribute("data-theme", theme);

const requested = params.get("screen");
if (requested === "rewards") { state.tab = "chores"; state.section.chores = "rewards"; }
else if (requested === "meals" || requested === "recipes") { state.tab = "food"; state.section.food = requested; }
else if (["calendar", "chores", "groceries", "photos", "remote", "settings"].includes(requested)) state.tab = requested;

function extras() {
  return { secure: secureContext(), hasCred: !!loadCred(), available: webauthnAvailable() };
}

function screenHTML() {
  if (requested === "pair") return pairScreen(state);
  if (requested === "lock" || (state.needUnlock && !state.unlocked)) return lockScreen(state, extras());
  if (!state.demo && !state.paired) return pairScreen(state);
  if (state.tab === "chores") return state.section.chores === "rewards" ? rewardsScreen(state) : choresScreen(state);
  if (state.tab === "food") return state.section.food === "recipes" ? recipesScreen(state) : mealsScreen(state);
  if (state.tab === "groceries") return groceriesScreen(state);
  if (state.tab === "photos") return photosScreen(state);
  if (state.tab === "remote") return remoteScreen(state);
  if (state.tab === "settings") return settingsScreen(state, extras());
  return calendarScreen(state);
}

function render() {
  try {
    document.getElementById("app").innerHTML =
      `<div class="app ${SHOT ? "shot" : ""}">${screenHTML()}${renderMenu(state)}${renderModal(state)}${renderConfirm(state)}${renderPin(state)}</div>`;
    bindAfter();
    loadVisiblePhotos();
    revealSelectedDay();
  } catch (err) {
    document.getElementById("app").innerHTML = "<pre style=\"white-space:pre-wrap;padding:16px\">" + (err && err.stack ? err.stack : err) + "</pre>";
  }
}

function revealSelectedDay() {
  const selected = document.getElementById("day-" + state.selectedDay);
  const scroller = selected && selected.closest(".scroll");
  if (!selected || !scroller) return;
  const sticky = scroller.querySelector(".cal-top");
  const stickyH = sticky ? sticky.offsetHeight : 0;
  const pad = parseFloat(getComputedStyle(scroller).paddingTop) || 0;
  scroller.style.setProperty("--cal-sticky", (stickyH + pad) + "px");
  const top = selected.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  // Sticky top is the scrollport's padding edge, so the day title clears both.
  scroller.scrollTop = Math.max(0, scroller.scrollTop + top - stickyH - pad);
}

function bindAfter() {
  const groc = document.getElementById("groc-new");
  if (groc) groc.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const text = groc.value.trim();
      groc.value = "";
      if (text) addGrocery(text);
    }
  });
  const photo = document.getElementById("photo-file");
  if (photo) photo.addEventListener("change", async () => {
    const files = [...(photo.files || [])];
    for (const file of files) {
      try {
        if (!state.demo) await api.uploadPhoto(await file.arrayBuffer(), file.type || "image/jpeg");
        state.sends.unshift({ name: file.name, note: "On the display" });
      } catch (err) { state.error = err.message; }
    }
    render();
  });
  const bright = document.getElementById("bright");
  if (bright) bright.addEventListener("change", async () => {
    const value = Number(bright.value);
    state.status.brightness = value;
    if (!state.demo) {
      try { state.status = await api.brightness(value); } catch (err) { state.error = err.message; }
    }
    render();
  });
  bindSwipes();
}

function bindSwipes() {
  document.querySelectorAll("[data-swipe]").forEach((wrap) => {
    const row = wrap.firstElementChild;
    if (!row) return;
    let startX = 0, startY = 0, dx = 0, tracking = false, horizontal = false;
    wrap.addEventListener("touchstart", (e) => {
      const pt = e.touches[0];
      startX = pt.clientX; startY = pt.clientY; dx = 0; tracking = true; horizontal = false;
    }, { passive: true });
    wrap.addEventListener("touchmove", (e) => {
      if (!tracking) return;
      const pt = e.touches[0];
      const x = pt.clientX - startX, y = pt.clientY - startY;
      if (!horizontal) {
        if (Math.abs(x) < 8 && Math.abs(y) < 8) return;
        if (Math.abs(y) > Math.abs(x)) { tracking = false; return; }
        horizontal = true;
        wrap.classList.add("swiping");
      }
      dx = Math.min(0, x);
      row.style.transform = "translate3d(" + dx + "px,0,0)";
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    wrap.addEventListener("touchend", () => {
      if (!tracking && !horizontal) return;
      tracking = false;
      wrap.classList.remove("swiping");
      if (dx < -72) { row.style.transform = ""; askSwipe(wrap.dataset.swipe, wrap.dataset.id); }
      else row.style.transform = "";
    });
    wrap.addEventListener("touchcancel", () => {
      tracking = false;
      wrap.classList.remove("swiping");
      row.style.transform = "";
    });
  });
}

function askSwipe(kind, id) {
  if (kind === "event") state.confirm = { type: "event", id };
  else if (kind === "grocery") {
    const g = state.snapshot.groceries.find((x) => x.id === id);
    if (g) state.confirm = { type: "grocery", id, text: g.text };
  } else if (kind === "chore") withParent("Delete this chore?", () => deleteChore(id));
  else if (kind === "recipe") withParent("Delete this recipe?", () => deleteRecipe(id));
  else if (kind === "meal") {
    const parts = id.split(":");
    withParent("Clear this meal?", () => clearMeal(parts[0], parts[1]));
  }
  render();
}

async function loadVisiblePhotos() {
  document.querySelectorAll("[data-photo]").forEach(async (el) => {
    const path = el.getAttribute("data-photo");
    if (!path || state.demo) return;
    try {
      const blob = await api.image(path);
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.src = url;
      img.alt = "";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      el.replaceWith(img);
    } catch (_) { /* placeholder stays */ }
  });
}

document.getElementById("app").addEventListener("click", (e) => {
  const hit = e.target.closest("[data-act]");
  if (!hit) return;
  handle(hit.dataset.act, hit.dataset.id, hit);
});

async function handle(act, id, hit) {
  if (act === "tab") state.tab = id;
  else if (act === "section") {
    if (id === "chores" || id === "rewards") { state.tab = "chores"; state.section.chores = id; }
    if (id === "meals" || id === "recipes") { state.tab = "food"; state.section.food = id; }
  } else if (act === "open") state.tab = id;
  else if (act === "menu") state.menu = !state.menu;
  else if (act === "menu-close" && hit.classList.contains("quick-menu")) state.menu = false;
  else if (act === "week") {
    state.weekStart = addDays(state.weekStart, Number(id) * 7);
    state.selectedDay = isoDay(state.weekStart);
    await refresh();
    return;
  } else if (act === "today") {
    state.weekStart = startOfWeek(state.now());
    state.selectedDay = isoDay(state.now());
    await refresh();
    return;
  } else if (act === "day") state.selectedDay = id;
  else if (act === "event") state.modal = { type: "event", id };
  else if (act === "close-modal") state.modal = null;
  else if (act === "close-confirm") state.confirm = null;
  else if (act === "ask-del-event") state.confirm = { type: "event", id };
  else if (act === "del-event") { await deleteEvent(id, hit.dataset.scope || "this"); return; }
  else if (act === "toggle-chore") { await toggleChore(id); return; }
  else if (act === "toggle-groc") { await toggleGrocery(id); return; }
  else if (act === "clear-done") { await clearDone(); return; }
  else if (act === "del-groc") { await deleteGrocery(id); return; }
  else if (act === "undo") { await undoGrocery(); return; }
  else if (act === "filter") state.filterMember = id || null;
  else if (act === "rfilter") state.recipeFilter = id || null;
  else if (act === "recipe") state.modal = { type: "recipe", id };
  else if (act === "meal") { await openMeal(id); return; }
  else if (act === "pick-recipe") { await pickRecipe(id); return; }
  else if (act === "rate") { await rateRecipe(id, Number(hit.dataset.n)); return; }
  else if (act === "del-recipe") { await withParent("Delete this recipe?", () => deleteRecipe(id)); return; }
  else if (act === "redeem") { await withParent("Redeem this reward?", () => redeem(id)); return; }
  else if (act === "give") state.modal = { type: "give", id };
  else if (act === "save-give") { await saveGive(id); return; }
  else if (act === "remote") { await doRemote(id); return; }
  else if (act === "add") {
    state.menu = false;
    if (id === "event") state.modal = { type: "add-event" };
    else if (id === "task") state.modal = { type: "add-task" };
    else if (id === "grocery") state.tab = "groceries";
    else if (id === "meal") { state.tab = "food"; state.section.food = "meals"; }
    else if (id === "photo") state.tab = "photos";
  } else if (act === "save-event") { await saveEvent(); return; }
  else if (act === "save-task") { await saveTask(); return; }
  else if (act === "claim") { await claim(); return; }
  else if (act === "show-pair") { state.paired = null; saveSession(null); }
  else if (act === "unpair") state.confirm = { type: "unpair" };
  else if (act === "do-unpair") { await unpair(); return; }
  else if (act === "lock-parent") {
    state.parentToken = null; state.parentExpires = 0;
    if (!state.demo) try { await api.lockParent(); } catch (_) {}
  } else if (act === "setup-face") { await setupFace(); return; }
  else if (act === "unlock-face") { await doUnlock(); return; }
  else if (act === "unlock-skip") { state.unlocked = true; state.needUnlock = false; }
  else if (act === "pin-key") { pinKey(id); return; }
  render();
}

async function withParent(purpose, fn) {
  if ((state.parentToken && Date.now() < state.parentExpires) || state.demo) { await fn(); return; }
  state.pin = { purpose, fn };
  state.pinDigits = "";
  state.pinMsg = "";
  render();
}

function pinKey(key) {
  if (key === "cancel") { state.pin = null; state.pinDigits = ""; render(); return; }
  if (key === "back") { state.pinDigits = (state.pinDigits || "").slice(0, -1); render(); return; }
  if ((state.pinDigits || "").length >= 4) return;
  state.pinDigits += key;
  render();
  if (state.pinDigits.length === 4) setTimeout(() => submitPin(state.pinDigits), 120);
}

async function submitPin(pin) {
  try {
    if (state.demo) {
      state.parentToken = "demo";
      state.parentExpires = Date.now() + 300000;
    } else {
      const res = await api.verifyPin(pin);
      state.parentToken = res.parentToken;
      state.parentExpires = res.expiresAt || (Date.now() + 300000);
    }
    const fn = state.pin && state.pin.fn;
    state.pin = null;
    state.pinDigits = "";
    state.pinMsg = "";
    render();
    if (fn) await fn();
  } catch (err) {
    state.pinDigits = "";
    state.pinMsg = (err.body && err.body.message) || err.message || "Wrong PIN";
    render();
  }
}

async function refresh() {
  if (state.demo) {
    if (!state.snapshot.members.length) {
      state.snapshot = demoSnapshot();
      state.events = demoEvents(state.now());
      state.meals = demoMeals(state.now());
      state.recipes = structuredClone(DEMO_RECIPES);
      state.status = Object.assign({}, DEMO_STATUS);
    }
    state.route = "lan";
    render();
    return;
  }
  if (!state.paired) { render(); return; }
  state.loading = true;
  try {
    const from = isoDay(addDays(state.weekStart, -1));
    const to = isoDay(addDays(state.weekStart, 8));
    const [snap, events, meals, recipes, status] = await Promise.all([
      api.snapshot(),
      api.events(from, to).catch(() => []),
      api.meals(from, to).catch(() => ({})),
      api.recipes().catch(() => []),
      api.status().catch(() => state.status)
    ]);
    state.snapshot = snap;
    state.events = Array.isArray(events) ? events : (events.events || []);
    state.meals = meals.meals || meals;
    state.recipes = Array.isArray(recipes) ? recipes : (recipes.recipes || []);
    state.status = status;
    state.error = null;
    state.route = "lan";
  } catch (err) {
    state.error = err.message;
    state.route = "offline";
  }
  state.loading = false;
  render();
}

async function toggleChore(id) {
  const chore = state.snapshot.chores.find((c) => c.id === id);
  if (!chore) return;
  chore.done = !chore.done;
  render();
  if (!state.demo) {
    try { await api.setChoreDone(id, chore.done); } catch (err) { chore.done = !chore.done; state.error = err.message; render(); }
  }
}

async function toggleGrocery(id) {
  const g = state.snapshot.groceries.find((x) => x.id === id);
  if (!g) return;
  g.done = !g.done;
  render();
  if (!state.demo) {
    try { await api.setGroceryDone(id, g.done); } catch (err) { g.done = !g.done; state.error = err.message; render(); }
  }
}

async function addGrocery(text) {
  if (state.demo) state.snapshot.groceries.unshift({ id: "g" + Date.now(), text, done: false });
  else {
    try { state.snapshot.groceries.unshift(await api.addGrocery(text)); }
    catch (err) { state.error = err.message; }
  }
  render();
}

async function deleteGrocery(id) {
  const g = state.snapshot.groceries.find((x) => x.id === id);
  state.snapshot.groceries = state.snapshot.groceries.filter((x) => x.id !== id);
  state.confirm = null;
  if (g) {
    state.undo = Object.assign({}, g, { until: Date.now() + 6000 });
    setTimeout(() => { if (state.undo && state.undo.id === g.id) { state.undo = null; render(); } }, 6000);
  }
  render();
  if (!state.demo && g) {
    try { await api.deleteGrocery(id); } catch (err) { state.error = err.message; state.snapshot.groceries.push(g); render(); }
  }
}

async function undoGrocery() {
  const g = state.undo;
  state.undo = null;
  if (!g) return;
  if (state.demo) state.snapshot.groceries.unshift(g);
  else {
    try { state.snapshot.groceries.unshift(await api.addGrocery(g.text)); }
    catch (err) { state.error = err.message; }
  }
  render();
}

async function clearDone() {
  if (state.demo) state.snapshot.groceries = state.snapshot.groceries.filter((g) => !g.done);
  else {
    try { await api.clearDoneGroceries(); state.snapshot.groceries = state.snapshot.groceries.filter((g) => !g.done); }
    catch (err) { state.error = err.message; }
  }
  render();
}

async function deleteEvent(id, scope) {
  const ev = state.events.find((e) => e.id === id);
  const recurring = ev && ev.repeat && ev.repeat !== "never";
  const needs = recurring && (scope === "following" || scope === "all");
  const run = async () => {
    if (state.demo) state.events = state.events.filter((e) => e.id !== id);
    else {
      try { await api.deleteEvent(id, scope, state.parentToken); state.events = state.events.filter((e) => e.id !== id); }
      catch (err) {
        if (err.error === "parent_pin_required") return withParent("Delete repeating events?", () => deleteEvent(id, scope));
        state.error = err.message;
      }
    }
    state.confirm = null;
    state.modal = null;
    render();
  };
  if (needs && !(state.parentToken && Date.now() < state.parentExpires) && !state.demo) {
    return withParent("Delete repeating events?", run);
  }
  await run();
}

async function deleteChore(id) {
  if (state.demo) state.snapshot.chores = state.snapshot.chores.filter((c) => c.id !== id);
  else {
    try { await api.deleteChore(id, state.parentToken); state.snapshot.chores = state.snapshot.chores.filter((c) => c.id !== id); }
    catch (err) { state.error = err.message; }
  }
  render();
}

async function deleteRecipe(id) {
  if (state.demo) state.recipes = state.recipes.filter((r) => r.id !== id);
  else {
    try { await api.deleteRecipe(id, state.parentToken); state.recipes = state.recipes.filter((r) => r.id !== id); }
    catch (err) { state.error = err.message; }
  }
  state.modal = null;
  render();
}

async function clearMeal(date, slot) {
  delete state.meals[date + ":" + slot];
  if (!state.demo) {
    try { await api.clearMeal(date, slot, state.parentToken); } catch (err) { state.error = err.message; }
  }
  render();
}

async function openMeal(key) {
  const parts = key.split(":");
  const meal = state.meals[key];
  const recipe = meal && meal.recipeId ? state.recipes.find((r) => r.id === meal.recipeId) : null;
  if (recipe) state.modal = { type: "recipe", id: recipe.id };
  else if (!meal) state.modal = { type: "picker", slot: parts[1], date: parts[0] };
  render();
}

async function pickRecipe(id) {
  const modal = state.modal;
  if (!modal || modal.type !== "picker") return;
  const meal = { recipeId: id, status: "planned", locked: false, servings: 4, addedToGrocery: [] };
  state.meals[modal.date + ":" + modal.slot] = meal;
  if (!state.demo) {
    try { await api.setMeal(modal.date, modal.slot, meal); } catch (err) { state.error = err.message; }
  }
  state.modal = null;
  render();
}

async function rateRecipe(id, n) {
  const r = state.recipes.find((x) => x.id === id);
  if (!r) return;
  r.rating = r.rating === n ? null : n;
  render();
  if (!state.demo) {
    try { Object.assign(r, await api.rateRecipe(id, r.rating)); } catch (err) { state.error = err.message; }
    render();
  }
}

async function redeem(id) {
  if (state.demo) {
    const r = state.snapshot.rewards.find((x) => x.id === id);
    if (r) state.snapshot.spent[r.memberId] = (state.snapshot.spent[r.memberId] || 0) + r.cost;
  } else {
    try { state.snapshot.spent = await api.redeem(id, state.parentToken); } catch (err) { state.error = err.message; }
  }
  render();
}

async function saveGive(id) {
  const stars = Number((document.getElementById("give-stars") || {}).value || 2);
  const reason = (document.getElementById("give-reason") || {}).value || "";
  const run = async () => {
    if (state.demo) state.snapshot.bonus[id] = (state.snapshot.bonus[id] || 0) + stars;
    else {
      try { state.snapshot.bonus = await api.giveStars(id, stars, reason, state.parentToken); }
      catch (err) { state.error = err.message; }
    }
    state.modal = null;
    render();
  };
  state.modal = null;
  await withParent("Give bonus stars?", run);
}

async function saveEvent() {
  const title = (document.getElementById("ev-title") || {}).value || "";
  const date = (document.getElementById("ev-date") || {}).value || state.selectedDay;
  const start = (document.getElementById("ev-start") || {}).value || "16:00";
  const end = (document.getElementById("ev-end") || {}).value || "17:00";
  const ev = {
    id: "local-" + Date.now(), title, memberId: "family", who: [], source: "google",
    calendar: FAMILY_CAL, allDay: false, start: date + "T" + start + ":00", end: date + "T" + end + ":00", repeat: "never"
  };
  if (state.demo) state.events.push(ev);
  else {
    try { state.events.push(await api.addEvent({ title, start: ev.start, end: ev.end, memberId: "family", who: [], allDay: false, repeat: "never" })); }
    catch (err) { state.error = err.message; }
  }
  state.modal = null;
  render();
}

async function saveTask() {
  const title = (document.getElementById("task-title") || {}).value || "";
  const memberId = (document.getElementById("task-who") || {}).value || "ella";
  const tod = (document.getElementById("task-tod") || {}).value || "afternoon";
  const stars = Number((document.getElementById("task-stars") || {}).value || 1);
  if (state.demo) state.snapshot.chores.push({ id: "c" + Date.now(), title, memberId, stars, tod, repeat: "Once", done: false });
  else {
    try {
      const saved = await api.addChore({ title, memberId, stars, tod, repeat: "Once" });
      state.snapshot.chores.push(...(Array.isArray(saved) ? saved : [saved]));
    } catch (err) { state.error = err.message; }
  }
  state.modal = null;
  render();
}

async function doRemote(cmd) {
  if (!state.demo) {
    try { state.status = await api.remote(cmd); } catch (err) { state.error = err.message; }
  } else {
    if (cmd === "wake") state.status.awake = true;
    if (cmd === "sleep") state.status.awake = false;
  }
  render();
}

async function claim() {
  const code = ((document.getElementById("pair-code") || {}).value || "").trim();
  const base = ((document.getElementById("pair-url") || {}).value || "http://192.168.50.223:8080").replace(/\/$/, "");
  if (!code) { state.error = "Enter the pairing code from the display."; render(); return; }
  try {
    saveSession({ token: "pending", base });
    const res = await api.claim({ code, deviceName: "Family iPhone", platform: "pwa" });
    saveSession({ token: res.token, deviceId: res.deviceId, displayName: res.displayName, base, lanHost: base.replace(/^https?:\/\//, "") });
    state.paired = loadSession();
    state.error = null;
    await refresh();
  } catch (err) {
    saveSession(null);
    state.paired = null;
    state.error = err.message;
    render();
  }
}

async function unpair() {
  state.confirm = null;
  if (!state.demo && state.paired) {
    try { await api.revoke(state.paired.deviceId, state.parentToken); } catch (_) {}
  }
  saveSession(null);
  saveCred(null);
  state.paired = null;
  render();
}

async function setupFace() {
  if (loadCred()) { saveCred(null); render(); return; }
  try { await registerPasskey(); state.error = ""; }
  catch (err) { state.error = err.message; }
  render();
}

async function doUnlock() {
  try { await unlockWithPasskey(); state.unlocked = true; state.needUnlock = false; state.lockError = ""; }
  catch (err) { state.lockError = err.message; }
  render();
}

if (requested === "lock") { state.needUnlock = true; state.unlocked = false; }
else if (!SHOT && loadCred() && (state.paired || state.demo)) { state.needUnlock = true; state.unlocked = false; }

syncStandaloneViewport();
window.addEventListener("resize", syncStandaloneViewport);
window.addEventListener("orientationchange", syncStandaloneViewport);
if (window.visualViewport) window.visualViewport.addEventListener("resize", syncStandaloneViewport);

if ("serviceWorker" in navigator && !DEMO) {
  // Reload only when a new worker replaces one that already controlled the page.
  // localStorage pairing and the Face ID credential are left untouched.
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (window.__fdReloading) return;
      window.__fdReloading = true;
      location.reload();
    });
  }
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

function syncStandaloneViewport() {
  const root = document.documentElement;
  const standalone = window.navigator.standalone === true
    || window.matchMedia("(display-mode: standalone)").matches;
  root.classList.toggle("standalone", standalone);
  if (!standalone) {
    root.style.removeProperty("--standalone-gap");
    return;
  }
  const vv = window.visualViewport;
  const viewH = vv ? vv.height : window.innerHeight;
  const offsetTop = vv ? vv.offsetTop : 0;
  const gap = Math.round(window.screen.height - viewH - offsetTop);
  root.style.setProperty("--standalone-gap", (gap > 8 ? gap : 0) + "px");
}

refresh();

if (!SHOT) {
  const tick = () => { if (state.tab === "calendar" && !state.modal && !state.nowOverride) render(); };
  setTimeout(() => { tick(); setInterval(tick, 60000); }, (60 - new Date().getSeconds()) * 1000);
}

if (params.get("confirm") === "event") {
  const ready = setInterval(() => {
    if (state.events.length) {
      clearInterval(ready);
      const ev = state.events.find((e) => e.id === "e3") || state.events[0];
      state.confirm = { type: "event", id: ev.id };
      render();
    }
  }, 50);
}
