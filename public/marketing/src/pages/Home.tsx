import React from "react";
import { usePageMeta } from "../hooks/usePageMeta";
import { HeroSection } from "../components/sections/HeroSection";
import { TrustStrip } from "../components/sections/TrustStrip";
import { ProblemSection } from "../components/sections/ProblemSection";
import { FeaturesOverview } from "../components/sections/FeaturesOverview";
import { LifecycleSection } from "../components/sections/LifecycleSection";
import { RolesSection } from "../components/sections/RolesSection";
import { ProductTour } from "../components/sections/ProductTour";
import { ScoreboardStats } from "../components/sections/ScoreboardStats";
import { SportsRoadmap } from "../components/sections/SportsRoadmap";
import { TestimonialsSection } from "../components/sections/TestimonialsSection";
import { FaqSection } from "../components/sections/FaqSection";
import { CtaBand } from "../components/sections/CtaBand";

export function HomePage() {
  usePageMeta({
    title: "LoveAll · Training management for badminton academies",
    description:
    "Every great match begins at Love all. LoveAll is the training management platform for badminton academies in India: players, batches, 8-week plans, assessments, attendance and fees.",
    path: "/"
  });

  return (
    <>
      <HeroSection />
      <TrustStrip />
      <ProblemSection />
      <FeaturesOverview />
      <LifecycleSection />
      <RolesSection />
      <ProductTour />
      <ScoreboardStats />
      <SportsRoadmap />
      <TestimonialsSection />
      <FaqSection />
      <CtaBand />
    </>);

}