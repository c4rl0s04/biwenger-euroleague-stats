'use client';

import { useState } from 'react';
import { toPng } from 'html-to-image';

/**
 * Hook to manage the Hoopgrid sharing logic (image generation and modals).
 * @param {Object} gridRef - React ref to the grid container
 * @param {Object} challenge - The current challenge data
 * @param {Object} guesses - The current user guesses
 * @param {Object} currentUser - The current user context (for branding)
 */
export function useHoopgridShare(gridRef, challenge, guesses, currentUser) {
  const [copying, setCopying] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareImageUri, setShareImageUri] = useState(null);
  const [shareText, setShareText] = useState('');

  const handleShare = async () => {
    // ─── SHARE CARD LAYOUT CONSTANTS ──────────────────────────────────────────
    const CARD_WIDTH = 840;
    const CARD_HEIGHT = 840;
    const CARD_PADDING = 20;
    const CARD_BORDER_RADIUS = 24;
    const LEFT_COL_WIDTH = 150;
    const CENTER_COL_WIDTH = 640;
    const RIGHT_COL_WIDTH = 50;
    // ─────────────────────────────────────────────────────────────────────────

    // 1. Text Summary
    let gridText = 'Euroleague Hoopgrid 🏀\n';
    for (let i = 0; i < 3; i++) {
      let row = '';
      for (let j = 0; j < 3; j++) {
        const guess = guesses[i * 3 + j];
        row += guess?.isCorrect ? '🟧' : '⬜';
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
            borderRadius: `${CARD_BORDER_RADIUS}px`,
            padding: `${CARD_PADDING}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          },
          onClone: (clonedDoc) => {
            const footer = clonedDoc.querySelector('.share-only-footer');
            if (footer) {
              footer.classList.remove('hidden');
              footer.classList.add('flex');
            }

            // Force widths for shared image layout
            const container = clonedDoc.querySelector('.hoopgrid-main-container');
            if (container) {
              container.style.width = `${CARD_WIDTH - CARD_PADDING * 2}px`;
              container.style.display = 'flex';
              container.style.flexWrap = 'wrap';

              const leftCol = container.children[0];
              const centerCol = container.children[1];
              const rightCol = container.children[2];

              if (leftCol) leftCol.style.width = `${LEFT_COL_WIDTH}px`;
              if (centerCol) centerCol.style.width = `${CENTER_COL_WIDTH}px`;
              if (rightCol) rightCol.style.width = `${RIGHT_COL_WIDTH}px`;
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
