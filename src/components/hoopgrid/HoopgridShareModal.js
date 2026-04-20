'use client';

import { motion } from 'framer-motion';
import { X, Download, Share2, MessageCircle, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function HoopgridShareModal({ isOpen, onClose, imageUri, textSummary }) {
  const [copied, setCopied] = useState(false);

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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        className="relative w-full max-w-xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
          <h3 className="font-display text-xl uppercase tracking-tighter text-foreground">
            Compartir Resultados
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Image Preview */}
        <div className="p-8 flex justify-center bg-muted/10">
          <div className="relative group">
            <img
              src={imageUri}
              alt="Hoopgrid Results"
              className="max-h-[40vh] rounded-xl shadow-2xl border border-white/10"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-[2px]">
              <p className="text-white text-xs font-bold uppercase tracking-widest">Vista Previa</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              WhatsApp
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-5 h-5" />
              Descargar
            </button>
          </div>

          <button
            onClick={handleCopyText}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-secondary hover:bg-muted text-secondary-foreground font-bold transition-all border border-border/50"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 text-green-500" />
                ¡Copiado al Portapapeles!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copiar Resumen Texto
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <div className="px-8 pb-8 text-center">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-40">
            biwengerstats.com
          </p>
        </div>
      </motion.div>
    </div>
  );
}
