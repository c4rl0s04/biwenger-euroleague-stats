'use client';

import { motion } from 'framer-motion';
import { X, Download, Share2, MessageCircle, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function HoopgridShareModal({ isOpen, onClose, imageUri, textSummary }) {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Check for native share support on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCanNativeShare(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `hoopgrid-${new Date().toISOString().split('T')[0]}.png`;
    link.href = imageUri;
    link.click();
  };

  const handleCopyText = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textSummary);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handleCopyImage = async () => {
    if (!navigator.clipboard || !navigator.clipboard.write) {
      const isSecure = window.isSecureContext;
      if (!isSecure) {
        alert(
          'El copiado de imágenes requiere una conexión segura (HTTPS). Por favor, usa el botón "Descargar" o mantén pulsada la imagen para guardarla.'
        );
      } else {
        alert(
          'Tu navegador no soporta copiar imágenes. Por favor, usa el botón "Descargar" o mantén pulsada la imagen.'
        );
      }
      return;
    }
    try {
      const res = await fetch(imageUri);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
    } catch (err) {
      console.error('Failed to copy image:', err);
      alert('Error al copiar. Intenta descargar la imagen directamente.');
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;

    try {
      const res = await fetch(imageUri);
      const blob = await res.blob();
      const file = new File([blob], 'hoopgrid.png', { type: 'image/png' });

      await navigator.share({
        files: [file],
        title: 'Euroleague Hoopgrid',
        text: textSummary,
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  const handleWhatsApp = () => {
    const encodedText = encodeURIComponent(textSummary);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <h3 className="font-display text-lg uppercase tracking-tighter text-foreground">
            Compartir Resultados
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview */}
        <div className="p-5 flex justify-center bg-muted/5">
          <img
            src={imageUri}
            alt="Hoopgrid Results"
            className="max-h-[35vh] rounded-lg shadow-xl border border-white/10"
          />
        </div>

        {/* Action Buttons */}
        <div className="p-5 space-y-3">
          {canNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg shadow-indigo-500/20 text-sm"
            >
              <Share2 className="w-5 h-5" />
              Compartir Imagen
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Primary Actions */}
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-3 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              WhatsApp
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-3 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm"
            >
              <Download className="w-5 h-5" />
              Descargar
            </button>

            {/* Secondary Actions */}
            <button
              onClick={handleCopyImage}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary hover:bg-muted text-secondary-foreground font-bold transition-all border border-border/50 text-xs cursor-pointer"
            >
              {copiedImage ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  Copiada
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 hidden" /> {/* Hidden icon to keep layout if needed */}
                  <Copy className="w-4 h-4" />
                  Copiar Imagen
                </>
              )}
            </button>
            <button
              onClick={handleCopyText}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary hover:bg-muted text-secondary-foreground font-bold transition-all border border-border/50 text-xs cursor-pointer"
            >
              {copiedText ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Texto
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 pb-5 text-center">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-40">
            biwengerstats.com
          </p>
        </div>
      </motion.div>
    </div>
  );
}
