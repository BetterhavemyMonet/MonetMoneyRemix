import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortTag(seed: string) {
  const clean = seed.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const tail = (clean.slice(-4) || "0000").padStart(4, "0");
  return `ACE-${tail}`;
}

export function formatMonet(n: number) {
  const digits = Math.abs(n) < 1 ? 6 : 2;
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function formatSol(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export function formatUsd(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function formatScore(n: number) {
  return Math.max(0, Math.floor(n)).toLocaleString();
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function shortAddr(addr: string) {
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
