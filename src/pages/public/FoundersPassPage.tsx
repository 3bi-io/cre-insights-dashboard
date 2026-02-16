/**
 * Founders Pass Landing Page
 * Performance-based pricing for early adopters — mobile-first, best-in-class UX
 */

import React from 'react';
import { motion } from 'framer-motion';
import { SEO } from '@/components/SEO';
import { StructuredData, buildWebSiteSchema } from '@/components/StructuredData';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Clock, DollarSign, Headphones, Send, Zap } from 'lucide-react';
import { foundersPassContent as c } from '@/features/landing/content/foundersPass.content';
import { FoundersPassVoiceCTA } from '@/features/landing/components/FoundersPassVoiceCTA';

import heroImage from '@/assets/founders-pass-hero.jpg';
import step1Image from '@/assets/founders-step1-signup.png';
import step2Image from '@/assets/founders-step2-broadcast.png';
import step3Image from '@/assets/founders-step3-metrics.png';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' as const },
  }),
};

const pricingIcons = [DollarSign, Send, Headphones];
const stepImages = [step1Image, step2Image, step3Image];

const FoundersPassPage = () => {
  return (
    <main className="min-h-screen">
      <SEO
        title="Founders Pass — $3/Apply Performance Pricing | ATS.me"
        description="Limited-time Founders Pass: free signup, free onboarding, $1 per apply, $1 ATS delivery, $1 optional Voice Agent. Pay only when it works."
        keywords="founders pass, performance pricing, pay per apply, recruitment platform, ATS, AI voice agent"
        canonical="https://ats.me/founders-pass"
        ogImage="/og-founders-pass.png"
      />
      <StructuredData data={buildWebSiteSchema()} />

      {/* ── Hero ── */}
      <section className="relative min-h-[85dvh] sm:min-h-[70dvh] flex items-center px-5 sm:px-6 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Diverse team reviewing applicant data in a modern logistics office"
            className="w-full h-full object-cover object-center"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background/75 sm:bg-gradient-to-br sm:from-background/90 sm:via-background/80 sm:to-background/70" />
          <div className="absolute inset-0 bg-primary/5" />
        </div>

        <div className="container mx-auto max-w-4xl text-center relative z-10 py-16 sm:py-24">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <Badge variant="outline" className="mb-5 sm:mb-6 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 border-primary/40 bg-background/80 backdrop-blur-sm">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {c.badge}
            </Badge>
          </motion.div>

          <motion.h1
            className="font-playfair text-4xl sm:text-5xl md:text-7xl font-bold mb-3 sm:mb-4 tracking-tight"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
          >
            {c.headline}
          </motion.h1>

          <motion.p
            className="text-xl sm:text-2xl md:text-3xl font-medium text-primary mb-3 sm:mb-4"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
          >
            {c.tagline}
          </motion.p>

          <motion.p
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 px-2"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            {c.description}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
          >
            <FoundersPassVoiceCTA variant="hero" />
          </motion.div>
        </div>
      </section>

      {/* ── Pricing Breakdown ── */}
      <section className="py-16 sm:py-20 px-5 sm:px-6">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            className="text-center mb-10 sm:mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Simple, Performance-Based Pricing
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
              No upfront costs. No subscriptions. Pay only when candidates apply.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {c.pricing.map((tier, i) => {
              const Icon = pricingIcons[i];
              return (
                <motion.div
                  key={tier.service}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-20px' }}
                  variants={fadeUp}
                  custom={i + 1}
                >
                  <Card className="h-full border-border/60 hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6 sm:p-8 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 mb-4 sm:mb-5">
                        <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                      </div>
                      {tier.badge && (
                        <Badge variant="secondary" className="mb-3 text-xs">
                          {tier.badge}
                        </Badge>
                      )}
                      <div className="text-4xl sm:text-5xl font-bold mb-1">{tier.cost}</div>
                      <div className="text-sm text-muted-foreground mb-3 sm:mb-4">per apply</div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-2">{tier.service}</h3>
                      <p className="text-muted-foreground text-sm mb-3 sm:mb-4">{tier.description}</p>
                      <p className="text-xs text-muted-foreground/70 leading-relaxed">{tier.note}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.p
            className="text-center mt-8 sm:mt-10 text-base sm:text-lg font-semibold text-primary"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={4}
          >
            {c.summary}
          </motion.p>
        </div>
      </section>

      {/* ── What's Included ── */}
      <section className="py-16 sm:py-20 px-5 sm:px-6 bg-muted/30">
        <div className="container mx-auto max-w-3xl">
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            Everything Included — Zero Cost to Start
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {c.included.map((item, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-3 p-3 sm:p-0 rounded-lg bg-background/60 sm:bg-transparent"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.4}
              >
                <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground text-sm sm:text-base">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-16 sm:py-20 px-5 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            How It Works
          </motion.h2>

          <div className="flex flex-col sm:grid sm:grid-cols-3 gap-10 sm:gap-8">
            {c.steps.map((step, i) => (
              <motion.div
                key={step.step}
                className="flex sm:flex-col items-start sm:items-center sm:text-center gap-4 sm:gap-0"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-20px' }}
                variants={fadeUp}
                custom={i + 1}
              >
                {/* Step image */}
                <div className="w-16 h-16 sm:w-24 sm:h-24 shrink-0 sm:mx-auto sm:mb-5 rounded-xl sm:rounded-2xl overflow-hidden bg-primary/5 p-1.5 sm:p-2">
                  <img
                    src={stepImages[i]}
                    alt={step.title}
                    className="w-full h-full object-contain rounded-lg sm:rounded-xl"
                    loading="lazy"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1 sm:mb-0">
                    Step {step.step}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="py-16 sm:py-20 px-5 sm:px-6 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <Zap className="h-7 w-7 sm:h-8 sm:w-8 text-primary mx-auto mb-4" />
            <p className="text-base sm:text-lg font-medium text-muted-foreground mb-6 sm:mb-8">{c.urgency}</p>

            <FoundersPassVoiceCTA variant="footer" />

            <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-muted-foreground pb-[env(safe-area-inset-bottom)]">
              {c.footer}
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default FoundersPassPage;
