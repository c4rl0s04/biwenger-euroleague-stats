import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { Avatar } from '@/components/ui/foundation';
import { getColorForUser } from '../presentation/colors';

export interface ManagerIdentityValue {
  id: string | number | null;
  name: string | null | undefined;
  icon?: string | null;
  colorIndex?: number | null;
  subtitle?: ReactNode;
}

export function ManagerIdentity({ manager }: { manager: ManagerIdentityValue }) {
  const name = manager.name || 'Usuario';
  const color = getColorForUser(manager.id, name, manager.colorIndex).stroke;
  const content = (
    <>
      <Avatar
        src={manager.icon}
        alt=""
        fallback={name.slice(0, 1)}
        size="sm"
        style={{ borderColor: color }}
      />
      <span className="min-w-0">
        <span
          className="block truncate text-sm font-semibold"
          style={{
            color: 'color-mix(in srgb, var(--manager-color) 55%, hsl(var(--content-primary)))',
          }}
          title={name}
        >
          {name}
        </span>
        {manager.subtitle != null && (
          <span className="block text-xs text-muted-foreground">{manager.subtitle}</span>
        )}
      </span>
    </>
  );
  const props = {
    className:
      'flex min-w-0 items-center gap-2.5 rounded-[var(--radius-control)] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4',
    style: { '--manager-color': color } as CSSProperties,
  };
  return manager.id != null ? (
    <Link {...props} href={`/user/${manager.id}`}>
      {content}
    </Link>
  ) : (
    <span {...props}>{content}</span>
  );
}
