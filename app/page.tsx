import ChooseGrow from "@/components/Choosegrow";
import EarningsCalculator from "@/components/Earningscalculator";
import FAQSection from "@/components/Faqsection";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/Howitworks";
import LiveActivity from "@/components/layout/Liveactivity";
import OpportunitiesSlider from "@/components/layout/Opportunitiesslider";
import Stats from "@/components/Stats";

export default function Home() {
  return (
    <>
      <Hero/>
      <LiveActivity />
      <Stats />
      <ChooseGrow />
      <EarningsCalculator />
      <HowItWorks />
      <OpportunitiesSlider />
      <FAQSection />
    </>
  );
}
