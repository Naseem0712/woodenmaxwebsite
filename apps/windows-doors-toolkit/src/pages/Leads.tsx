import { Link } from 'react-router-dom';
import { v4 as uid } from 'uuid';
import { Btn, Card, Kpi, PageHeader, Toolbar } from '../components/ui';
import { calcSiteMeasure } from '../engine/calcs';
import { useApp } from '../store/AppContext';
import type { Lead, LeadStatus } from '../types';

const STATUSES: LeadStatus[] = ['New', 'Site visit', 'Measured', 'Quoted', 'Won', 'Lost'];
const SOURCES = ['Walk-in', 'Referral', 'Builder', 'Architect', 'Social media', 'Website', 'Old customer'];
const NEEDS = ['New windows', 'Replace old windows', 'Glass work', 'Partition', 'Mesh only', 'Repair'];
const SITE_TYPES = ['Home', 'Flat', 'Shop', 'Office', 'Builder project'];

export function LeadsPage() {
  const { state, patch } = useApp();
  const site = calcSiteMeasure(state);
  const today = new Date().toISOString().slice(0, 10);
  const open = state.leads.filter((l) => l.status !== 'Won' && l.status !== 'Lost');
  const dueToday = open.filter((l) => l.followUpDate && l.followUpDate <= today);
  const won = state.leads.filter((l) => l.status === 'Won');

  const update = (id: string, patchLead: Partial<Lead>) => {
    patch(
      'leads',
      state.leads.map((l) => (l.id === id ? { ...l, ...patchLead } : l)),
    );
  };

  const addLead = () => {
    const n = state.leads.length + 3001;
    patch('leads', [
      ...state.leads,
      {
        id: uid(),
        leadNo: `LD-${n}`,
        date: today,
        name: '',
        phone: '',
        area: '',
        addressNote: '',
        siteType: 'Home',
        source: 'Walk-in',
        need: 'New windows',
        windowTypeHint: '',
        openingsCount: 0,
        status: 'New',
        followUpDate: today,
        owner: '',
        notes: '',
      },
    ]);
  };

  const loadLeadOnJob = (lead: Lead) => {
    patch('jobMeta', {
      ...state.jobMeta,
      customerName: lead.name,
      siteAddress: lead.addressNote || `${lead.area}`,
      jobLabel: `${lead.leadNo} ${lead.name}`.trim(),
    });
    patch('quote', {
      ...state.quote,
      customerName: lead.name,
      siteAddress: lead.addressNote || lead.area,
      phone: lead.phone,
    });
  };

  return (
    <div>
      <PageHeader
        title="Leads / Enquiries"
        subtitle="One row per enquiry. Set follow-up date, then capture openings on Site Measure and send 08 Quotation."
        badge="CRM lite"
      />
      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        <Kpi label="Leads" value={state.leads.length} />
        <Kpi label="Open" value={open.length} />
        <Kpi label="Follow-up ≤ today" value={dueToday.length} hint="call list" />
        <Kpi label="Won" value={won.length} hint={`${site.rows.length} measure lines`} />
      </div>

      <Card
        title="Leads register"
        actions={
          <Toolbar>
            <Btn onClick={addLead}>+ Add lead</Btn>
            <Btn variant="ghost">
              <Link to="/site-measure">→ Site Measure</Link>
            </Btn>
          </Toolbar>
        }
      >
        <div className="table-panel">
          <table className="data">
            <thead>
              <tr>
                <th>Lead No</th>
                <th>Date</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Area</th>
                <th>Site</th>
                <th>Source</th>
                <th>Need</th>
                <th>Status</th>
                <th>Follow-up</th>
                <th>Owner</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.leads.map((l) => (
                <tr key={l.id}>
                  <td>
                    <input value={l.leadNo} onChange={(e) => update(l.id, { leadNo: e.target.value })} />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={l.date}
                      onChange={(e) => update(l.id, { date: e.target.value })}
                    />
                  </td>
                  <td>
                    <input value={l.name} onChange={(e) => update(l.id, { name: e.target.value })} />
                  </td>
                  <td>
                    <input value={l.phone} onChange={(e) => update(l.id, { phone: e.target.value })} />
                  </td>
                  <td>
                    <input value={l.area} onChange={(e) => update(l.id, { area: e.target.value })} />
                  </td>
                  <td>
                    <select
                      value={l.siteType}
                      onChange={(e) => update(l.id, { siteType: e.target.value })}
                    >
                      {SITE_TYPES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select value={l.source} onChange={(e) => update(l.id, { source: e.target.value })}>
                      {SOURCES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select value={l.need} onChange={(e) => update(l.id, { need: e.target.value })}>
                      {NEEDS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={l.status}
                      onChange={(e) => update(l.id, { status: e.target.value as LeadStatus })}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="date"
                      value={l.followUpDate}
                      onChange={(e) => update(l.id, { followUpDate: e.target.value })}
                    />
                  </td>
                  <td>
                    <input value={l.owner} onChange={(e) => update(l.id, { owner: e.target.value })} />
                  </td>
                  <td className="row-actions">
                    <Btn variant="ghost" onClick={() => loadLeadOnJob(l)}>
                      Use on job
                    </Btn>
                    <Btn variant="danger" onClick={() => patch('leads', state.leads.filter((x) => x.id !== l.id))}>
                      Del
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
