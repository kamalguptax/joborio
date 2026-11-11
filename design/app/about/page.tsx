export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-[90]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.25),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.18),_transparent_40%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300">
              About Our Platform
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
              Connecting{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Creators
              </span>{" "}
              with the right opportunities.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              We are building a modern hiring and creator monetization
              platform that helps businesses discover talented creators,
              developers, designers and digital professionals.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="border-t border-white/10 bg-slate-900/60">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
                Our Mission
              </p>

              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                Building a better way to discover talent.
              </h2>

              <p className="mt-6 leading-8 text-slate-400">
                Traditional hiring can be slow, complicated and disconnected
                from the way modern professionals work. Our platform brings
                creators, professionals and organizations together in one
                ecosystem.
              </p>

              <p className="mt-4 leading-8 text-slate-400">
                Whether you are looking for your next opportunity or searching
                for the right person for your project, we aim to make the
                process simple, transparent and efficient.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="text-3xl font-bold text-white">10K+</div>
                <p className="mt-2 text-sm text-slate-400">
                  Creator Opportunities
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="text-3xl font-bold text-white">5K+</div>
                <p className="mt-2 text-sm text-slate-400">
                  Professionals
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="text-3xl font-bold text-white">1K+</div>
                <p className="mt-2 text-sm text-slate-400">
                  Companies
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="text-3xl font-bold text-white">24/7</div>
                <p className="mt-2 text-sm text-slate-400">
                  Platform Access
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
              What We Do
            </p>

            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              One platform. Multiple possibilities.
            </h2>

            <p className="mt-4 text-slate-400">
              Designed for modern creators, professionals and organizations.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition hover:-translate-y-1 hover:border-indigo-400/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-2xl">
                💼
              </div>

              <h3 className="mt-6 text-xl font-semibold">
                Smart Hiring
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Discover professionals and creators based on skills,
                experience and project requirements.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition hover:-translate-y-1 hover:border-purple-400/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
                ✨
              </div>

              <h3 className="mt-6 text-xl font-semibold">
                Creator Opportunities
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Help creators showcase their skills, find projects and build
                meaningful professional relationships.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition hover:-translate-y-1 hover:border-pink-400/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 text-2xl">
                🚀
              </div>

              <h3 className="mt-6 text-xl font-semibold">
                Monetization
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Create new ways for talented professionals and creators to
                turn their skills and audience into opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 bg-slate-900">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to build your next opportunity?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-slate-400">
            Join our growing community of creators, professionals and
            organizations.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/signup"
              className="rounded-xl bg-indigo-600 px-7 py-3.5 font-semibold transition hover:bg-indigo-500"
            >
              Get Started
            </a>

            <a
              href="/jobs"
              className="rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 font-semibold transition hover:bg-white/10"
            >
              Explore Jobs
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}