export type TransactionRow = {
  id: string;
  kind: "credit" | "debit";
  title: string;
  description?: string | null;
  amount_usd: number | string;
  status: string;
  occurred_at?: string | null;
  user?: {
    id?: number;
    name?: string;
    email?: string;
    public_code?: string;
    handle?: string;
  } | null;
};

import { currencySymbol } from "@/lib/money";

const statusLabel: Record<string, string> = {
  pending: "On hold",
  approved: "Approved",
  payable: "Ready to pay",
  paid: "Paid",
};

function formatWhen(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TransactionHistory({
  rows,
  tone = "light",
  showUser = false,
  onUser,
  empty = "No payout activity yet.",
  currency = "USD",
}: {
  rows: TransactionRow[];
  tone?: "light" | "dark";
  showUser?: boolean;
  onUser?: (userId: number, name: string) => void;
  empty?: string;
  currency?: string;
}) {
  const symbol = currencySymbol(currency);
  const dark = tone === "dark";

  if (rows.length === 0) {
    return (
      <p className={dark ? "text-sm text-slate-500" : "rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500"}>
        {empty}
      </p>
    );
  }

  return (
    <div className={dark ? "overflow-x-auto rounded-xl border border-white/10" : "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className={dark ? "bg-white/5 text-xs uppercase text-slate-400" : "border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"}>
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Transaction</th>
            {showUser ? <th className="px-4 py-3">User</th> : null}
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const credit = row.kind === "credit";
            const amount = Number(row.amount_usd);
            const name = row.user?.name || row.user?.email || (row.user?.handle ? `@${row.user.handle}` : "Unknown user");
            return (
              <tr key={row.id} className={dark ? "border-t border-white/10" : "border-b border-slate-50 last:border-0"}>
                <td className={`px-4 py-3 ${dark ? "text-slate-300" : "text-slate-500"}`}>
                  {formatWhen(row.occurred_at)}
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold">{row.title}</span>
                  {row.description ? (
                    <span className={`block text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                      {row.description}
                    </span>
                  ) : null}
                </td>
                {showUser ? (
                  <td className="px-4 py-3">
                    {row.user?.id && onUser ? (
                      <button type="button" className="font-semibold text-purple-300" onClick={() => onUser(row.user!.id as number, name)}>
                        {name}
                      </button>
                    ) : (
                      <span className="font-semibold">{name}</span>
                    )}
                    <span className={`block text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                      {row.user?.public_code || "—"}
                      {row.user?.handle ? ` · @${row.user.handle}` : ""}
                    </span>
                  </td>
                ) : null}
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    row.status === "paid"
                      ? dark
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-emerald-50 text-emerald-700"
                      : dark
                        ? "bg-white/10 text-slate-200"
                        : "bg-purple-50 text-purple-700"
                  }`}>
                    {statusLabel[row.status] || row.status}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right font-bold ${credit ? "text-emerald-600" : dark ? "text-rose-300" : "text-rose-600"}`}>
                  {credit ? "+" : "−"}{symbol}{amount.toFixed(credit ? 4 : 2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
