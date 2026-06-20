"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TabNav() {
  const path = usePathname();

  const tabs = [
    { href: "/s1",  label: "S1 Liq Sweep" },
    { href: "/sd",  label: "SD Breakout" },
    { href: "/sha", label: "SHA HA Rev" },
    { href: "/er",  label: "ER Ribbon" },
    { href: "/vw",  label: "VW Reversion" },
  ];

  return (
    <div className="flex gap-1 border-b border-slate-700 mb-6">
      {tabs.map((tab) => {
        const active = path === tab.href || (tab.href === "/s1" && path === "/s1");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={[
              "px-4 py-2 text-sm font-medium rounded-t transition-colors",
              active
                ? "bg-slate-800 text-white border border-b-transparent border-slate-700 -mb-px"
                : "text-slate-400 hover:text-slate-200",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
