'use client';

import { useState } from 'react';
import { toPng } from 'html-to-image';

/**
 * Hook to manage the Hoopgrid sharing logic.
 * Captures the grid exactly as it appears on screen.
 */
export function useHoopgridShare(gridRef, guesses, currentUser) {
  const [copying, setCopying] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareImageUri, setShareImageUri] = useState(null);
  const [shareText, setShareText] = useState('');

  const handleShare = async () => {
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

        // Fetch theme colors from CSS variables
        const styles = getComputedStyle(document.documentElement);
        const bgColor = styles.getPropertyValue('--background').trim() || '#0f172a';
        const fgColor = styles.getPropertyValue('--foreground').trim() || '#ffffff';
        const primaryColor = styles.getPropertyValue('--primary').trim() || '#3b82f6';
        const mutedColor = 'rgba(255,255,255,0.4)'; // Using opacity for muted effect

        const dataUrl = await toPng(gridRef.current, {
          cacheBust: true,
          backgroundColor: bgColor,
          width: 840,
          height: 840,
          style: {
            padding: '20px',
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
              // Force container layout to match the screen grid
              container.style.width = '800px';
              container.style.maxWidth = 'none';
              container.style.display = 'flex';
              container.style.flexWrap = 'nowrap';
              container.style.margin = '0 auto';
              container.style.padding = '0';

              const leftCol = container.children[0];
              const centerCol = container.children[1];
              const rightCol = container.children[2];

              if (leftCol) leftCol.style.width = '80px';
              if (centerCol) centerCol.style.width = '640px';
              if (rightCol) {
                rightCol.style.display = 'block';
                rightCol.style.width = '80px';
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
