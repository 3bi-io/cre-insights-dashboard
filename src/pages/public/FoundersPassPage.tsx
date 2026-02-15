/**
 * Founders Pass Landing Page
 * Performance-based pricing for early adopters
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SEO } from '@/components/SEO';
import { StructuredData, buildWebSiteSchema } from '@/components/StructuredData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Check, Clock, DollarSign, Headphones, Send, Zap } from 'lucide-react';
import { foundersPassContent as c } from '@/features/landing/content/foundersPass.content';

import heroImage from '@/assets/founders-pass-hero.jpg';
import step1Image from '@/assets/founders-step1-signup.png';
import step2Image from '@/assets/founders-step2-broadcast.png';
import step3Image from '@/assets/founders-step3-metrics.png';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const pricingIcons = [DollarSign, Send, Headphones];
const stepImages = [step1Image, step2Image, step3Image];

const FoundersPassPage = () => {
  const navigate = useNavigate();

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

      {/* Hero with background image */}
      <section className="relative py-24 md:py-32 px-4 overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Diverse team reviewing applicant data in a modern logistics office"
            className="w-full h-full object-cover object-center"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-background/70" />
          <div className="absolute inset-0 bg-primary/5" />
        </div>

        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <Badge variant="outline" className="mb-6 text-sm px-4 py-2 border-primary/40 bg-background/80 backdrop-blur-sm">
              <Clock className="h-4 w-4 mr-2" />
              {c.badge}
            </Badge>
          </motion.div>

          <motion.h1
            className="font-playfair text-5xl md:text-7xl font-bold mb-4 tracking-tight"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
          >
            {c.headline}
          </motion.h1>

          <motion.p
            className="text-2xl md:text-3xl font-medium text-primary mb-4"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
          >
            {c.tagline}
          </motion.p>

          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            {c.description}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
          >
            <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate(c.cta.primaryPath)}>
              {c.cta.primary}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 bg-background/60 backdrop-blur-sm"
              onClick={() => navigate(c.cta.secondaryPath)}
            >
              {c.cta.secondary}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Breakdown */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Performance-Based Pricing</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              No upfront costs. No subscriptions. Pay only when candidates apply.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {c.pricing.map((tier, i) => {
              const Icon = pricingIcons[i];
              return (
                <motion.div
                  key={tier.service}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i + 1}
                >
                  <Card className="h-full border-border/60 hover:border-primary/40 transition-colors">
                    <CardContent className="p-8 text-center">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-5">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      {tier.badge && (
                        <Badge variant="secondary" className="mb-3 text-xs">
                          {tier.badge}
                        </Badge>
                      )}
                      <div className="text-5xl font-bold mb-1">{tier.cost}</div>
                      <div className="text-sm text-muted-foreground mb-4">per apply</div>
                      <h3 className="text-xl font-semibold mb-2">{tier.service}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{tier.description}</p>
                      <p className="text-xs text-muted-foreground/70 leading-relaxed">{tier.note}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.p
            className="text-center mt-10 text-lg font-semibold text-primary"
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

      {/* What's Included */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            Everything Included — Zero Cost to Start
          </motion.h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {c.included.map((item, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-3"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.5}
              >
                <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            How It Works
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {c.steps.map((step, i) => (
              <motion.div
                key={step.step}
                className="text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
              >
                <div className="w-24 h-24 mx-auto mb-5 rounded-2xl overflow-hidden bg-primary/5 p-2">
                  <img
                    src={stepImages[i]}
                    alt={step.title}
                    className="w-full h-full object-contain rounded-xl"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <Zap className="h-8 w-8 text-primary mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-8">{c.urgency}</p>

            <Button size="lg" className="text-lg px-10 py-6" onClick={() => navigate(c.cta.primaryPath)}>
              {c.cta.primary}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="mt-8 text-sm text-muted-foreground">{c.footer}</p>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default FoundersPassPage;
