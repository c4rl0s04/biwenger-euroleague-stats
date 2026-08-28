import Image from 'next/image';
import { Store } from 'lucide-react';
import type { CSSProperties } from 'react';

const avatarColors = [
  '#64748b',
  '#fa5001',
  '#2563eb',
  '#059669',
  '#7c3aed',
  '#db2777',
  '#ca8a04',
  '#dc2626',
];

interface Props {
  name: string;
  icon: string | null;
  colorIndex: number;
  isMarket?: boolean;
  size?: 'small' | 'medium';
}

export default function HomeManagerAvatar({
  name,
  icon,
  colorIndex,
  isMarket = false,
  size = 'small',
}: Props) {
  const style = {
    '--home-avatar-color': avatarColors[Math.abs(colorIndex) % avatarColors.length],
  } as CSSProperties;

  return (
    <span className={`mobile-home-manager-avatar is-${size}`} style={style} aria-hidden="true">
      {isMarket ? (
        <Store size={size === 'medium' ? 17 : 14} />
      ) : icon ? (
        <Image src={icon} alt="" fill sizes={size === 'medium' ? '38px' : '28px'} />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
