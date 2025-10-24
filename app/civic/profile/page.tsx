"use client";
import React, { useEffect, useState } from "react";

export default function CivicProfile() {
  const [profile, setProfile] = useState<any>(null);
  
  useEffect(()=>{ 
    fetch("/api/civic/representative")
      .then(r=>r.json())
      .then(setProfile); 
  },[]);
  
  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">My Representative</h1>
      <pre className="bg-neutral-900 p-4 rounded">{JSON.stringify(profile, null, 2)}</pre>
    </div>
  );
}
