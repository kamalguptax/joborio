// components/RoleSection.jsx  -> heading + 3 cards in one row
import RoleCard from "./Rolecard";

const roles = [
  {
    theme: "violet",
    badge: "For Creators",
    title: "I Have an Audience",
    description:
      "Share relevant opportunities, courses and campaigns. Earn from every qualified action.",
    cta: "Start Earning",
    href: "/signup/creator",
    image: "/images/creator.png",
    imageAlt: "Smiling creator holding a phone",
  },
  {
    theme: "sky",
    badge: "For Brands",
    title: "I Need Talent", // placeholder - apni copy daalo
    description:
      "Post jobs and campaigns, and reach verified creators who fit your brand.",
    cta: "Start Hiring",
    href: "/signup/brand",
    image: "/images/brand.png",
    imageAlt: "Brand manager reviewing campaigns",
  },
  {
    theme: "emerald",
    badge: "For Partners", // placeholder - 3rd card ki copy daalo
    title: "I Run Opportunities",
    description:
      "List jobs, courses or offers and get them in front of an engaged audience.",
    cta: "Become a Partner",
    href: "/signup/partner",
    image: "/images/partner.png",
    imageAlt: "Partner managing listings",
  },
];

export default function RoleSection() {
  return (
    <section aria-labelledby="choose-role-heading" className="py-12">
      <div className="mx-auto mt-10 grid grid-cols-1 gap-6 px-4 lg:grid-cols-3">
        {roles.map((role) => (
          <RoleCard key={role.badge} {...role} />
        ))}
      </div>
    </section>
  );
}

// app/page.jsx:  import RoleSection from "@/components/RoleSection";  <RoleSection /> 