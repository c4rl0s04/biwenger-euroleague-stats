import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui/foundation';
import { StatsList } from '@/lib/competition/ui';
import { getColorForUser } from '@/lib/competition/public';

interface RankingIdentity {
  user_id?: string | number;
  userId?: string | number;
  name?: string | null;
  icon?: string | null;
  subtitle?: ReactNode;
  color_index?: number;
}
/** Rounds identity slot; sorting and domain values stay with each existing ranking. */
export function RoundRankingList({
  items,
  renderRight,
}: {
  items: RankingIdentity[];
  renderRight: (item: RankingIdentity) => ReactNode;
}) {
  return (
    <StatsList
      renderExtra={undefined}
      onMouseEnter={undefined}
      onMouseLeave={undefined}
      items={items}
      renderRight={renderRight}
      renderLeft={(item: RankingIdentity, index: number) => {
        const id = item.user_id ?? item.userId;
        const identity = (
          <>
            <Avatar
              src={item.icon}
              alt=""
              size="sm"
              style={{ borderColor: getColorForUser(id, item.name, item.color_index).stroke }}
              fallback={item.name?.slice(0, 1) ?? '?'}
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">
                {item.name ?? 'Usuario'}
              </span>
              {item.subtitle && (
                <span className="block truncate text-xs text-muted-foreground">
                  {item.subtitle}
                </span>
              )}
            </span>
          </>
        );
        return (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
              {index + 1}
            </span>
            {id != null ? (
              <a
                href={`/user/${id}`}
                className="flex min-w-0 items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-primary"
              >
                {identity}
              </a>
            ) : (
              <span className="flex min-w-0 items-center gap-2">{identity}</span>
            )}
          </div>
        );
      }}
    />
  );
}
