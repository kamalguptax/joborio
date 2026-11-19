"use client";

type Tone = "admin" | "employer";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Split `YYYY-MM-DDTHH:mm` into date + time parts. */
export function splitDateTime(value: string): { date: string; time: string } {
  if (!value) return { date: "", time: "00:00" };
  const [date, time = "00:00"] = value.split("T");
  return { date: date ?? "", time: time.slice(0, 5) || "00:00" };
}

export function joinDateTime(date: string, time: string): string {
  if (!date) return "";
  return `${date}T${time || "00:00"}`;
}

/** Display like 17-11-2026 20:58 */
export function formatScheduleDisplay(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const { date, time } = splitDateTime(value);
    if (!date) return "—";
    const [y, m, day] = date.split("-");
    return `${day}-${m}-${y} ${time}`;
  }
  return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

const styles = {
  admin: {
    label: "block text-sm",
    labelText: "text-zinc-400",
    input:
      "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 [color-scheme:dark]",
    hint: "mt-1 text-[11px] text-zinc-500",
    wrap: "contents",
  },
  employer: {
    label: "block text-sm font-semibold",
    labelText: "text-slate-700",
    input:
      "mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 [color-scheme:light]",
    hint: "mt-1 text-xs font-normal text-slate-500",
    wrap: "grid grid-cols-1 gap-4 sm:grid-cols-2",
  },
} as const;

type Props = {
  tone?: Tone;
  startsAt: string;
  endsAt: string;
  onStartsAtChange: (value: string) => void;
  onEndsAtChange: (value: string) => void;
  required?: boolean;
};

export default function CampaignScheduleFields({
  tone = "employer",
  startsAt,
  endsAt,
  onStartsAtChange,
  onEndsAtChange,
  required = true,
}: Props) {
  const s = styles[tone];
  const start = splitDateTime(startsAt);
  const end = splitDateTime(endsAt);

  return (
    <div className={s.wrap}>
      <label className={s.label}>
        <span className={s.labelText}>Start date</span>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <input
            required={required}
            type="date"
            value={start.date}
            onChange={(e) =>
              onStartsAtChange(joinDateTime(e.target.value, start.time))
            }
            className={s.input.replace("mt-1 ", "")}
          />
          <input
            required={required}
            type="time"
            value={start.time}
            onChange={(e) =>
              onStartsAtChange(joinDateTime(start.date, e.target.value))
            }
            className={s.input.replace("mt-1 ", "")}
          />
        </div>
        <p className={s.hint}>Calendar: {formatScheduleDisplay(startsAt)}</p>
      </label>
      <label className={s.label}>
        <span className={s.labelText}>End date</span>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <input
            required={required}
            type="date"
            value={end.date}
            min={start.date || undefined}
            onChange={(e) =>
              onEndsAtChange(joinDateTime(e.target.value, end.time))
            }
            className={s.input.replace("mt-1 ", "")}
          />
          <input
            required={required}
            type="time"
            value={end.time}
            onChange={(e) =>
              onEndsAtChange(joinDateTime(end.date, e.target.value))
            }
            className={s.input.replace("mt-1 ", "")}
          />
        </div>
        <p className={s.hint}>Calendar: {formatScheduleDisplay(endsAt)}</p>
      </label>
    </div>
  );
}
