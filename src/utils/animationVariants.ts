/**
 * Shared animation variants for consistent Framer Motion animations across all public pages.
 */

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const fadeInViewProps = {
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true } as const,
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
};

export const scaleInViewProps = {
  initial: { opacity: 0, scale: 0.95 } as const,
  whileInView: { opacity: 1, scale: 1 } as const,
  viewport: { once: true } as const,
  transition: { duration: 0.4, ease: 'easeOut' },
};
