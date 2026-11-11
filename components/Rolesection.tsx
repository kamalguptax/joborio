// components/RoleSection.jsx  -> heading + 3 cards in one row
import RoleCard, { type RoleCardProps } from "./Rolecard";

const roles: RoleCardProps[] = [
  {
    theme: "violet",
    badge: "For Creators",
    title: "I Have an Audience",
    description:
      "Share relevant opportunities, courses and campaigns. Earn from every qualified action.",
    cta: "Start Earning",
    href: "/signup",
    image: "/images/creator.png",
    imageAlt: "Smiling creator holding a phone",
  },
  {
    theme: "sky",
    badge: "For Employers",
    title: "I'm Hiring",
    description:
      "Launch campaigns, set budgets and reach verified creators who fit your brand.",
    cta: "Launch Campaign",
    href: "/employer/onboarding",
    image: "/images/brand.png",
    imageAlt: "Employer launching a campaign",
  },
  {
    theme: "emerald",
    badge: "For Partners",
    title: "I Own a Website/Community",
    description:
      "List jobs, courses or offers and get them in front of an engaged audience.",
    cta: "Become a Partner",
    href: "/contact",
    image: "/images/partner.png",
    imageAlt: "Partner managing listings",
  },
];

export default function RoleSection() {
  return (
    <div className="mt-6 sm:mt-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
        {roles.map((role) => (
          <RoleCard key={role.badge} {...role} />
        ))}
      </div>
    </div>
  );
}

// app/page.jsx:  import RoleSection from "@/components/RoleSection";  <RoleSection /> 