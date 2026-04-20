'use client';

import { useState } from 'react';
import { toPng } from 'html-to-image';

/**
 * Hook to manage the Hoopgrid sharing logic with symmetrical centering.
 */
export function useHoopgridShare(gridRef, guesses, currentUser) {
  const [copying, setCopying] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareImageUri, setShareImageUri] = useState(null);
  const [shareText, setShareText] = useState('');

  const handleShare = async () => {
    // ─── SHARE CARD LAYOUT CONSTANTS (SYMMETRICAL) ──────────────────────────
    const CARD_WIDTH = 840;
    const CARD_HEIGHT = 840;
    const CARD_PADDING = 20;
    const SIDE_COL_WIDTH = 100;
    const CENTER_COL_WIDTH = 640;
    // ─────────────────────────────────────────────────────────────────────────

    // 1. Text Summary
    let gridText = 'Euroleague Hoopgrid 🏀\n';
    for (let i = 0; i < 3; i++) {
      let row = '';
      for (let j = 0; j < 3; j++) {
        row += guesses[i * 3 + j]?.isCorrect ? '🟧' : '⬜';
      }
      gridText += row + '\n';
    }
    gridText += '\nJuega en biwengerstats.com';
    setShareText(gridText);

    // 2. Image Generation
    if (gridRef.current) {
      try {
        setCopying(true);
        const bgColor =
          getComputedStyle(document.documentElement).getPropertyValue('--background') || '#0f172a';

        const dataUrl = await toPng(gridRef.current, {
          cacheBust: true,
          backgroundColor: bgColor.trim(),
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          style: {
            padding: `${CARD_PADDING}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          },
          onClone: (clonedNode) => {
            const container = clonedNode.classList.contains('hoopgrid-main-container')
              ? clonedNode
              : clonedNode.querySelector('.hoopgrid-main-container');

            if (container) {
              container.style.width = `${CARD_WIDTH - CARD_PADDING * 2}px`;
              container.style.display = 'flex';
              container.style.margin = '0 auto';

              const leftCol = container.children[0];
              const centerCol = container.children[1];
              const rightCol = container.children[2];

              if (leftCol) leftCol.style.width = `${SIDE_COL_WIDTH}px`;
              if (centerCol) centerCol.style.width = `${CENTER_COL_WIDTH}px`;
              if (rightCol) {
                rightCol.style.display = 'block';
                rightCol.style.width = `${SIDE_COL_WIDTH}px`;
              }
            }
          },
        });

        setShareImageUri(dataUrl);
        setShareModalOpen(true);
      } catch (err) {
        console.error('Failed to generate sharing image:', err);
      } finally {
        setCopying(false);
      }
    }
  };

  return {
    copying,
    shareModalOpen,
    shareImageUri,
    shareText,
    setShareModalOpen,
    handleShare,
  };
}
