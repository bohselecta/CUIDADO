import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
const ROOT = path.join(process.cwd(), "src/policy");
export const readPersona = () => YAML.parse(fs.readFileSync(path.join(ROOT,"persona.yaml"),"utf8"));
export const readConstitution = () => YAML.parse(fs.readFileSync(path.join(ROOT,"constitution.yaml"),"utf8"));
export const readAllow = () => YAML.parse(fs.readFileSync(path.join(ROOT,"allowlist.yaml"),"utf8"));
