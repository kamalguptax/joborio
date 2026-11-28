/** Options for the publisher profile details collected in onboarding (and editable in settings). */

export const publisherCountries = [
  { value: "IN", label: "India" },
  { value: "AE", label: "UAE" },
  { value: "US", label: "USA" },
] as const;

export const publisherNetworkTypes = [
  { value: "agency", label: "Agency" },
  { value: "publisher", label: "Publisher" },
  { value: "affiliate", label: "Affiliate" },
  { value: "community", label: "Community" },
] as const;

export const publisherJobPrefs = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "remote", label: "Remote" },
  { value: "internship", label: "Internship" },
  { value: "fresher", label: "Fresher" },
] as const;

export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
