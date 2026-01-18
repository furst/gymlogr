"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Dumbbell, Upload, Calendar, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "Workout", icon: Dumbbell },
  { href: "/programs", label: "Programs", icon: Upload },
  { href: "/history", label: "History", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <Link
            href="/"
            className="font-semibold text-lg flex items-center gap-2 transition-colors hover:text-primary"
          >
            <Dumbbell className="h-5 w-5" />
            <span className="hidden xs:inline">GymLogr</span>
          </Link>
          <div className="flex gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href ||
                (href !== "/" && pathname.startsWith(href));

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isActive && "scale-110"
                    )}
                  />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
