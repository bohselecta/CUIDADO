import { NextResponse } from "next/server";
import { loadRepresentativeProfile, getRepresentativeStats, validateRepresentativeProfile } from "../../../../src/lib/representative";

export async function GET() {
  try {
    const profile = loadRepresentativeProfile();
    
    if (!profile) {
      return NextResponse.json({
        error: "No representative profile found. Profile will be created on first interaction."
      }, { status: 404 });
    }

    const stats = getRepresentativeStats();
    const validation = validateRepresentativeProfile();

    return NextResponse.json({
      profile,
      stats,
      validation,
      timestamp: Date.now()
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to load representative profile",
      detail: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

