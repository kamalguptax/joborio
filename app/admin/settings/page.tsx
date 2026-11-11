"use client";

import { useEffect, useState } from "react";
import {
  adminFetchPlatformSettings,
  adminUpdatePlatformSettings,
  type AdminPlatformSettings,
} from "@/lib/api/admin";
import { CURRENCIES, isCurrencyCode } from "@/lib/money";

function SecretHint({ meta }: { meta: { configured: boolean; source: string; masked: string | null } }) {
  if (!meta.configured) {
    return <p className="mt-1 text-xs text-zinc-500">Not set — using .env if present.</p>;
  }
  return (
    <p className="mt-1 text-xs text-zinc-500">
      Current ({meta.source}): <span className="font-mono text-zinc-400">{meta.masked}</span>
    </p>
  );
}

export default function AdminPlatformSettingsPage() {
  const [data, setData] = useState<AdminPlatformSettings | null>(null);
  const [mapsEnabled, setMapsEnabled] = useState(true);
  const [geoTracking, setGeoTracking] = useState(true);
  const [serverKey, setServerKey] = useState("");
  const [browserKey, setBrowserKey] = useState("");
  const [frontendUrl, setFrontendUrl] = useState("");
  const [bonusUsd, setBonusUsd] = useState("5");
  const [thresholdUsd, setThresholdUsd] = useState("10");
  const [overridePercent, setOverridePercent] = useState("3");
  const [overrideMonths, setOverrideMonths] = useState("2");
  const [feePercent, setFeePercent] = useState("25");
  const [minPayout, setMinPayout] = useState("10");
  const [ppcRate, setPpcRate] = useState("0.03");
  const [pprRate, setPprRate] = useState("0.30");
  const [ppaRate, setPpaRate] = useState("5");
  const [ppcHold, setPpcHold] = useState("5");
  const [ppcHoldHigher, setPpcHoldHigher] = useState("3");
  const [pprHold, setPprHold] = useState("3");
  const [ppaHold, setPpaHold] = useState("7");
  const [currency, setCurrency] = useState("USD");
  const [openaiKey, setOpenaiKey] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminFetchPlatformSettings()
      .then((d) => {
        setData(d);
        setMapsEnabled(d.maps.google_maps_enabled);
        setGeoTracking(d.maps.geolocation_tracking);
        setFrontendUrl(d.general.frontend_url ?? "");
        setBonusUsd(String(d.referral?.bonus_usd ?? 5));
        setThresholdUsd(String(d.referral?.bonus_threshold_usd ?? 10));
        setOverridePercent(String(d.referral?.override_percent ?? 3));
        setOverrideMonths(String(d.referral?.override_months ?? 2));
        setFeePercent(String(d.payout?.platform_fee_percent ?? 25));
        setMinPayout(String(d.payout?.min_payout_usd ?? 10));
        setPpcRate(String(d.payout?.ppc_rate_usd ?? 0.03));
        setPprRate(String(d.payout?.ppr_rate_usd ?? 0.3));
        setPpaRate(String(d.payout?.ppa_rate_usd ?? 5));
        setPpcHold(String(d.payout?.ppc_hold_days ?? 5));
        setPpcHoldHigher(String(d.payout?.ppc_hold_days_higher ?? 3));
        setPprHold(String(d.payout?.ppr_hold_days ?? 3));
        setPpaHold(String(d.payout?.ppa_hold_days ?? 7));
        setCurrency(d.payout?.currency && isCurrencyCode(d.payout.currency) ? d.payout.currency : "USD");
      })
      .catch(() => setMsg("Could not load settings."));
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const updated = await adminUpdatePlatformSettings({
        maps: {
          google_maps_enabled: mapsEnabled,
          geolocation_tracking: geoTracking,
          ...(serverKey ? { google_maps_api_key: serverKey } : {}),
          ...(browserKey ? { google_maps_browser_api_key: browserKey } : {}),
        },
        general: { frontend_url: frontendUrl || undefined },
        referral: {
          bonus_usd: Number(bonusUsd),
          bonus_threshold_usd: Number(thresholdUsd),
          override_percent: Number(overridePercent),
          override_months: Number(overrideMonths),
        },
        payout: {
          platform_fee_percent: Number(feePercent),
          min_payout_usd: Number(minPayout),
          ppc_rate_usd: Number(ppcRate),
          ppr_rate_usd: Number(pprRate),
          ppa_rate_usd: Number(ppaRate),
          ppc_hold_days: Number(ppcHold),
          ppc_hold_days_higher: Number(ppcHoldHigher),
          ppr_hold_days: Number(pprHold),
          ppa_hold_days: Number(ppaHold),
          currency,
        },
        ...(openaiKey ? { integrations: { openai_api_key: openaiKey } } : {}),
      });
      setData(updated);
      setServerKey("");
      setBrowserKey("");
      setOpenaiKey("");
      setMsg("Settings saved. Referral amounts and the site URL update for new activity.");
    } catch {
      setMsg("Save failed. Check values and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Platform settings</h1>
      <p className="mt-1 text-sm text-slate-400">
        API keys and integrations. Secrets are encrypted in the database. Leave key
        fields blank to keep the current value.
      </p>

      {data?.env_fallback_note ? (
        <p className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
          {data.env_fallback_note}
        </p>
      ) : null}

      {msg ? (
        <p className="mt-4 rounded-lg bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          {msg}
        </p>
      ) : null}

      {!data ? (
        <p className="mt-8 text-sm text-zinc-500">Loading…</p>
      ) : (
        <div className="mt-8 space-y-8">
          <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-bold text-amber-400">Google Maps</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Server key → Geocoding API (listing locations). Browser key → Maps
              JavaScript on /jobs and admin geo map. Restrict keys in Google Cloud.
            </p>

            <label className="mt-6 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={mapsEnabled}
                onChange={(e) => setMapsEnabled(e.target.checked)}
              />
              Maps enabled
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={geoTracking}
                onChange={(e) => setGeoTracking(e.target.checked)}
              />
              Website embed geolocation (visitor must allow)
            </label>

            <label className="mt-6 block text-sm font-semibold text-zinc-300">
              Geocoding API key (server)
              <input
                type="password"
                value={serverKey}
                onChange={(e) => setServerKey(e.target.value)}
                placeholder="Paste new key to replace"
                className="mt-1 w-full max-w-xl rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 font-mono text-sm"
                autoComplete="off"
              />
              <SecretHint meta={data.maps.google_maps_api_key} />
            </label>

            <label className="mt-4 block text-sm font-semibold text-zinc-300">
              Maps JavaScript API key (browser)
              <input
                type="password"
                value={browserKey}
                onChange={(e) => setBrowserKey(e.target.value)}
                placeholder="Paste new key to replace"
                className="mt-1 w-full max-w-xl rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 font-mono text-sm"
                autoComplete="off"
              />
              <SecretHint meta={data.maps.google_maps_browser_api_key} />
            </label>
          </section>

          <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-bold">General</h2>
            <label className="mt-4 block text-sm font-semibold text-zinc-300">
              Frontend URL
              <input
                type="url"
                value={frontendUrl}
                onChange={(e) => setFrontendUrl(e.target.value)}
                placeholder="https://joborio.com"
                className="mt-1 w-full max-w-xl rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm"
              />
            </label>
          </section>

          <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-bold">Payout structure</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Click, signup, and application rates, the platform fee, hold days, and the minimum payout. New earnings use these numbers.
            </p>
            <label className="mt-4 block max-w-md text-sm font-semibold text-zinc-300">
              Currency
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm"
              >
                {CURRENCIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["Platform fee %", feePercent, setFeePercent, "0.1", "0", "100"],
                  [`Minimum payout (${currency})`, minPayout, setMinPayout, "0.01", "0", "100000"],
                  [`Click rate PPC (${currency})`, ppcRate, setPpcRate, "0.0001", "0", "100000"],
                  [`Signup rate PPR (${currency})`, pprRate, setPprRate, "0.01", "0", "100000"],
                  [`Application rate PPA (${currency})`, ppaRate, setPpaRate, "0.01", "0", "100000"],
                  ["Click hold, new creators (days)", ppcHold, setPpcHold, "1", "0", "365"],
                  ["Click hold, Micro and above (days)", ppcHoldHigher, setPpcHoldHigher, "1", "0", "365"],
                  ["Signup hold (days)", pprHold, setPprHold, "1", "0", "365"],
                  ["Application hold (days)", ppaHold, setPpaHold, "1", "0", "365"],
                ] as const
              ).map(([label, value, setValue, step, min, max]) => (
                <label key={label} className="block text-sm font-semibold text-zinc-300">
                  {label}
                  <input
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-bold">Referral program</h2>
            <p className="mt-1 text-sm text-zinc-400">
              These amounts appear on each creator&apos;s Referrals page and are used when a bonus or override is paid.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-zinc-300">
                One-time bonus ({currency})
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bonusUsd}
                  onChange={(e) => setBonusUsd(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-semibold text-zinc-300">
                Bonus when earnings reach ({currency})
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={thresholdUsd}
                  onChange={(e) => setThresholdUsd(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-semibold text-zinc-300">
                Override % of platform fee (2–5% typical)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={overridePercent}
                  onChange={(e) => setOverridePercent(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-semibold text-zinc-300">
                Override length (months)
                <input
                  type="number"
                  min="0"
                  max="36"
                  step="1"
                  value={overrideMonths}
                  onChange={(e) => setOverrideMonths(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-bold">Integrations (preview)</h2>
            <label className="mt-4 block text-sm font-semibold text-zinc-300">
              OpenAI API key
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="For future AI Studio live mode"
                className="mt-1 w-full max-w-xl rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 font-mono text-sm"
                autoComplete="off"
              />
              <SecretHint meta={data.integrations.openai_api_key} />
            </label>
          </section>

          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-bold text-zinc-950 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      )}
    </>
  );
}
