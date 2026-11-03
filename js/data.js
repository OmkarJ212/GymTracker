/**
 * Iron Log - Default Exercises, Constants & Configuration
 */
var LS_KEY = "ironlog.v2";

var THEMES = {
  "nike-volt": {
    id: "nike-volt",
    name: "Green",
    type: "light",
    desc: "Chalk & Green",
    metaColor: "#f4f5f8"
  },
  "strava-blaze": {
    id: "strava-blaze",
    name: "Orange",
    type: "light",
    desc: "Sand & Orange",
    metaColor: "#f8f6f3"
  },
  "apple-fitness": {
    id: "apple-fitness",
    name: "Blue",
    type: "light",
    desc: "Silver & Blue",
    metaColor: "#f3f5f9"
  },
  "onyx-volt": {
    id: "onyx-volt",
    name: "Dark Green",
    type: "dark",
    desc: "Onyx & Green",
    metaColor: "#0d0e12"
  },
  "cyber-hud": {
    id: "cyber-hud",
    name: "Dark Cyan",
    type: "dark",
    desc: "Navy & Cyan",
    metaColor: "#07090f"
  },
  "rogue-iron": {
    id: "rogue-iron",
    name: "Dark Red",
    type: "dark",
    desc: "Matte & Crimson",
    metaColor: "#09090c"
  }
};

var DEFAULT_THEME = "nike-volt";

var DEFAULT_EXERCISES = [
  { id: "bench-press", name: "Barbell Bench Press", cat: "Chest" },
  { id: "incline-db-press", name: "Incline Chest Press Machine", cat: "Chest" },
  { id: "chest-press-machine", name: "Chest Press Machine", cat: "Chest" },
  { id: "chest-fly", name: "Cable Chest Fly", cat: "Chest" },
  { id: "push-up", name: "Push-Up", cat: "Chest" },
  { id: "deadlift", name: "Deadlift", cat: "Back" },
  { id: "pull-up", name: "Assisted Pull-up Machine", cat: "Back" },
  { id: "barbell-row", name: "Barbell Row", cat: "Back" },
  { id: "lat-pulldown", name: "Lat Pulldown / Alternative", cat: "Back" },
  { id: "seated-row", name: "Seated Row Machine", cat: "Back" },
  { id: "squat", name: "Barbell Back Squat", cat: "Legs" },
  { id: "hack-squat-machine", name: "Hack Squat Machine", cat: "Legs" },
  { id: "leg-press", name: "Leg Press", cat: "Legs" },
  { id: "romanian-deadlift", name: "Romanian Deadlift", cat: "Legs" },
  { id: "leg-curl", name: "Seated Leg Curl", cat: "Legs" },
  { id: "leg-extension", name: "Leg Extension", cat: "Legs" },
  { id: "calf-raise", name: "Calf Raise Machine", cat: "Legs" },
  { id: "lunge", name: "Walking Lunge", cat: "Legs" },
  { id: "ohp", name: "Shoulder Press Machine", cat: "Shoulders" },
  { id: "lateral-raise", name: "Lateral Raise Machine / Dumbbell Lateral Raise", cat: "Shoulders" },
  { id: "rear-delt-fly", name: "Rear Delt Fly Machine", cat: "Shoulders" },
  { id: "face-pull", name: "Face Pull", cat: "Shoulders" },
  { id: "barbell-curl", name: "Barbell Curl", cat: "Arms" },
  { id: "hammer-curl", name: "Hammer Curl", cat: "Arms" },
  { id: "preacher-curl-machine", name: "Preacher Curl Machine", cat: "Arms" },
  { id: "tricep-pushdown", name: "Tricep Pushdown", cat: "Arms" },
  { id: "skull-crusher", name: "Skull Crusher", cat: "Arms" },
  { id: "plank", name: "Plank", cat: "Core" },
  { id: "hanging-leg-raise", name: "Hanging Knee Raises", cat: "Core" },
  { id: "cable-crunch", name: "Cable Crunch", cat: "Core" },
  { id: "treadmill", name: "Treadmill Run", cat: "Cardio" },
  { id: "incline-treadmill-walk", name: "Incline Treadmill Walk", cat: "Cardio" },
  { id: "cycling", name: "Cycling", cat: "Cardio" },
  { id: "rowing-machine", name: "Rowing Machine", cat: "Cardio" }
];

var DEFAULT_VIDEOS = {};

var CATS = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio"];

var PLAN_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

var DAY_NAMES_FULL = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday"
};
