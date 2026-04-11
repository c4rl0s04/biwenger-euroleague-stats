import { getColorForUser } from '@/lib/constants/colors';

/**
 * Resolves naming, images, and brand colors for different market entities.
 */
export function resolveIdentity(item, statType) {
  const isUser = statType === 'user' || (!item.player_id && (item.id || item.user_id));

  // Context-aware image resolution
  const imageSrc = isUser
    ? item.user_img || item.icon || item.buyer_icon || item.img || item.image
    : item.player_img || item.img || item.image;

  const name = item.player_name || item.user_name || item.name || item.buyer_name;
  const linkId = item.id || item.user_id || item.buyer_id || item.player_id;
  const linkPath = isUser ? `/managers/${linkId}` : `/players/${item.player_id || item.id}`;

  const resolvedColorIndex = [
    item.color_index,
    item.user_color_index,
    item.buyer_color,
    item.user_color,
  ].find((v) => v !== undefined && v !== null);

  const primaryColor = isUser
    ? getColorForUser(linkId, name, resolvedColorIndex)
    : { text: 'text-white' };

  // Case-specific Manager Identity Resolution
  let managerId = null;
  let managerName = null;

  if (statType === 'user') {
    managerId = item.user_id || item.id;
    managerName = item.user_name || item.name;
  } else if (statType === 'transaction' || statType === 'temporal') {
    // For transactions/temporal, only the BUYER/WINNER defines the theme
    managerId = item.comprador_id || item.buyer_id || item.winner_id || item.user_id || item.id;
    managerName =
      item.comprador ||
      item.buyer_name ||
      item.winner ||
      item.user_name ||
      item.name ||
      item.vendedor ||
      item.seller_name;
  } else {
    // For players/others, the OWNER defines the theme
    managerId = item.owner_id || item.user_id;
    managerName = item.owner_name || item.user_name || item.name;
  }

  const managerColorIndex = [
    item.user_color_index,
    item.color_index,
    item.owner_color_index,
    item.buyer_color_index,
    item.winner_color_index,
  ].find((idx) => idx !== undefined && idx !== null);

  const secondaryColor =
    managerName && managerId
      ? getColorForUser(managerId, managerName, managerColorIndex)
      : { text: 'text-zinc-500' };

  return {
    isUser,
    imageSrc,
    name,
    linkId,
    linkPath,
    primaryColor,
    secondaryColor,
    managerName,
    managerId,
  };
}
