export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fff9fd] pb-20 pt-32 text-[#172b63]">
      <div className="prose prose-slate mx-auto max-w-3xl px-5 sm:px-8">
        <h1>Privacy Policy</h1>
        <p className="lead text-slate-600">
          JobOrio collects account information, attribution events (clicks,
          registrations), and payout details to operate the creator marketplace.
        </p>
        <h2>Data we process</h2>
        <ul>
          <li>Account: name, email, OAuth identifiers</li>
          <li>Creator profile: handle, bio, niches, audience countries</li>
          <li>Attribution: IP, device fingerprint, referrer, geo (where available)</li>
          <li>Payout: method selection (KYC flows coming in a later release)</li>
        </ul>
        <p>
          Contact: hello@joborio.com. Full legal text to be finalized before
          production launch.
        </p>
      </div>
    </main>
  );
}
