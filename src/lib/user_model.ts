import type { UserModel } from "@/types";

let model: UserModel = {
  id: "default",
  traits: ["direct","builder","design-driven"],
  values: ["clarity","craft","speed"],
  goals: ["ship usable things"],
  stylePrefs: ["bullets","code-first","no-fluff"],
  lastSummary: ""
};

export function getUserModel(): UserModel { return model; }
export function setUserPrefs(partial: Partial<UserModel>) { model = { ...model, ...partial }; }
export function updateSessionSummary(delta: string) {
  model.lastSummary = ((model.lastSummary || "") + " " + delta).trim();
}
