export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'converted';

const config: Record<QuoteStatus, { label: string; className: string }> = {
  draft:     { label: 'Brouillon',  className: 'bg-gray-100 text-gray-700' },
  sent:      { label: 'Envoyé',     className: 'bg-blue-100 text-blue-700' },
  accepted:  { label: 'Accepté',    className: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Refusé',     className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Annulé',     className: 'bg-orange-100 text-orange-700' },
  converted: { label: 'Converti',   className: 'bg-purple-100 text-purple-700' },
};

export function QuoteStatusBadge({ status }: { status: string }) {
  const cfg = config[status as QuoteStatus] ?? { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}