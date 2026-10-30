import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '../../utils/apiClient';
import type { LeadKind, LeadStatus, MarketingLead, MarketingLeadList } from '../../types';
import './AdminLeadsPage.css';

/**
 * AdminLeadsPage — the CRM for marketing-site submissions ("Request a demo"
 * and sport "Notify me"). Every submission lands here, whether or not its
 * email/WhatsApp notifications went out; the admin works each lead through
 * its status and keeps notes.
 */

const STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'DEMO_SCHEDULED', label: 'Demo scheduled' },
  { value: 'WON', label: 'Won' },
  { value: 'LOST', label: 'Lost' },
];
const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.value, s.label])) as Record<LeadStatus, string>;

const KIND_LABEL: Record<LeadKind, string> = { DEMO_REQUEST: 'Demo request', SPORT_NOTIFY: 'Notify me' };

const ROLE_LABEL: Record<string, string> = {
  owner: 'Academy owner',
  'head-coach': 'Head coach',
  'assistant-coach': 'Assistant coach',
  parent: 'Parent or student',
};
const SIZE_LABEL: Record<string, string> = {
  '1-50': 'Up to 50 players',
  '51-150': '51–150 players',
  '151-400': '151–400 players',
  '400+': 'More than 400 players',
};

const PAGE_SIZE = 25;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

/** wa.me needs digits with country code; a bare 10-digit number is assumed Indian. */
const whatsappLink = (phone: string, text: string) => {
  const digits = phone.replace(/\D/g, '');
  const intl = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
};

export const AdminLeadsPage: React.FC = () => {
  const [data, setData] = useState<MarketingLeadList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<LeadStatus | ''>('');
  const [kind, setKind] = useState<LeadKind | ''>('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MarketingLead | null>(null);

  // State only changes once the request settles; the table keeps its current
  // rows while a new filter loads.
  const fetchLeads = useCallback(async () => {
    try {
      const response = await apiClient.get<MarketingLeadList>('/admin/leads', {
        params: { status: status || undefined, kind: kind || undefined, q: query || undefined, page, pageSize: PAGE_SIZE },
      });
      setData(response.data);
      setError(null);
    } catch {
      setError('Could not load leads. Please try again.');
    }
  }, [status, kind, query, page]);
  const loading = data === null && error === null;

  useEffect(() => {
    // fetchLeads only sets state after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchLeads();
  }, [fetchLeads]);

  // Debounced search
  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const counts = data?.counts ?? {};
  const allCount = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const onSaved = (lead: MarketingLead) => {
    setSelected(lead);
    void fetchLeads();
  };

  return (
    <div className="leads-page">
      <div>
        <h1 className="admin-page-title">Leads</h1>
        <p className="admin-page-subtitle">
          Demo requests and “Notify me” signups from the website. Work each one through its status and keep notes.
        </p>
      </div>

      <div className="leads-page__tabs" role="tablist" aria-label="Filter by status">
        {[{ value: '' as const, label: 'All', count: allCount }, ...STATUSES.map((s) => ({ ...s, count: counts[s.value] ?? 0 }))].map(
          (tab) => (
            <button
              key={tab.value || 'all'}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              className={`leads-page__tab${status === tab.value ? ' leads-page__tab--active' : ''}`}
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
            >
              {tab.label}
              <span className="leads-page__tab-count">{tab.count}</span>
            </button>
          )
        )}
      </div>

      <div className="leads-page__filters">
        <input
          type="search"
          className="leads-page__search"
          placeholder="Search name, email, academy, phone or city"
          aria-label="Search leads"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="leads-page__select leads-page__select--inline"
          aria-label="Filter by type"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as LeadKind | '');
            setPage(1);
          }}
        >
          <option value="">All types</option>
          <option value="DEMO_REQUEST">Demo requests</option>
          <option value="SPORT_NOTIFY">Notify me</option>
        </select>
      </div>

      {error && <div className="leads-page__error" role="alert">{error}</div>}

      <div className={`leads-page__body${selected ? ' leads-page__body--with-detail' : ''}`}>
        <div className="leads-page__table-card">
          {loading && !data ? (
            <p className="leads-page__muted">Loading leads…</p>
          ) : data && data.leads.length === 0 ? (
            <p className="leads-page__muted">
              {query || status || kind ? 'No leads match these filters.' : 'No leads yet. Website demo requests will appear here.'}
            </p>
          ) : (
            <div className="table-container">
              <table className="table-styled leads-page__table">
                <thead>
                  <tr>
                    <th>Received</th>
                    <th>Contact</th>
                    <th>Academy</th>
                    <th>Status</th>
                    <th>Alerts</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className={`leads-page__row${selected?.id === lead.id ? ' leads-page__row--selected' : ''}`}
                      onClick={() => setSelected(lead)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelected(lead);
                        }
                      }}
                      tabIndex={0}
                      aria-label={`Open lead from ${lead.name ?? lead.email}`}
                    >
                      <td className="leads-page__nowrap">
                        <div>{formatDate(lead.createdAt)}</div>
                        <div className="leads-page__muted-sm">{KIND_LABEL[lead.kind]}</div>
                      </td>
                      <td>
                        <div className="leads-page__strong">{lead.name ?? '—'}</div>
                        <div className="leads-page__muted-sm">{lead.email}</div>
                      </td>
                      <td>
                        <div>{lead.academy ?? (lead.sport ? `Sport: ${lead.sport}` : '—')}</div>
                        {lead.city && <div className="leads-page__muted-sm">{lead.city}</div>}
                      </td>
                      <td>
                        <span className={`leads-page__status leads-page__status--${lead.status.toLowerCase()}`}>
                          {STATUS_LABEL[lead.status]}
                        </span>
                      </td>
                      <td className="leads-page__nowrap leads-page__muted-sm">
                        <div title={lead.teamNotifiedAt ? 'Team email sent' : 'Team email not sent'}>
                          Email {lead.teamNotifiedAt ? '✓' : '✗'}
                        </div>
                        <div title={lead.whatsappNotifiedAt ? 'WhatsApp alert sent' : 'WhatsApp alert not sent'}>
                          WhatsApp {lead.whatsappNotifiedAt ? '✓' : '–'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && data.total > data.pageSize && (
            <div className="leads-page__pager">
              <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span className="leads-page__muted-sm">
                Page {page} of {totalPages} · {data.total} leads
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {selected && <LeadDetail key={selected.id} lead={selected} onClose={() => setSelected(null)} onSaved={onSaved} />}
      </div>
    </div>
  );
};

interface LeadDetailProps {
  lead: MarketingLead;
  onClose: () => void;
  onSaved: (lead: MarketingLead) => void;
}

const LeadDetail: React.FC<LeadDetailProps> = ({ lead, onClose, onSaved }) => {
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const dirty = status !== lead.status || notes !== (lead.notes ?? '');

  const save = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const response = await apiClient.patch<MarketingLead>(`/admin/leads/${lead.id}`, { status, notes: notes.trim() || null });
      onSaved(response.data);
      setMessage({ tone: 'ok', text: 'Saved.' });
    } catch {
      setMessage({ tone: 'error', text: 'Could not save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const fields: [string, string | null | undefined][] = [
    ['Email', lead.email],
    ['Phone', lead.phone],
    ['Academy', lead.academy],
    ['City', lead.city],
    ['Role', lead.role ? ROLE_LABEL[lead.role] ?? lead.role : null],
    ['Academy size', lead.academySize ? SIZE_LABEL[lead.academySize] ?? lead.academySize : null],
    ['Sport', lead.sport],
    ['Received', formatDate(lead.createdAt)],
  ];
  const greeting = `Hi ${lead.name?.split(' ')[0] ?? ''}, this is LoveAll about your demo request${lead.academy ? ` for ${lead.academy}` : ''}.`;

  return (
    <aside className="leads-page__detail" aria-label="Lead details">
      <div className="leads-page__detail-head">
        <div>
          <p className="leads-page__muted-sm">{KIND_LABEL[lead.kind]}</p>
          <h2 className="leads-page__detail-title">{lead.name ?? lead.email}</h2>
        </div>
        <button type="button" className="leads-page__close" onClick={onClose} aria-label="Close details">
          ×
        </button>
      </div>

      <div className="leads-page__actions">
        <a className="btn btn-secondary btn-sm" href={`mailto:${lead.email}`}>
          Email
        </a>
        {lead.phone && (
          <>
            <a className="btn btn-secondary btn-sm" href={`tel:${lead.phone.replace(/\s/g, '')}`}>
              Call
            </a>
            <a className="btn btn-secondary btn-sm" href={whatsappLink(lead.phone, greeting)} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </>
        )}
      </div>

      <dl className="leads-page__fields">
        {fields
          .filter(([, v]) => v)
          .map(([label, value]) => (
            <div key={label} className="leads-page__field">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>

      {lead.message && (
        <div className="leads-page__message">
          <p className="leads-page__label">What they'd like to see</p>
          <p>{lead.message}</p>
        </div>
      )}

      <div className="leads-page__notify">
        <span>Team email: {lead.teamNotifiedAt ? formatDate(lead.teamNotifiedAt) : 'not sent'}</span>
        <span>WhatsApp alert: {lead.whatsappNotifiedAt ? formatDate(lead.whatsappNotifiedAt) : 'not sent'}</span>
        <span>Confirmation to lead: {lead.confirmationSentAt ? formatDate(lead.confirmationSentAt) : 'not sent'}</span>
      </div>

      <label className="leads-page__label" htmlFor="lead-status">
        Status
      </label>
      <select id="lead-status" className="leads-page__select" value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)}>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <label className="leads-page__label" htmlFor="lead-notes">
        Notes
      </label>
      <textarea
        id="lead-notes"
        className="leads-page__notes"
        rows={5}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Calls, demo date, follow-ups…"
      />

      <div className="leads-page__save">
        {message && (
          <span className={message.tone === 'ok' ? 'leads-page__ok' : 'leads-page__error-text'} role="status">
            {message.text}
          </span>
        )}
        <button type="button" className="btn btn-primary" disabled={!dirty || saving} onClick={() => void save()}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </aside>
  );
};

export default AdminLeadsPage;
