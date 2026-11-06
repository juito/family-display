const PEOPLE = {
  1: { fill: "#F2D3F8", ink: "#5E2868", accent: "#945B9F" },
  2: { fill: "#D7FCD9", ink: "#01511A", accent: "#3D8749" },
  3: { fill: "#FCC9D7", ink: "#711E40", accent: "#AC5371" },
  4: { fill: "#CDCEFA", ink: "#3B327C", accent: "#6D69B8" },
  5: { fill: "#D3FFFD", ink: "#024D4C", accent: "#0A8585" },
  6: { fill: "#FEF7C8", ink: "#4C4302", accent: "#857501" }
};

export const MEMBERS = [
  { id: "juito", name: "Juito", role: "Dad", initial: "J", emoji: "☕🚲", person: 4 },
  { id: "meyrien", name: "Meyrien", role: "Mom", initial: "M", emoji: "🌿📖", person: 3 },
  { id: "ella", name: "Ella", role: "Kid", initial: "E", emoji: "🎨🌸", person: 1, age: 9 },
  { id: "leo", name: "Leo", role: "Kid", initial: "L", emoji: "⚽🦖", person: 2, age: 6 },
  { id: "oma", name: "Oma", role: "Grandma", initial: "O", emoji: "🧶🍪", person: 5 },
  { id: "family", name: "Family", role: "Shared", initial: "F", emoji: "🏠", person: 6 }
].map((m) => ({ ...m, color: { key: m.id, ...PEOPLE[m.person] } }));

export function paint(person, color) {
  if (color && color.fill && color.ink) return { fill: color.fill, ink: color.ink, accent: color.mid || color.accent };
  return PEOPLE[person] || PEOPLE[6];
}

function chore(id, title, memberId, stars, tod, repeat, done) {
  return { id, title, memberId, stars, tod, repeat, done };
}

export const CHORES = [
  chore("pack", "Pack lunches", "juito", 2, "morning", "Daily", true),
  chore("trash", "Take out trash", "juito", 1, "afternoon", "Weekly", false),
  chore("counters", "Wipe counters", "juito", 1, "evening", "Daily", false),
  chore("empty-dw", "Empty dishwasher", "meyrien", 2, "morning", "Daily", true),
  chore("groc-prep", "Grocery list", "meyrien", 1, "afternoon", "Weekly", true),
  chore("load-dw", "Load dishwasher", "meyrien", 1, "evening", "Daily", false),
  chore("bed", "Make bed", "ella", 1, "morning", "Daily", true),
  chore("homework", "Homework", "ella", 2, "afternoon", "Weekdays", true),
  chore("bag", "Pack soccer bag", "ella", 1, "afternoon", "Weekly", false),
  chore("room-e", "Clean room", "ella", 2, "evening", "Weekly", false),
  chore("dog", "Feed the dog", "leo", 1, "morning", "Daily", true),
  chore("piano-c", "Practice piano", "leo", 2, "afternoon", "Daily", false),
  chore("toys", "Put toys away", "leo", 2, "afternoon", "Daily", false),
  chore("table", "Set the table", "leo", 1, "evening", "Daily", true),
  chore("clothes", "Lay out clothes", "leo", 1, "evening", "Daily", false),
  chore("oma-fern", "Water the fern", "oma", 1, "morning", "Weekly", false),
  chore("oma-cookies", "Fill the cookie tin", "oma", 1, "afternoon", "Weekly", false),
  chore("oma-story", "Bedtime story", "oma", 1, "evening", "Daily", true),
  chore("recycle", "Take out recycling", "family", 1, "morning", "Weekly", false),
  chore("plants", "Water the plants", "family", 1, "afternoon", "Weekly", false),
  chore("mail", "Bring in the mail", "family", 1, "afternoon", "Daily", false),
  chore("tidy", "Tidy the living room", "family", 1, "evening", "Daily", false)
];

export const GROCERIES = [
  { id: "g1", text: "Milk", done: false },
  { id: "g2", text: "Eggs", done: false },
  { id: "g3", text: "Bananas", done: true },
  { id: "g4", text: "Sourdough bread", done: false },
  { id: "g5", text: "Chicken thighs", done: false },
  { id: "g6", text: "Broccoli", done: false },
  { id: "g7", text: "Tortillas", done: false },
  { id: "g8", text: "Birthday candles", done: true }
];

export const REWARDS = [
  { id: "ice", memberId: "ella", title: "Ice cream trip", cost: 20 },
  { id: "book", memberId: "ella", title: "New book", cost: 15 },
  { id: "movie", memberId: "ella", title: "Movie night", cost: 30 },
  { id: "lego", memberId: "leo", title: "Lego set", cost: 25 },
  { id: "park", memberId: "leo", title: "Playground afternoon", cost: 10 },
  { id: "late", memberId: "leo", title: "Stay up late", cost: 8 }
];

export const RECIPES = [
  { id: "pancakes", title: "Buttermilk pancakes", types: ["breakfast"], minutes: 25, servings: 4, tag: "Weekend", rating: 5, ingredients: [{ label: "2 cups flour" }, { label: "2 eggs" }, { label: "1¾ cups buttermilk" }], steps: ["Whisk dry ingredients.", "Stir in wet ingredients.", "Cook on a buttered griddle."] },
  { id: "oatmeal", title: "Cinnamon oatmeal", types: ["breakfast"], minutes: 10, servings: 4, tag: "Everyday", rating: 4, ingredients: [{ label: "2 cups oats" }, { label: "Cinnamon" }], steps: ["Simmer oats.", "Add cinnamon and fruit."] },
  { id: "quesadilla", title: "Cheese quesadillas", types: ["lunch", "snack"], minutes: 15, servings: 4, tag: "Kid favorite", rating: 5, ingredients: [{ label: "Tortillas" }, { label: "Cheddar" }], steps: ["Fill tortillas.", "Toast until melted."] },
  { id: "soup", title: "Tomato soup", types: ["lunch", "dinner"], minutes: 30, servings: 4, tag: "Cozy", rating: 4, ingredients: [{ label: "Tomatoes" }, { label: "Onion" }, { label: "Cream" }], steps: ["Sweat onion.", "Simmer tomatoes.", "Blend and finish with cream."] },
  { id: "tacos", title: "Chicken tacos", types: ["dinner"], minutes: 35, servings: 4, tag: "Family", rating: 5, ingredients: [{ label: "Chicken thighs" }, { label: "Tortillas" }, { label: "Salsa" }], steps: ["Season and roast chicken.", "Warm tortillas.", "Serve with salsa."] },
  { id: "salmon", title: "Honey salmon", types: ["dinner"], minutes: 22, servings: 4, tag: "Weeknight", rating: 4, ingredients: [{ label: "Salmon" }, { label: "Honey" }, { label: "Soy sauce" }], steps: ["Mix glaze.", "Bake 12–15 minutes."] },
  { id: "apples", title: "Apple slices & peanut butter", types: ["snack"], minutes: 0, servings: 2, tag: "After school", rating: 5, ingredients: [{ label: "Apples" }, { label: "Peanut butter" }], steps: ["Slice apples.", "Serve with peanut butter."] },
  { id: "smoothie", title: "Berry smoothie", types: ["breakfast", "snack"], minutes: 5, servings: 2, tag: "Quick", rating: 4, ingredients: [{ label: "Frozen berries" }, { label: "Yogurt" }, { label: "Banana" }], steps: ["Blend until smooth."] }
];

function isoDay(d) {
  const tz = "America/Los_Angeles";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const pick = (t) => parts.find((p) => p.type === t).value;
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

function at(day, hour, minute) {
  return `${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

export function demoEvents(now = new Date()) {
  const today = isoDay(now);
  const cal = "EBI & EBI";
  const plus = (n) => {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() + n);
    return isoDay(d);
  };
  return [
    { id: "e1", title: "School drop-off", memberId: "ella", who: ["ella", "leo"], source: "google", calendar: cal, allDay: false, start: at(today, 8, 10), end: at(today, 8, 30), location: "School", notes: null, repeat: "weekdays" },
    { id: "e2", title: "Piano", memberId: "leo", who: ["leo"], source: "google", calendar: cal, allDay: false, start: at(today, 15, 30), end: at(today, 16, 15), location: "Home", notes: null, repeat: "weekly" },
    { id: "e3", title: "Soccer practice", memberId: "ella", who: ["ella"], source: "google", calendar: cal, allDay: false, start: at(today, 17, 0), end: at(today, 18, 15), location: "Field 2", notes: null, repeat: "weekly" },
    { id: "e4", title: "Family dinner", memberId: "family", who: [], source: "google", calendar: cal, allDay: false, start: at(today, 18, 30), end: at(today, 19, 30), location: null, notes: null, repeat: "never" },
    { id: "e5", title: "Library books due", memberId: "meyrien", who: ["meyrien"], source: "google", calendar: cal, allDay: true, start: `${today}T00:00:00`, end: `${plus(1)}T00:00:00`, location: null, notes: null, repeat: "never" },
    { id: "e6", title: "Oma visits", memberId: "oma", who: ["oma"], source: "google", calendar: cal, allDay: false, start: at(plus(1), 10, 0), end: at(plus(1), 16, 0), location: "Home", notes: "Bring cookie tin", repeat: "never" },
    { id: "e7", title: "Test4 u", memberId: "ella", who: ["ella", "leo", "family"], source: "google", calendar: cal, allDay: false, start: at(plus(2), 16, 0), end: at(plus(2), 17, 0), location: null, notes: null, repeat: "never" }
  ];
}

export function demoMeals(now = new Date()) {
  const today = isoDay(now);
  const plus = (n) => {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() + n);
    return isoDay(d);
  };
  return {
    [`${today}:breakfast`]: { recipeId: "pancakes", status: "planned", locked: false, servings: 4, addedToGrocery: [] },
    [`${today}:lunch`]: { recipeId: "quesadilla", status: "planned", locked: false, servings: 4, addedToGrocery: [] },
    [`${today}:dinner`]: { recipeId: "tacos", status: "planned", locked: false, servings: 4, addedToGrocery: [] },
    [`${today}:snack`]: { recipeId: "apples", status: "planned", locked: false, servings: 2, addedToGrocery: [] },
    [`${plus(1)}:dinner`]: { recipeId: "salmon", status: "idea", locked: false, servings: 4, addedToGrocery: [] }
  };
}

export function snapshot() {
  return {
    members: structuredClone(MEMBERS),
    chores: structuredClone(CHORES),
    groceries: structuredClone(GROCERIES),
    rewards: structuredClone(REWARDS),
    bonus: { ella: 17, leo: 8 },
    spent: {}
  };
}

export const STATUS = {
  name: "Family Display",
  awake: true,
  brightness: 70,
  saver: false,
  battery: 64,
  charging: true
};
