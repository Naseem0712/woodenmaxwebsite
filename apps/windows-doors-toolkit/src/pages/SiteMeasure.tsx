import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uid } from 'uuid';
import { ExportToolbar } from '../components/ExportToolbar';
import { SiteMeasureOpeningCard } from '../components/SiteMeasureOpeningCard';
import {
  Btn,
  Card,
  Field,
  Input,
  Kpi,
  Money,
  Num,
  NumberInput,
  PageHeader,
  Toolbar,
} from '../components/ui';
import { applySeriesToCasement, applySeriesToSliding, calcSiteMeasure } from '../engine/calcs';
import { buildBomDocument, buildSiteMeasureQuoteDocument } from '../engine/exportDocs';
import { activeProject, resolveLessOffMm, settingsLessOffForMaterial, withPersistedNet } from '../engine/lessOff';
import { filterProfiles, filterSeries, filterWindowTypes, projectMaterial } from '../engine/materialContext';
import {
  defaultsForWindowType,
  meshTypeLabel,
  resolveMeshCosting,
  suggestOpenableMesh,
  suggestSlidingMeshFromTracks,
  syncMeshYesNo,
} from '../engine/meshCosting';
import { useApp } from '../store/AppContext';
import type { CutLine, MeshTypeId, SiteMeasureLine, Unit, YesNo } from '../types';

const MESH_TYPES: MeshTypeId[] = [
  'none',
  'rolling',
  'collapsible',
  'fixed',
  'door-side',
  'sliding',
  'swing',
];
type SiteTab = 'openings' | 'less-off';

export function SiteMeasurePage() {
  const { state, patch, setState, refreshSiteMeasureNets, updateProjectLessOff } = useApp();
  const [tab, setTab] = useState<SiteTab>('openings');
  const calc = calcSiteMeasure(state);
  const a = state.allowances;
  const meshSettings = resolveMeshCosting(a);
  const proj = activeProject(state);
  const material = projectMaterial(state);
  const types = filterWindowTypes(state.windowTypes, material);
  const defaults = resolveLessOffMm(state, null);
  const settingsLess = settingsLessOffForMaterial(state, material);

  const update = (id: string, patchLine: Partial<SiteMeasureLine>) => {
    patch(
      'siteMeasures',
      state.siteMeasures.map((r) => {
        if (r.id !== id) return r;
        const merged = { ...r, ...patchLine };
        if (
          patchLine.meshDoors != null ||
          patchLine.meshType != null
        ) {
          merged.mesh = syncMeshYesNo(
            patchLine.meshDoors ?? merged.meshDoors,
            patchLine.meshType ?? merged.meshType,
          );
        }
        return withPersistedNet(state, merged);
      }),
    );
  };

  const addLine = () => {
    const lead = state.leads[0];
    const wt = types[0];
    const width = 1200;
    const height = 1200;
    const doorMesh = defaultsForWindowType(state, wt?.id ?? '');
    const draft: SiteMeasureLine = {
      id: uid(),
      measuredOn: new Date().toISOString().slice(0, 10),
      leadId: lead?.id ?? '',
      location: '',
      windowTypeId: wt?.id ?? '',
      width,
      height,
      unit: a.unit,
      qty: 1,
      ratePerSqft: wt?.ratePerSqft ?? 0,
      mesh: doorMesh.mesh ?? 'No',
      tracks: doorMesh.tracks ?? 0,
      glassDoors: doorMesh.glassDoors ?? 2,
      meshDoors: doorMesh.meshDoors ?? 0,
      meshType: doorMesh.meshType ?? 'none',
      hasVent: doorMesh.hasVent ?? 'No',
      ventCount: doorMesh.ventCount ?? 0,
      toughened: 'No',
      measuredBy: lead?.owner ?? '',
      lessOffWidthMm: null,
      lessOffHeightMm: null,
      netWidth: width,
      netHeight: height,
      notes: '',
    };
    patch('siteMeasures', [...state.siteMeasures, withPersistedNet(state, draft)]);
  };

  const applyTrackDefaults = (id: string, tracks: number) => {
    const sug = suggestSlidingMeshFromTracks(meshSettings, tracks);
    update(id, {
      tracks,
      glassDoors: sug.glassDoors,
      meshDoors: sug.meshDoors,
      meshType: sug.meshType,
      mesh: sug.mesh,
      hasVent: 'No',
      ventCount: 0,
    });
  };

  const pushToOpenings = () => {
    const first = calc.rows[0];
    const lead = state.leads.find((l) => l.id === first?.line.leadId) ?? state.leads[0];
    const openings = state.siteMeasures.map((m) => {
      const netted = withPersistedNet(state, m);
      return {
        id: uid(),
        location: m.location,
        windowTypeId: m.windowTypeId,
        width: netted.netWidth,
        height: netted.netHeight,
        qty: m.qty,
        tracks: m.tracks,
        glassDoors: m.glassDoors,
        meshDoors: m.meshDoors,
        meshType: m.meshType,
        hasVent: m.hasVent,
        ventCount: m.ventCount,
        notes: m.notes ?? '',
      };
    });
    const unit = state.siteMeasures[0]?.unit ?? a.unit;
    setState((s) => ({
      ...s,
      openings,
      allowances: { ...s.allowances, unit },
      jobMeta: {
        ...s.jobMeta,
        customerName: lead?.name || s.jobMeta.customerName,
        siteAddress: lead?.addressNote || s.jobMeta.siteAddress,
        jobLabel: lead ? `${lead.leadNo} site measure` : s.jobMeta.jobLabel,
      },
      quote: {
        ...s.quote,
        customerName: lead?.name || s.quote.customerName,
        siteAddress: lead?.addressNote || s.quote.siteAddress,
        phone: lead?.phone || s.quote.phone,
      },
      leads: lead
        ? s.leads.map((l) =>
            l.id === lead.id
              ? {
                  ...l,
                  status: l.status === 'Won' || l.status === 'Lost' ? l.status : 'Measured',
                  openingsCount: openings.reduce((n, o) => n + o.qty, 0),
                }
              : l,
          )
        : s.leads,
    }));
  };

  const pushToConfigurator = () => {
    const lines = state.siteMeasures.map((m) => {
      const wt = state.windowTypes.find((t) => t.id === m.windowTypeId);
      const netted = withPersistedNet(state, m);
      const kind = wt?.kind ?? 'sliding';
      const productType =
        kind === 'sliding'
          ? 'sliding'
          : kind === 'door'
            ? 'door'
            : kind === 'casement'
              ? 'openable'
              : 'fix';
      return {
        id: uid(),
        location: m.location || 'Opening',
        widthMm: netted.netWidth,
        heightMm: netted.netHeight,
        qty: m.qty,
        productType: productType as 'sliding' | 'openable' | 'fix' | 'door',
        material: (wt?.material ?? material) as 'UPVC' | 'Aluminium',
        windowTypeId: m.windowTypeId,
        glassTypeId: state.glassTypes[0]?.id ?? '',
        colourId: state.colourOptions[0]?.id ?? '',
        tracks: m.tracks,
        glassDoors: m.glassDoors,
        meshDoors: m.meshDoors,
        meshType: m.meshType,
        hasVent: m.hasVent,
        ventCount: m.ventCount,
        notes: m.notes ?? '',
      };
    });
    patch('configuratorLines', lines);
  };

  const pushToCosting = () => {
    const slidingLine = state.siteMeasures.find((m) => {
      const wt = state.windowTypes.find((t) => t.id === m.windowTypeId);
      return wt?.kind === 'sliding' || (m.tracks ?? 0) > 0;
    });
    const casementLine = state.siteMeasures.find((m) => {
      const wt = state.windowTypes.find((t) => t.id === m.windowTypeId);
      return wt?.kind === 'casement' || wt?.kind === 'door';
    });
    setState((s) => {
      let next = { ...s };
      if (slidingLine) {
        const wt = s.windowTypes.find((t) => t.id === slidingLine.windowTypeId);
        const series =
          s.series.find((x) => x.id === wt?.seriesId) ??
          filterSeries(s.series, material).find((x) => x.kind === 'sliding');
        const netted = withPersistedNet(s, slidingLine);
        let sliding = { ...s.sliding };
        if (series) sliding = applySeriesToSliding(series, sliding, s.allowances);
        sliding = {
          ...sliding,
          tracks: slidingLine.tracks || sliding.tracks,
          glassShutters: slidingLine.glassDoors || sliding.glassShutters,
          meshDoors: slidingLine.meshDoors,
          meshType: slidingLine.meshType,
          mesh: syncMeshYesNo(slidingLine.meshDoors, slidingLine.meshType),
          widthMm: netted.netWidth,
          heightMm: netted.netHeight,
          qty: slidingLine.qty,
        };
        next = { ...next, sliding };
      }
      if (casementLine) {
        const wt = s.windowTypes.find((t) => t.id === casementLine.windowTypeId);
        const series =
          s.series.find((x) => x.id === wt?.seriesId) ??
          filterSeries(s.series, material).find((x) => x.kind === 'casement' || x.kind === 'door');
        const netted = withPersistedNet(s, casementLine);
        let casement = { ...s.casement };
        if (series) casement = applySeriesToCasement(series, casement, s.allowances);
        const ventSug =
          casementLine.hasVent === 'Yes'
            ? suggestOpenableMesh(meshSettings, {
                openablePanels: casementLine.glassDoors || casement.openablePanels,
                hasVent: 'Yes',
                doorSide: false,
              })
            : null;
        casement = {
          ...casement,
          panels: Math.max(casement.panels, casementLine.glassDoors || 1),
          openablePanels: casementLine.glassDoors || casement.openablePanels,
          meshDoors: casementLine.meshDoors,
          meshType: casementLine.meshType,
          mesh: syncMeshYesNo(casementLine.meshDoors, casementLine.meshType),
          hasVent: casementLine.hasVent,
          ventCount: casementLine.ventCount || ventSug?.ventCount || 0,
          widthMm: netted.netWidth,
          heightMm: netted.netHeight,
          qty: casementLine.qty,
        };
        next = { ...next, casement };
      }
      return next;
    });
  };

  const pushToCutting = () => {
    const cuts: CutLine[] = [];
    const matSeries = filterSeries(state.series, material);
    const matProfiles = filterProfiles(state.profiles, material);
    for (const m of state.siteMeasures) {
      const netted = withPersistedNet(state, m);
      const seriesId =
        state.windowTypes.find((t) => t.id === m.windowTypeId)?.seriesId ??
        matSeries[0]?.id ??
        '';
      const profile =
        matProfiles.find((p) => p.name.toLowerCase().includes('frame')) ?? matProfiles[0];
      cuts.push({
        id: uid(),
        windowLabel: m.location || 'Opening',
        profileId: profile?.id ?? '',
        cutMm: netted.netWidth,
        pieces: 2 * m.qty,
        seriesId,
        siteMeasureId: m.id,
      });
      cuts.push({
        id: uid(),
        windowLabel: m.location || 'Opening',
        profileId: profile?.id ?? '',
        cutMm: netted.netHeight,
        pieces: 2 * m.qty,
        seriesId,
        siteMeasureId: m.id,
      });
    }
    patch('cuts', cuts);
  };

  const exportBuilders = useMemo(
    () => ({
      quote: (rateMode: 'include' | 'exclude') => buildSiteMeasureQuoteDocument(state, rateMode),
      bom: (rateMode: 'include' | 'exclude') => buildBomDocument(state, rateMode, 'site-measure'),
    }),
    [state],
  );

  return (
    <div>
      <PageHeader
        title="Site Measurements"
        subtitle={`Record site W×H, glass doors + mesh (for costing) → net fab. Less-off on its own tab. Types locked to ${material}.`}
        badge={material}
      />

      <ExportToolbar builders={exportBuilders} />

      <div className="chip-row" style={{ marginBottom: '0.85rem' }}>
        {(
          [
            ['openings', 'Site Measure'],
            ['less-off', 'Less-off'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`chip ${tab === id ? 'chip-active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'less-off' ? (
        <>
          <Card title={`Less-off (site → fabrication) · ${material}`}>
            <div className="grid grid-4">
              <Field
                label={`Settings ${material} less-off W mm`}
                tone="link"
                hint="Settings → Allowances (per material)"
              >
                <NumberInput
                  tone="link"
                  value={settingsLess.widthMm}
                  onCommit={(n) =>
                    patch('allowances', {
                      ...a,
                      ...(material === 'Aluminium'
                        ? { lessOffAluWidthMm: n ?? a.lessOffAluWidthMm }
                        : { lessOffWidthMm: n ?? a.lessOffWidthMm }),
                    })
                  }
                />
              </Field>
              <Field label={`Settings ${material} less-off H mm`} tone="link">
                <NumberInput
                  tone="link"
                  value={settingsLess.heightMm}
                  onCommit={(n) =>
                    patch('allowances', {
                      ...a,
                      ...(material === 'Aluminium'
                        ? { lessOffAluHeightMm: n ?? a.lessOffAluHeightMm }
                        : { lessOffHeightMm: n ?? a.lessOffHeightMm }),
                    })
                  }
                />
              </Field>
              <Field
                label="Project less-off W mm"
                hint={
                  proj?.lessOffWidthMm == null
                    ? `Using Settings ${defaults.widthMm}`
                    : 'Project override'
                }
              >
                <NumberInput
                  value={proj?.lessOffWidthMm ?? ''}
                  emptyAs="null"
                  placeholder={`Settings ${defaults.widthMm}`}
                  onCommit={(n) => {
                    if (!proj) return;
                    updateProjectLessOff(proj.id, n, proj.lessOffHeightMm ?? null);
                  }}
                />
              </Field>
              <Field
                label="Project less-off H mm"
                hint={
                  proj?.lessOffHeightMm == null
                    ? `Using Settings ${defaults.heightMm}`
                    : 'Project override'
                }
              >
                <NumberInput
                  value={proj?.lessOffHeightMm ?? ''}
                  emptyAs="null"
                  placeholder={`Settings ${defaults.heightMm}`}
                  onCommit={(n) => {
                    if (!proj) return;
                    updateProjectLessOff(proj.id, proj.lessOffWidthMm ?? null, n);
                  }}
                />
              </Field>
            </div>
            <p className="muted tiny" style={{ marginTop: '0.5rem' }}>
              Effective {material} default:{' '}
              <strong>
                {defaults.widthMm} × {defaults.heightMm} mm
              </strong>
              . Per-row Less W/H on the Site Measure tab still override. Empty project fields inherit
              Settings for this material.
            </p>
            <Toolbar>
              <Btn
                onClick={() => {
                  refreshSiteMeasureNets();
                }}
              >
                Apply → fabrication sizes
              </Btn>
              <span className="tiny muted">
                One apply recomputes net W/H for every opening on this job/quote.
              </span>
            </Toolbar>
          </Card>

          <Card title="Per-row overrides (summary)">
            <div className="table-panel">
              <table className="data">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Site W×H</th>
                    <th>Less W</th>
                    <th>Less H</th>
                    <th>Net W×H</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.rows.map((r) => {
                    const rowOverride =
                      r.line.lessOffWidthMm != null || r.line.lessOffHeightMm != null;
                    return (
                      <tr key={r.line.id} className={r.warnNegative ? 'row-warn' : undefined}>
                        <td>{r.line.location || '—'}</td>
                        <td className="calc">
                          <Num n={r.line.width} d={0} /> × <Num n={r.line.height} d={0} />
                        </td>
                        <td className="calc">
                          <Num n={r.lessWidthMm} d={0} />
                          {r.line.lessOffWidthMm != null ? ' *' : ''}
                        </td>
                        <td className="calc">
                          <Num n={r.lessHeightMm} d={0} />
                          {r.line.lessOffHeightMm != null ? ' *' : ''}
                        </td>
                        <td className={`calc ${r.warnNegative ? 'warn' : ''}`}>
                          <Num n={r.netWidth} d={0} /> × <Num n={r.netHeight} d={0} />
                        </td>
                        <td className="tiny muted">
                          {rowOverride ? 'Row override' : 'Job / Settings'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="tiny muted" style={{ marginTop: '0.5rem' }}>
              Edit per-row Less W/H on the Site Measure tab. * = row override.
            </p>
          </Card>
        </>
      ) : null}

      {tab === 'openings' ? (
        <>
      <Card title="Add-on rates (Settings)">
        <div className="grid grid-4">
          <Field label="Min chargeable sqft" tone="link" hint="Settings → Allowances">
            <Input
              tone="link"
              type="number"
              value={a.minChargeableSqft}
              onChange={(e) =>
                patch('allowances', { ...a, minChargeableSqft: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Rolling mesh ₹/sqft" tone="link" hint="Settings → Allowances → Mesh">
            <Input
              tone="link"
              type="number"
              value={meshSettings.rollingPerSqft}
              onChange={(e) =>
                patch('allowances', {
                  ...a,
                  meshCosting: { ...meshSettings, rollingPerSqft: Number(e.target.value) },
                  meshPerSqft: Number(e.target.value),
                })
              }
            />
          </Field>
          <Field label="Collapsible ₹/sqft" tone="link">
            <Input
              tone="link"
              type="number"
              value={meshSettings.collapsiblePerSqft}
              onChange={(e) =>
                patch('allowances', {
                  ...a,
                  meshCosting: { ...meshSettings, collapsiblePerSqft: Number(e.target.value) },
                })
              }
            />
          </Field>
          <Field label="Toughened extra ₹/sqft" tone="link">
            <Input
              tone="link"
              type="number"
              value={a.toughenedExtraPerSqft}
              onChange={(e) =>
                patch('allowances', { ...a, toughenedExtraPerSqft: Number(e.target.value) })
              }
            />
          </Field>
        </div>
        <p className="muted tiny" style={{ marginTop: '0.5rem' }}>
          Door/mesh track defaults &amp; fixed/door-side rates:{' '}
          <Link to="/settings/allowances">Settings → Allowances</Link>. Window-type ₹/sqft from{' '}
          <Link to="/settings/window-types">Window types</Link>. Settings/project less-off W/H live on
          the Less-off tab (effective now {defaults.widthMm} × {defaults.heightMm} mm).
        </p>
      </Card>

      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        <Kpi label="Openings (qty)" value={calc.totalQty} />
        <Kpi label="Chargeable sqft" value={<Num n={calc.totalSqft} />} />
        <Kpi label="Mesh add-on" value={<Money n={calc.totalMeshAmount} />} hint="typed mesh lines" />
        <Kpi label="Measured value" value={<Money n={calc.totalAmount} />} hint="before discount / GST" />
      </div>

      <Card
        title="Measured openings"
        actions={
          <Toolbar>
            <Btn onClick={addLine}>+ Add opening</Btn>
            <Btn variant="ghost" onClick={pushToOpenings} disabled={!state.siteMeasures.length}>
              Push net → 01 Openings + Quote
            </Btn>
            <Btn variant="ghost" onClick={pushToCosting} disabled={!state.siteMeasures.length}>
              Push → 02/03 Costing
            </Btn>
            <Btn variant="ghost" onClick={pushToConfigurator} disabled={!state.siteMeasures.length}>
              Push → Configurator
            </Btn>
            <Btn variant="ghost" onClick={pushToCutting} disabled={!state.siteMeasures.length}>
              Push net → 05 Cutting
            </Btn>
          </Toolbar>
        }
      >
        <div className="site-measure-openings-cards" data-testid="site-measure-opening-cards">
          {calc.rows.map((r, index) => (
            <SiteMeasureOpeningCard
              key={r.line.id}
              index={index}
              row={r}
              state={state}
              types={types}
              leads={state.leads}
              meshSettings={meshSettings}
              update={update}
              applyTrackDefaults={applyTrackDefaults}
              onDelete={() =>
                patch(
                  'siteMeasures',
                  state.siteMeasures.filter((x) => x.id !== r.line.id),
                )
              }
            />
          ))}
          {!calc.rows.length ? (
            <p className="muted tiny">No openings yet — tap + Add opening.</p>
          ) : null}
        </div>

        <div className="table-panel site-measure-openings-table">
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Lead</th>
                <th>Location</th>
                <th>Type</th>
                <th>Site W</th>
                <th>Site H</th>
                <th>Less W</th>
                <th>Less H</th>
                <th>Net W</th>
                <th>Net H</th>
                <th>Unit</th>
                <th>Qty</th>
                <th>Tracks</th>
                <th>Glass doors</th>
                <th>Mesh doors</th>
                <th>Mesh type</th>
                <th>Vent</th>
                <th>₹/sqft</th>
                <th>Tough.</th>
                <th>Sqft</th>
                <th>Mesh ₹</th>
                <th>Amount</th>
                <th>Notes</th>
                <th>By</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {calc.rows.map((r) => {
                const wt = state.windowTypes.find((t) => t.id === r.line.windowTypeId);
                const isSliding = wt?.kind === 'sliding' || (r.line.tracks ?? 0) > 0;
                return (
                  <tr key={r.line.id} className={r.warnNegative ? 'row-warn' : undefined}>
                    <td>
                      <input
                        type="date"
                        value={r.line.measuredOn}
                        onChange={(e) => update(r.line.id, { measuredOn: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        value={r.line.leadId}
                        onChange={(e) => update(r.line.id, { leadId: e.target.value })}
                      >
                        <option value="">—</option>
                        {state.leads.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.leadNo} · {l.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        value={r.line.location}
                        onChange={(e) => update(r.line.id, { location: e.target.value })}
                        placeholder="Bedroom window"
                      />
                    </td>
                    <td>
                      <select
                        value={r.line.windowTypeId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const nextWt = state.windowTypes.find((t) => t.id === id);
                          const doorMesh = defaultsForWindowType(state, id);
                          update(r.line.id, {
                            windowTypeId: id,
                            ratePerSqft: nextWt?.ratePerSqft ?? r.line.ratePerSqft,
                            ...doorMesh,
                          });
                        }}
                      >
                        {types.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.kind}: {t.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <NumberInput
                        value={r.line.width}
                        onCommit={(n) => update(r.line.id, { width: n ?? r.line.width })}
                      />
                    </td>
                    <td>
                      <NumberInput
                        value={r.line.height}
                        onCommit={(n) => update(r.line.id, { height: n ?? r.line.height })}
                      />
                    </td>
                    <td>
                      <NumberInput
                        value={r.line.lessOffWidthMm ?? ''}
                        emptyAs="null"
                        placeholder={String(r.lessWidthMm)}
                        title={`Effective ${r.lessWidthMm} mm`}
                        onCommit={(n) => update(r.line.id, { lessOffWidthMm: n })}
                      />
                    </td>
                    <td>
                      <NumberInput
                        value={r.line.lessOffHeightMm ?? ''}
                        emptyAs="null"
                        placeholder={String(r.lessHeightMm)}
                        title={`Effective ${r.lessHeightMm} mm`}
                        onCommit={(n) => update(r.line.id, { lessOffHeightMm: n })}
                      />
                    </td>
                    <td className={`calc ${r.warnNegative ? 'warn' : ''}`}>
                      <Num n={r.netWidth} d={0} />
                      {r.warnNegative ? ' ⚠' : ''}
                    </td>
                    <td className={`calc ${r.warnNegative ? 'warn' : ''}`}>
                      <Num n={r.netHeight} d={0} />
                    </td>
                    <td>
                      <select
                        value={r.line.unit}
                        onChange={(e) => update(r.line.id, { unit: e.target.value as Unit })}
                      >
                        <option value="mm">mm</option>
                        <option value="inch">inch</option>
                        <option value="ft">ft</option>
                      </select>
                    </td>
                    <td>
                      <NumberInput
                        value={r.line.qty}
                        onCommit={(n) => update(r.line.id, { qty: n ?? r.line.qty })}
                      />
                    </td>
                    <td>
                      {isSliding ? (
                        <NumberInput
                          value={r.line.tracks}
                          step={0.5}
                          onCommit={(n) => applyTrackDefaults(r.line.id, n ?? r.line.tracks)}
                        />
                      ) : (
                        <span className="muted tiny">—</span>
                      )}
                    </td>
                    <td>
                      <NumberInput
                        value={r.line.glassDoors}
                        onCommit={(n) => update(r.line.id, { glassDoors: n ?? r.line.glassDoors })}
                      />
                    </td>
                    <td>
                      <NumberInput
                        value={r.line.meshDoors}
                        onCommit={(n) => {
                          const meshDoors = Math.max(0, n ?? 0);
                          const meshType =
                            meshDoors === 0
                              ? 'none'
                              : r.line.meshType === 'none'
                                ? isSliding
                                  ? 'rolling'
                                  : 'door-side'
                                : r.line.meshType;
                          update(r.line.id, { meshDoors, meshType });
                        }}
                      />
                    </td>
                    <td>
                      <select
                        value={r.line.meshType}
                        onChange={(e) => {
                          const meshType = e.target.value as MeshTypeId;
                          const meshDoors =
                            meshType === 'none'
                              ? 0
                              : Math.max(1, r.line.meshDoors || 1);
                          update(r.line.id, { meshType, meshDoors });
                        }}
                      >
                        {MESH_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {meshTypeLabel(t)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={r.line.hasVent}
                        onChange={(e) => {
                          const hasVent = e.target.value as YesNo;
                          if (hasVent === 'Yes') {
                            const sug = suggestOpenableMesh(meshSettings, {
                              openablePanels: r.line.glassDoors || 1,
                              hasVent: 'Yes',
                              doorSide: false,
                            });
                            update(r.line.id, {
                              hasVent,
                              ventCount: sug.ventCount,
                              meshDoors: sug.meshDoors,
                              meshType: sug.meshType,
                            });
                          } else {
                            update(r.line.id, { hasVent, ventCount: 0 });
                          }
                        }}
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </td>
                    <td>
                      <NumberInput
                        value={r.line.ratePerSqft}
                        onCommit={(n) => update(r.line.id, { ratePerSqft: n ?? r.line.ratePerSqft })}
                      />
                    </td>
                    <td>
                      <select
                        value={r.line.toughened}
                        onChange={(e) => update(r.line.id, { toughened: e.target.value as YesNo })}
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </td>
                    <td className="calc">
                      <Num n={r.totalSqft} />
                    </td>
                    <td className="calc">
                      <Money n={r.meshAmount} />
                    </td>
                    <td className="calc">
                      <Money n={r.amount} />
                    </td>
                    <td>
                      <input
                        value={r.line.notes ?? ''}
                        onChange={(e) => update(r.line.id, { notes: e.target.value })}
                        placeholder="Note"
                      />
                    </td>
                    <td>
                      <input
                        value={r.line.measuredBy}
                        onChange={(e) => update(r.line.id, { measuredBy: e.target.value })}
                      />
                    </td>
                    <td>
                      <Btn
                        variant="danger"
                        onClick={() =>
                          patch(
                            'siteMeasures',
                            state.siteMeasures.filter((x) => x.id !== r.line.id),
                          )
                        }
                      >
                        Del
                      </Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted tiny" style={{ marginTop: '0.5rem' }}>
          Sliding: set tracks (2 = typically no mesh; 2.5 / 3+ can take mesh) then glass doors + mesh
          doors + type. Openable: door-side mesh uses leaf area; vent → fixed mesh. Rates from Settings.
          Per-row Less W/H stay here; job/Settings less-off is on the Less-off tab.
        </p>
      </Card>
        </>
      ) : null}
    </div>
  );
}
