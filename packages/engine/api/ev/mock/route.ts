import { NextRequest, NextResponse } from "next/server";
import { setEVFeatures, getEVFeatures } from "@/lib/env_voice";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "desk";

  // presets
  if (mode === "walk") setEVFeatures({ movement:"walking", energyMean:0.7, speaking:false, distraction:"medium" });
  else if (mode === "drive") setEVFeatures({ movement:"driving", energyMean:0.8, speaking:false, distraction:"high" });
  else if (mode === "speak") setEVFeatures({ speaking:true, energyMean:0.65, movement:"stationary", distraction:"low" });
  else if (mode === "quiet") setEVFeatures({ speaking:false, energyMean:0.35, distraction:"low", movement:"stationary" });
  else if (mode === "focus") setEVFeatures({ movement:"stationary", energyMean:0.45, speaking:false, distraction:"low" });
  else /* desk */ setEVFeatures({ movement:"stationary", energyMean:0.4, speaking:false, distraction:"low" });

  return NextResponse.json({ ok:true, mode, features: getEVFeatures() });
}
