import FAQSection from "@/components/Faqsection";
import PageHero from "@/components/layout/PageHero";

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="Help center"
        title="Frequently asked"
        highlight="questions"
        description="Earnings, Refer & Earn, payouts, and how creators keep about 75% of revenue."
        primary={{ label: "Start Earning", href: "/signup" }}
        secondary={{ label: "Refer & Earn", href: "/refer-and-earn" }}
      />
      <div className="mx-auto w-full max-w-4xl px-4 pb-16 sm:px-8 sm:pb-20">
        <FAQSection />
      </div>
    </>
  );
}
