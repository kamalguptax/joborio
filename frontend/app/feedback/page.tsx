import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import FeedbackForm from "@/components/feedback/FeedbackForm";

export const metadata: Metadata = {
  title: "Share Feedback",
  description: "Tell the Upclift team what is working, what is not, and what you would like to see next.",
};

export default function FeedbackPage() {
  return (
    <>
      <PageHero
        compact
        eyebrow="Feedback"
        title="Help us build"
        highlight="a better Upclift."
        description="Suggestions, problems or a kind word — every message is read by the team."
      />
      <section className="bg-[#F7F8FC] px-4 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-14 lg:px-10">
        <div className="mx-auto w-full max-w-2xl">
          <FeedbackForm />
          <p className="mt-6 text-center text-sm text-slate-500">
            Need an answer instead? Use the chat bubble or write to{" "}
            <a href="mailto:hello@joborio.com" className="font-semibold text-violet-600 hover:underline">
              hello@joborio.com
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
