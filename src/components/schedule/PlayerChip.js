import Link from 'next/link';
import Image from 'next/image';

export default function PlayerChip({ player }) {
  // Use a default color if missing (though DB should provide it now)
  const teamColor = player.team_color || '#A1A1AA';

  return (
    <Link
      href={`/player/${player.id}`}
      style={{ '--team-color': teamColor }}
      className="flex items-center gap-3 pr-4 pl-1.5 py-1.5 rounded-full bg-zinc-800/50 border border-white/5 hover:bg-zinc-800 transition-all duration-200 group/chip hover:border-[var(--team-color)] hover:shadow-[0_0_10px_-5px_var(--team-color)]"
    >
      <div className="relative w-9 h-9 rounded-full overflow-hidden bg-zinc-700 ring-1 ring-white/10 shrink-0 group-hover/chip:ring-[var(--team-color)] transition-all duration-200">
        {player.img ? (
          <Image
            src={player.img}
            alt={player.name}
            fill
            className="object-cover object-top"
            sizes="36px"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-[10px] font-bold text-zinc-400 group-hover/chip:text-[var(--team-color)]">
            {player.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex flex-col leading-none gap-0.5">
        <span className="text-sm font-medium text-zinc-200 group-hover/chip:text-[var(--team-color)] transition-colors">
          {player.name}
        </span>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold py-0.5 transition-colors">
          {player.position}
        </span>
      </div>
    </Link>
  );
}
