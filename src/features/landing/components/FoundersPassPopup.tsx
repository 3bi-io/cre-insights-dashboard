import React, { useState, useEffect, useCallback } from 'react';
import headerBg from '@/assets/founders-pass-header-bg.jpg';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { foundersPassContent } from '../content/foundersPass.content';

const SHOW_DELAY_MS = 5000;

export const FoundersPassPopup: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    setOpen(false);
  }, []);

  const handleCTA = useCallback(() => {
    handleDismiss();
    navigate(foundersPassContent.cta.primaryPath);
  }, [handleDismiss, navigate]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-[92vw] sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl backdrop-blur-sm">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              {/* Gradient header */}
              <div
                className="relative px-4 sm:px-6 py-5 text-white bg-cover bg-center"
                style={{ backgroundImage: `url(${headerBg})` }}
              >
                <div className="absolute inset-0 bg-primary/60" />
                <div className="relative z-10">
                  <span className="inline-block text-xs font-semibold uppercase tracking-wider bg-white/20 rounded-full px-3 py-1 mb-3">
                    {foundersPassContent.badge}
                  </span>
                  <DialogTitle className="text-2xl sm:text-3xl font-bold font-playfair text-white">
                    {foundersPassContent.headline}
                  </DialogTitle>
                  <DialogDescription className="text-white/90 mt-1 text-sm">
                    {foundersPassContent.tagline}
                  </DialogDescription>
                </div>
              </div>

              {/* Pricing pills */}
              <div className="px-4 sm:px-6 pt-5 pb-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  {foundersPassContent.pricing.map((item) => (
                    <div
                      key={item.service}
                      className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm flex-1 min-w-[120px]"
                    >
                      <Zap className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <span className="font-bold text-foreground">{item.cost}</span>
                        <span className="text-muted-foreground ml-1 text-xs">{item.service}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="px-4 sm:px-6 pb-4">
                <ul className="space-y-1.5">
                  {foundersPassContent.included.slice(0, 4).map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="px-4 sm:px-6 pb-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-3">
                <p className="text-xs text-center text-primary font-semibold tracking-wide">
                  {foundersPassContent.urgency}
                </p>
                <Button
                  onClick={handleCTA}
                  className="w-full text-base py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-[0_0_20px_hsl(var(--primary)/0.4)] animate-pulse-glow group"
                  size="lg"
                >
                  {foundersPassContent.cta.primary}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <button
                  onClick={handleDismiss}
                  className="w-full text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-0.5"
                >
                  Maybe later
                </button>
                <p className="text-[11px] text-center text-muted-foreground/50 pt-1">
                  {foundersPassContent.footer}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default FoundersPassPopup;
