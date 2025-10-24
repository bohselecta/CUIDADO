export const clamp01 = (x:number)=>Math.max(0,Math.min(1,x));
export const sigmoid = (x:number)=>1/(1+Math.exp(-x));
export const now = ()=>Date.now();
