import { Link, useRouterState } from "@tanstack/react-router";
import { Gamepad2, House, Swords, Trophy, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Floor", icon: House },
  { to: "/challenges", label: "Lobby", icon: Swords },
  { to: "/tournaments", label: "Brackets", icon: Trophy },
  { to: "/exchange", label: "Exchange", icon: Wallet },
  { to: "/wallet", label: "Wallet", icon: Wallet },
] as const;

const extra = [
  { to: "/tournaments", label: "Tournaments" },
  { to: "/exchange", label: "Exchange" },
  { to: "/portfolio", label: "Portfolio" },
] as const;

function active(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function ArcadeNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {[...links, ...extra].map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className={cn(
            "rounded-md px-2.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted transition-colors hover:text-fg",
            active(pathname, l.to) && "bg-primary/12 text-primary",
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileDock() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/20 bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <ul className="mx-auto grid max-w-6xl grid-cols-5">
        {links.map((l) => {
          const Icon = l.icon;
          const on = active(pathname, l.to);
          return (
            <li key={l.to}>
              <Link
                to={l.to}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide",
                  on ? "text-primary" : "text-muted",
                )}
              >
                <Icon className="size-5" />
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
