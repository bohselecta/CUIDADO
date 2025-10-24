import { latestLessons, latestOutcomeCards } from "../../src/lib/memory";

const lessons = latestLessons(5);
const episodes = latestOutcomeCards(5);
console.log("Lessons:");
for (const l of lessons) console.log("-", new Date(l.ts).toISOString(), l.text.slice(0,100));
console.log("\nEpisodes:");
for (const e of episodes) console.log("-", new Date(e.ts).toISOString(), e.outcome, e.plan.join(">"));
