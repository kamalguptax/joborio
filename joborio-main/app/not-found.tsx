import PageHero from "@/components/layout/PageHero";
import RecoverMissingJobLink from "@/components/jobs/RecoverMissingJobLink";

export default function NotFound() {
  return (
    <>
    <RecoverMissingJobLink />
    <PageHero
      eyebrow="Error 404"
      title="This page"
      highlight="could not be found."
      description="The link may be broken or the page may have moved. Head back home and try again."
      primary={{ label: "Back to Home", href: "/" }}
    />
    </>
  );
}
