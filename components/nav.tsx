'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Dumbbell, Upload, Calendar, Settings } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Workout', icon: Dumbbell },
  { href: '/programs', label: 'Programs', icon: Upload },
  { href: '/history', label: 'History', icon: Calendar },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="font-semibold text-lg">
            GymLogr
          </Link>
          <div className="flex gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                  pathname === href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
