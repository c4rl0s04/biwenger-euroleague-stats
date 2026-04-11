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
  let managerColorIndex = null;

  if (statType === 'user') {
    managerId = item.user_id || item.id;
    managerName = item.user_name || item.name;
    managerColorIndex = [item.user_color_index, item.color_index].find(
      (idx) => idx !== undefined && idx !== null
    );
  } else if (statType === 'transaction') {
    // For transactions (Record Historico, Record Puja), only the BUYER defines the theme
    managerId = item.buyer_id || item.comprador_id || item.winner_id;
    managerName = item.comprador || item.buyer_name || item.winner;
    managerColorIndex = [
      item.buyer_color, // Specific buyer color from SQL
      item.buyer_color_index,
      item.user_color_index, // Fallback from enrichment
      item.color_index,
    ].find((idx) => idx !== undefined && idx !== null);
  } else {
    // For players and temporal (El Pelotazo), the CURRENT OWNER defines the theme
    managerId = item.owner_id || item.user_id || item.managerId;
    managerName = item.owner_name || item.user_name || item.managerName;
    managerColorIndex = [
      item.owner_color_index, // Specific owner color from SQL
      item.user_color_index, // Fallback from enrichment
      item.color_index,
    ].find((idx) => idx !== undefined && idx !== null);
  }

  const secondaryColor =
    managerName && (managerId || managerColorIndex !== null)
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
