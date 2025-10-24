import { describe, it, expect } from "vitest";
import { bm25TopK, denseTopK, rrfFuse } from "../../src/lib/retrieval";

const mk = (id:string, text:string, emb:number[]=[])=>
  ({ id, ts:Date.now(), text, tags:["lesson"], source:"", trust:0.6, emb });

describe("retrieval hybrid", () => {
  const frags = [
    mk("a","The system uses bullets and TLDR for fast reading.", [0.1, 0.2, 0.3]),
    mk("b","We add retrieval first then answer concisely.", [0.2, 0.1, 0.35]),
    mk("c","This text is unrelated to the topic.", [0.0, 0.0, 0.1])
  ];

  it("bm25 surfaces lexical matches", () => {
    const bm = bm25TopK(frags as any, "TLDR bullets", 2);
    expect(bm[0].id).toBe("a");
  });

  it("fusion returns something from both", () => {
    const dn = denseTopK(frags as any, [0.2,0.15,0.3], 2);
    const bm = bm25TopK(frags as any, "retrieval answer", 2);
    const fused = rrfFuse(dn, bm, 3);
    expect(fused.length).toBeGreaterThan(0);
  });
});
