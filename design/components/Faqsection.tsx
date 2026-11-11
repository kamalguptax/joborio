"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Yeh platform kaise kaam karta hai?",
    answer:
      "Aap job listings ko apne dost, family ya social media par share karte ho. Jab bhi koi aapke share kiye gaye link par click karta hai ya apply karta hai, aapko uske liye earning milti hai. Jitna zyada aap share karoge, utni zyada aapki earning hogi.",
  },
  {
    question: "Payment kaise aur kab milta hai?",
    answer:
      "Aapki earning har hafte automatically calculate hoti hai aur minimum payout threshold (₹100) reach karne ke baad, seedha aapke bank account ya UPI ID par transfer kar di jaati hai. Har Friday payout process hota hai.",
  },
  {
    question: "Kya mujhe job apply karne ke liye koi fees deni hogi?",
    answer:
      "Bilkul nahi. Yeh platform 100% free hai — job dekhne, share karne, ya apply karne ke liye kabhi bhi koi fees ya charge nahi liya jaata. Agar koi aapse paise maange, to woh scam hai.",
  },
  {
    question: "Ek click ki earning kaise decide hoti hai?",
    answer:
      "Har company ki job listing ke saath ek fixed earning rate hota hai (jaise $1.20 se $2.50 tak), jo job ki category, demand aur company ke budget par depend karta hai. Yeh rate har card par clearly dikhaya jaata hai.",
  },
  {
    question: "Kya main ek se zyada job listings share kar sakta hoon?",
    answer:
      "Haan, aap jitni chahein utni job listings share kar sakte ho — koi limit nahi hai. Har alag listing se hone wale clicks alag se track aur credit kiye jaate hain.",
  },
  {
    question: "Agar mera link fake clicks se misuse ho to kya hoga?",
    answer:
      "Hamara system automatically suspicious ya fake activity (jaise bots ya repeated clicks ek hi device se) detect kar leta hai aur unhe earning mein count nahi karta. Genuine clicks hi aapki earning mein add hote hain.",
  },
  {
    question: "Mujhe koi issue ho to support kaise contact karoon?",
    answer:
      "Aap neeche diye gaye 'Contact Support' button se humein directly message kar sakte ho, ya humari help@platform.com email par likh sakte ho. Team 24 ghanto ke andar reply karti hai.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  return (
    <section className="w-full bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-[820px] px-5 sm:px-8">
        {/* Header */}
        <div className="mb-8 flex items-start gap-3 sm:mb-10">
          <HelpCircle
            size={26}
            strokeWidth={1.8}
            className="mt-1 shrink-0 text-[#633BFF]"
          />

          <div>
            <h2 className="text-2xl font-bold leading-tight text-[#24375C] sm:text-[26px]">
              Frequently Asked Questions
            </h2>
            <p className="mt-1 text-sm text-[#8290AA]">
              Sab kuch jo aapko jaanna chahiye, ek jagah par.
            </p>
          </div>
        </div>

        {/* FAQ List */}
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;

            return (
              <div
                key={faq.question}
                className={`rounded-2xl border transition-colors duration-300 ${
                  isOpen
                    ? "border-[#633BFF]/30 bg-[#F7F5FF]"
                    : "border-[#E9EEF6] bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-[15px] font-semibold text-[#273B60] sm:text-base">
                    {faq.question}
                  </span>

                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-[#633BFF] transition-transform duration-300 ${
                      isOpen ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm leading-relaxed text-[#536584] sm:text-[15px]">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Support CTA */}
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-[#E9EEF6] bg-[#FAFBFD] px-6 py-6 text-center sm:mt-10">
          <p className="text-sm font-medium text-[#536584]">
            Aapka sawaal yahan nahi mila?
          </p>
          <a
            href="#"
            className="rounded-full bg-[#633BFF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4f2ee0]"
          >
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}