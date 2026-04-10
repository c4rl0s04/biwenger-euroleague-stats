import { getColorForUser } from '@/lib/constants/colors';

/**
 * Resolves naming, images, and brand colors for different market entities.
 */
export function resolveIdentity(item, statType) {
  const isUser = statType === 'user' || (!item.player_id && (item.id || item.user_id));
  const imageSrc =
    item.player_img || item.user_img || item.icon || item.buyer_icon || item.img || item.image;
  const name = item.player_name || item.user_name || item.name || item.buyer_name;
  const linkId = item.id || item.user_id || item.buyer_id || item.player_id;
  const linkPath = isUser ? `/user/${linkId}` : `/player/${item.player_id || item.id}`;

  const resolvedColorIndex = [
    item.color_index,
    item.user_color_index,
    item.buyer_color,
    item.user_color,
  ].find((v) => v !== undefined && v !== null);

  const primaryColor = isUser
    ? getColorForUser(linkId, name, resolvedColorIndex)
    : { text: 'text-white' };

  // Resolve Secondary Manager Identity (for players/transactions)
  const managerName =
    item.user_name ||
    item.owner_name ||
    item.buyer_name ||
    item.comprador ||
    item.vendedor ||
    item.winner ||
    null;

  const managerId =
    item.user_id ||
    item.owner_id ||
    item.comprador_id ||
    item.buyer_id ||
    item.vendedor_id ||
    item.winner_id;

  const managerColorIndex = [
    item.user_color_index,
    item.color_index,
    item.buyer_color,
    item.buyer_color_index,
    item.owner_color_index,
    item.comprador_color_index,
    item.vendedor_color_index,
    item.winner_color_index,
    item.bidder_color_index,
  ].find((v) => v !== undefined && v !== null);

  const secondaryColor =
    !isUser && managerName && managerId
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
