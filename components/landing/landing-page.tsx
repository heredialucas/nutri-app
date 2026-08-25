"use client";

import { LandingHeader } from "./landing-header";
import { LandingHero } from "./landing-hero";
import { LandingServices } from "./landing-services";
import { LandingApproach } from "./landing-approach";
import { LandingFeatures } from "./landing-features";
import { LandingWall } from "./landing-wall";
import { LandingBookingCta } from "./landing-booking-cta";
import { LandingContact } from "./landing-contact";
import { LandingFooter } from "./landing-footer";
import { LandingLoadingIntro } from "./landing-loading-intro";
import { SmoothScrollProvider } from "./smooth-scroll-provider";

export function LandingPage() {
  return (
    <SmoothScrollProvider>
      <LandingLoadingIntro />
      <div className="min-h-screen">
        <LandingHeader />
        <main>
          <LandingHero />
          <LandingServices />
          <LandingApproach />
          <LandingFeatures />
          <LandingWall />
          <LandingBookingCta />
          <LandingContact />
        </main>
        <LandingFooter />
      </div>
    </SmoothScrollProvider>
  );
}
