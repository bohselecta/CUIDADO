import type { Fragment } from "@/types";
import { bm25TopK, denseTopK, rrfFuse, Retrieved } from "./retrieval";

export async function hybridRetrieve(frags: Fragment[], qvec: number[], query: string, k = 6) {
  const bm = bm25TopK(frags, query, k);
  const dn = denseTopK(frags, qvec, k);
  const fused = rrfFuse(dn, bm, k, 60);
  // annotate provenance: include original sub-scores if present
  const bmMap = new Map(bm.map(x=>[x.id,x.score]));
  const dnMap = new Map(dn.map(x=>[x.id,x.score]));
  const used = fused.map(u => ({
    ...u,
    dense: dnMap.get(u.id) ?? 0,
    bm25: bmMap.get(u.id) ?? 0
  }));
  return used;
}
