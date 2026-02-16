import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { foundersPassContent } from '../content/foundersPass.content';

const STORAGE_KEY = 'founders-pass-popup-dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SHOW_DELAY_MS = 5000;

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const timestamp = Number(raw);
    return Date.now() - timestamp < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

export const FoundersPassPopup: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isDismissed()) return;
    const timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch { /* noop */ }
  }, []);

  const handleCTA = useCallback(() => {
    handleDismiss();
    navigate(foundersPassContent.cta.primaryPath);
  }, [handleDismiss, navigate]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {/* Gradient header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-5 text-primary-foreground">
                <span className="inline-block text-xs font-semibold uppercase tracking-wider bg-primary-foreground/20 rounded-full px-3 py-1 mb-3">
                  {foundersPassContent.badge}
                </span>
                <DialogTitle className="text-2xl font-bold font-playfair text-primary-foreground">
                  {foundersPassContent.headline}
                </DialogTitle>
                <DialogDescription className="text-primary-foreground/90 mt-1 text-sm">
                  {foundersPassContent.tagline}
                </DialogDescription>
              </div>

              {/* Pricing pills */}
              <div className="px-6 pt-5 pb-3">
                <div className="flex gap-2 flex-wrap">
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
              <div className="px-6 pb-4">
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
              <div className="px-6 pb-5 space-y-2">
                <Button onClick={handleCTA} className="w-full" size="lg">
                  {foundersPassContent.cta.primary}
                </Button>
                <button
                  onClick={handleDismiss}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default FoundersPassPopup;
