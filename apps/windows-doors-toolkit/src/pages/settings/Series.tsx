import { useEffect, useMemo, useState } from 'react';
import { v4 as uid } from 'uuid';
import { Btn, Card, Field, Input, PageHeader, Select, Toolbar, NumberInput } from '../../components/ui';
import {
  defaultFrictionStayRates,
  defaultLaminationArmRates,
  ensureSeriesHardwareDefaults,
  frictionStayLabel,
  rateForSize,
  seriesNameKindMismatch,
} from '../../engine/hardwareKind';
import { filterProfiles, isUpvcOnlyMemberClass, projectMaterial } from '../../engine/materialContext';
import type {
  InterlockStyle,
  Material,
  MemberRole,
  ProfileMember,
  SeriesDefinition,
  SeriesKind,
  ShutterPart,
  SizedRate,
} from '../../types';
import { useApp } from '../../store/AppContext';

const TRACK_TYPES = ['2-track', '2.5-track', '3-track'] as const;
const SHUTTER_PARTS: { value: ShutterPart; label: string; memberClass: string }[] = [
  { value: 'sash', label: 'Sash', memberClass: 'Shutter' },
  { value: 'top', label: 'Top', memberClass: 'Shutter' },
  { value: 'bottom', label: 'Bottom', memberClass: 'Shutter' },
  { value: 'handle-side', label: 'Handle-side', memberClass: 'Shutter' },
  { value: 'center', label: 'Center vertical', memberClass: 'Shutter' },
  { value: 'interlock', label: 'Interlock', memberClass: 'Meeting' },
];

const SLIDING_CLASSES_SHARED = [
  '2-track',
  '2.5-track',
  '3-track',
  'Shutter',
  'Meeting',
  'Mesh',
  'Window',
] as const;
const SLIDING_CLASSES_UPVC_ONLY = ['UPVC only', 'UPVC shutter'] as const;
const CASEMENT_CLASSES_SHARED = [
  'Window',
  'Mullion',
  'Openable panel',
  'Panel',
  'Mesh panel',
] as const;
const CASEMENT_CLASSES_UPVC_ONLY = ['UPVC only', 'UPVC mullion', 'UPVC openable'] as const;

function slidingClassesFor(material: Material): string[] {
  return material === 'UPVC'
    ? [...SLIDING_CLASSES_SHARED, ...SLIDING_CLASSES_UPVC_ONLY]
    : [...SLIDING_CLASSES_SHARED];
}
function casementClassesFor(material: Material): string[] {
  return material === 'UPVC'
    ? [...CASEMENT_CLASSES_SHARED, ...CASEMENT_CLASSES_UPVC_ONLY]
    : [...CASEMENT_CLASSES_SHARED];
}
function doorClassesFor(material: Material): string[] {
  return [...casementClassesFor(material), 'Door leaf'];
}

const SLIDING_ROLES: { value: MemberRole; label: string }[] = [
  { value: 'track', label: 'Track' },
  { value: 'shutter', label: 'Shutter' },
  { value: 'mesh', label: 'Mesh' },
  { value: 'other', label: 'Other' },
];

function roleFromClass(memberClass: string): MemberRole {
  if (TRACK_TYPES.includes(memberClass as (typeof TRACK_TYPES)[number])) return 'track';
  if (memberClass === 'Mesh' || memberClass === 'Mesh panel') return 'mesh';
  if (
    memberClass === 'Shutter' ||
    memberClass === 'Meeting' ||
    memberClass === 'UPVC shutter' ||
    memberClass === 'Openable panel' ||
    memberClass === 'Panel'
  ) {
    return 'shutter';
  }
  return 'other';
}

function shutterPartFromMember(m: ProfileMember): ShutterPart {
  if (m.shutterPart) return m.shutterPart;
  if (m.memberClass === 'Meeting') return 'interlock';
  const n = m.name.toLowerCase();
  if (/\btop\b/.test(n)) return 'top';
  if (/\bbottom\b/.test(n)) return 'bottom';
  if (/handle/.test(n)) return 'handle-side';
  if (/interlock|meeting/.test(n)) return 'interlock';
  return 'sash';
}

function blankSeries(): SeriesDefinition {
  const frictionStayRates = defaultFrictionStayRates();
  return ensureSeriesHardwareDefaults({
    id: uid(),
    name: 'New series',
    material: 'UPVC',
    kind: 'sliding',
    brand: '',
    defaultTracks: 2,
    defaultShutters: 2,
    defaultPanels: 2,
    defaultOpenable: 1,
    glassInsetMm: 70,
    rollersPerShutter: 2,
    rollerRate: 60,
    lockHandleSet: 350,
    lockHandleLabel: 'Metro Type Matt black lock',
    otherHardware: 120,
    frictionStayRate: rateForSize(frictionStayRates, 305, 320),
    handleRate: 250,
    frictionStaySizeMm: 305,
    frictionStayRates,
    frictionStaySetsPerOpenable: 1,
    hingeQtyPerOpenable: 2,
    hingeRate: 180,
    doorConnectorQtyPerDoor: 4,
    doorConnectorRate: 45,
    laminationArmSizeMm: 200,
    laminationArmRates: defaultLaminationArmRates(),
    lockGuideRate: 35,
    brushRate: 8,
    epdmRate: 12,
    lockRate: 450,
    doorCloserRate: 0,
    floorSpringRate: 0,
    doorExtraKind: 'none',
    doorCloserBrand: '',
    doorCloserColour: '',
    doorCloserWeightKg: 0,
    floorSpringBrand: '',
    floorSpringColour: '',
    floorSpringWeightKg: 0,
    doorSetRate: 0,
    swingHandleRate: 0,
    swingLockRate: 0,
    meshAreaShare: 0.5,
    meshNetPerSqft: 40,
    note: '',
    members: [
      {
        id: uid(),
        name: 'Outer frame',
        memberClass: '2-track',
        wFactor: 2,
        hFactor: 2,
        ratePerM: 260,
      },
    ],
  });
}

function SizedRateEditor({
  title,
  rows,
  onChange,
}: {
  title: string;
  rows: SizedRate[];
  onChange: (next: SizedRate[]) => void;
}) {
  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div className="tiny muted" style={{ marginBottom: '0.35rem' }}>
        {title}
      </div>
      <table className="data">
        <thead>
          <tr>
            <th>Size</th>
            <th>₹ / unit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sizeMm}>
              <td>{r.label ?? `${r.sizeMm} mm`}</td>
              <td>
                <NumberInput
                  value={r.rate}
                  onChange={(e) =>
                    onChange(rows.map((x) => (x.sizeMm === r.sizeMm ? { ...x, rate: Number(e.target.value) } : x)))
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SettingsSeriesPage() {
  const { state, patch, setState } = useApp();
  const jobMaterial = projectMaterial(state);
  const [materialScope, setMaterialScope] = useState<Material | 'project' | 'all'>('project');
  const scopeMaterial: Material | 'all' =
    materialScope === 'project' ? jobMaterial : materialScope;
  const scopedSeries = useMemo(() => {
    if (scopeMaterial === 'all') return state.series;
    return state.series.filter((s) => s.material === scopeMaterial);
  }, [state.series, scopeMaterial]);

  const [selectedId, setSelectedId] = useState(scopedSeries[0]?.id ?? state.series[0]?.id ?? '');
  /** New series stays local until Save — never auto-persisted into masters. */
  const [draftNew, setDraftNew] = useState<SeriesDefinition | null>(null);

  useEffect(() => {
    if (draftNew) return;
    if (scopedSeries.some((s) => s.id === selectedId)) return;
    setSelectedId(scopedSeries[0]?.id ?? '');
  }, [scopedSeries, selectedId, draftNew]);

  const seriesRaw = useMemo(() => {
    if (draftNew && selectedId === draftNew.id) return draftNew;
    return (
      state.series.find((s) => s.id === selectedId) ??
      scopedSeries[0] ??
      state.series[0]
    );
  }, [state.series, selectedId, draftNew, scopedSeries]);
  const series = seriesRaw ? ensureSeriesHardwareDefaults(seriesRaw) : undefined;
  const isUnsavedNew = Boolean(draftNew && series && draftNew.id === series.id);
  const matProfiles = useMemo(
    () => (series ? filterProfiles(state.profiles, series.material) : []),
    [state.profiles, series],
  );

  const update = (next: SeriesDefinition) => {
    const cleaned = ensureSeriesHardwareDefaults(next);
    if (draftNew && cleaned.id === draftNew.id) {
      setDraftNew(cleaned);
      setSelectedId(cleaned.id);
      return;
    }
    // Functional update so Factor V/H qty commits never lose sibling field edits
    setState((s) => ({
      ...s,
      series: s.series.map((row) => (row.id === cleaned.id ? cleaned : row)),
    }));
    setSelectedId(cleaned.id);
  };

  const set = <K extends keyof SeriesDefinition>(key: K, value: SeriesDefinition[K]) => {
    if (!series) return;
    let next: SeriesDefinition = { ...series, [key]: value };
    if (key === 'frictionStaySizeMm') {
      next.frictionStayRate = rateForSize(next.frictionStayRates, Number(value), next.frictionStayRate);
    }
    if (key === 'frictionStayRates') {
      next.frictionStayRate = rateForSize(
        value as SizedRate[],
        next.frictionStaySizeMm,
        next.frictionStayRate,
      );
    }
    update(next);
  };

  const setMany = (patchFields: Partial<SeriesDefinition>) => {
    if (!series) return;
    update({ ...series, ...patchFields });
  };

  const updateMember = (id: string, patchMember: Partial<ProfileMember>) => {
    if (!series) return;
    if (draftNew && series.id === draftNew.id) {
      setDraftNew((d) => {
        if (!d) return d;
        const base = ensureSeriesHardwareDefaults(d);
        return ensureSeriesHardwareDefaults({
          ...base,
          members: base.members.map((m) => (m.id === id ? { ...m, ...patchMember } : m)),
        });
      });
      return;
    }
    // Functional master update — Factor V/H qty edits must not clobber each other
    const seriesId = series.id;
    setState((s) => {
      const cur = s.series.find((row) => row.id === seriesId);
      if (!cur) return s;
      const base = ensureSeriesHardwareDefaults(cur);
      const cleaned = ensureSeriesHardwareDefaults({
        ...base,
        members: base.members.map((m) => (m.id === id ? { ...m, ...patchMember } : m)),
      });
      return {
        ...s,
        series: s.series.map((row) => (row.id === cleaned.id ? cleaned : row)),
      };
    });
  };

  const applyMemberRole = (id: string, role: MemberRole) => {
    if (!series) return;
    const m = series.members.find((x) => x.id === id);
    if (!m) return;
    if (role === 'track') {
      updateMember(id, { memberClass: '2-track', shutterPart: undefined });
      return;
    }
    if (role === 'mesh') {
      updateMember(id, {
        memberClass: series.kind === 'sliding' ? 'Mesh' : 'Mesh panel',
        shutterPart: undefined,
      });
      return;
    }
    if (role === 'shutter') {
      updateMember(id, { memberClass: 'Shutter', shutterPart: 'sash' });
      return;
    }
    updateMember(id, {
      memberClass: series.kind === 'sliding' ? 'Window' : 'Window',
      shutterPart: undefined,
    });
  };

  const kind = series?.kind ?? 'sliding';
  const seriesMaterial = series?.material ?? jobMaterial;
  const classes =
    kind === 'casement'
      ? casementClassesFor(seriesMaterial)
      : kind === 'door'
        ? doorClassesFor(seriesMaterial)
        : slidingClassesFor(seriesMaterial);
  const showSlidingHw = kind === 'sliding';
  const showCasementHw = kind === 'casement' || kind === 'door' || kind === 'other';
  const showDoorSwingHw = kind === 'door';
  const nameWarn = series ? seriesNameKindMismatch(series.name, series.kind) : null;
  const visibleMembers = useMemo(() => {
    if (!series) return [];
    return series.members.filter(
      (m) => !(series.material === 'Aluminium' && isUpvcOnlyMemberClass(m.memberClass)),
    );
  }, [series]);

  return (
    <div>
      <PageHeader
        title="Series & members"
        subtitle="Masters are material × kind. Scoped to the active project material by default so Aluminium never lists UPVC-only members. New series saves only when you click Save."
      />
      <Toolbar>
        <label className="tiny muted">
          Material{' '}
          <Select
            value={materialScope}
            onChange={(e) =>
              setMaterialScope(e.target.value as Material | 'project' | 'all')
            }
          >
            <option value="project">Project ({jobMaterial})</option>
            <option value="UPVC">UPVC</option>
            <option value="Aluminium">Aluminium</option>
            <option value="all">All materials</option>
          </Select>
        </label>
        <Select
          value={series?.id ?? ''}
          onChange={(e) => {
            const nextId = e.target.value;
            if (draftNew && nextId !== draftNew.id) {
              // Leaving unsaved draft discards it
              setDraftNew(null);
            }
            setSelectedId(nextId);
          }}
          style={{ minWidth: 320 }}
        >
          {draftNew ? (
            <option value={draftNew.id}>
              {draftNew.material} · {draftNew.kind} · {draftNew.name} (unsaved)
            </option>
          ) : null}
          {scopedSeries.map((s) => (
            <option key={s.id} value={s.id}>
              {s.material} · {s.kind} · {s.name}
            </option>
          ))}
        </Select>
        <Btn
          onClick={() => {
            const s = blankSeries();
            s.material = scopeMaterial === 'all' ? jobMaterial : scopeMaterial;
            setDraftNew(s);
            setSelectedId(s.id);
          }}
        >
          + New series
        </Btn>
        {isUnsavedNew ? (
          <>
            <Btn
              variant="primary"
              onClick={() => {
                if (!draftNew) return;
                const cleaned = ensureSeriesHardwareDefaults(draftNew);
                patch('series', [...state.series, cleaned]);
                setDraftNew(null);
                setSelectedId(cleaned.id);
              }}
            >
              Save series
            </Btn>
            <Btn
              variant="ghost"
              onClick={() => {
                setDraftNew(null);
                setSelectedId(state.series[0]?.id ?? '');
              }}
            >
              Discard
            </Btn>
          </>
        ) : null}
        {series && !isUnsavedNew ? (
          <Btn
            variant="danger"
            onClick={() => {
              if (state.series.length <= 1) return;
              const next = state.series.filter((s) => s.id !== series.id);
              patch('series', next);
              setSelectedId(next[0]?.id ?? '');
            }}
          >
            Delete series
          </Btn>
        ) : null}
      </Toolbar>
      {isUnsavedNew ? (
        <div className="banner-warn" role="status" style={{ marginBottom: '0.65rem' }}>
          New series is not saved yet — edit freely, then click <strong>Save series</strong>. Leaving
          this selection discards it.
        </div>
      ) : null}

      {!series ? (
        <Card title="No series">Add a series to begin.</Card>
      ) : (
        <>
          <Card title="Series header">
            <div className="grid grid-4">
              <Field label="Name">
                <Input value={series.name} onChange={(e) => set('name', e.target.value)} />
              </Field>
              <Field
                label="Brand / alloy"
                hint="Printed on quote Window lines (e.g. Jindal, Fenesta)"
              >
                <Input
                  value={series.brand ?? ''}
                  onChange={(e) => set('brand', e.target.value)}
                  placeholder="e.g. Jindal"
                />
              </Field>
              <Field label="Material">
                <Select
                  value={series.material}
                  onChange={(e) => set('material', e.target.value as Material)}
                >
                  <option>UPVC</option>
                  <option>Aluminium</option>
                </Select>
              </Field>
              <Field label="Kind" hint="Controls which hardware fields appear">
                <Select
                  value={series.kind}
                  onChange={(e) => set('kind', e.target.value as SeriesKind)}
                >
                  <option value="sliding">sliding</option>
                  <option value="casement">casement</option>
                  <option value="door">door</option>
                  <option value="other">other</option>
                </Select>
              </Field>
              <Field label="Note">
                <Input value={series.note} onChange={(e) => set('note', e.target.value)} />
              </Field>
            </div>
            {nameWarn ? (
              <div className="banner-warn" role="status">
                {nameWarn}
              </div>
            ) : null}
            <p className="muted tiny" style={{ marginTop: '0.65rem' }}>
              Active hardware group: <strong>{kind}</strong>
              {showSlidingHw
                ? ' — tracks, shutters, rollers, sliding lock/handle'
                : showDoorSwingHw
                  ? ' — openable + swing door hardware (no rollers)'
                  : ' — friction stay, hinges, connectors, seals (no rollers)'}
            </p>
          </Card>

          <Card title={showSlidingHw ? 'Sliding layout defaults' : 'Openable / door layout defaults'}>
            <div className="grid grid-4">
              {showSlidingHw ? (
                <>
                  <Field label="Default tracks">
                    <Input
                      type="number"
                      value={series.defaultTracks}
                      onChange={(e) => set('defaultTracks', Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Default glass shutters">
                    <Input
                      type="number"
                      value={series.defaultShutters}
                      onChange={(e) => set('defaultShutters', Number(e.target.value))}
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Default panels">
                    <Input
                      type="number"
                      value={series.defaultPanels}
                      onChange={(e) => set('defaultPanels', Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Default openable">
                    <Input
                      type="number"
                      value={series.defaultOpenable}
                      onChange={(e) => set('defaultOpenable', Number(e.target.value))}
                    />
                  </Field>
                </>
              )}
              <Field label="Glass inset mm">
                <Input
                  type="number"
                  value={series.glassInsetMm}
                  onChange={(e) => set('glassInsetMm', Number(e.target.value))}
                />
              </Field>
              <Field label="Mesh area share (0–1)">
                <Input
                  type="number"
                  step="0.05"
                  value={series.meshAreaShare}
                  onChange={(e) => set('meshAreaShare', Number(e.target.value))}
                />
              </Field>
              <Field label="Mesh net ₹/sqft">
                <Input
                  type="number"
                  value={series.meshNetPerSqft}
                  onChange={(e) => set('meshNetPerSqft', Number(e.target.value))}
                />
              </Field>
              <Field label="Other hardware ₹ / window">
                <Input
                  type="number"
                  value={series.otherHardware}
                  onChange={(e) => set('otherHardware', Number(e.target.value))}
                />
              </Field>
            </div>
          </Card>

          {showSlidingHw ? (
            <Card title="Sliding hardware (rollers / locks)">
              <div className="grid grid-4">
                <Field label="Rollers / shutter">
                  <Input
                    type="number"
                    value={series.rollersPerShutter}
                    onChange={(e) => set('rollersPerShutter', Number(e.target.value))}
                  />
                </Field>
                <Field label="Roller ₹">
                  <Input
                    type="number"
                    value={series.rollerRate}
                    onChange={(e) => set('rollerRate', Number(e.target.value))}
                  />
                </Field>
                <Field label="Lock / handle set ₹">
                  <Input
                    type="number"
                    value={series.lockHandleSet}
                    onChange={(e) => set('lockHandleSet', Number(e.target.value))}
                  />
                </Field>
                <Field label="Sliding handle ₹ (optional)">
                  <Input
                    type="number"
                    value={series.handleRate}
                    onChange={(e) => set('handleRate', Number(e.target.value))}
                  />
                </Field>
                <Field label="Lock / handle type (quote)" hint="Shown on Export Quote PDF">
                  <Input
                    value={series.lockHandleLabel ?? ''}
                    onChange={(e) => set('lockHandleLabel', e.target.value)}
                  />
                </Field>
              </div>
              <p className="muted tiny" style={{ marginTop: '0.65rem' }}>
                Casement friction stays, hinges, and door connectors stay hidden for sliding series.
              </p>
            </Card>
          ) : null}

          {showCasementHw ? (
            <Card title="Casement / openable hardware">
              <div className="grid grid-4">
                <Field
                  label="Friction stay size"
                  hint="1 set = 2 pc per openable; pick size → rate"
                >
                  <Select
                    value={series.frictionStaySizeMm}
                    onChange={(e) => set('frictionStaySizeMm', Number(e.target.value))}
                  >
                    {series.frictionStayRates.map((r) => (
                      <option key={r.sizeMm} value={r.sizeMm}>
                        {r.label ?? frictionStayLabel(r.sizeMm)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Friction stay ₹ / set" hint="From size catalogue" tone="link">
                  <Input tone="link" readOnly value={series.frictionStayRate} />
                </Field>
                <Field label="Sets per openable" hint="Default 1 set (2 pc)">
                  <Input
                    type="number"
                    value={series.frictionStaySetsPerOpenable}
                    onChange={(e) => set('frictionStaySetsPerOpenable', Number(e.target.value))}
                  />
                </Field>
                <Field label="Casement handle ₹">
                  <Input
                    type="number"
                    value={series.handleRate}
                    onChange={(e) => set('handleRate', Number(e.target.value))}
                  />
                </Field>
                <Field label="Hinges / openable" hint="Qty by weight need">
                  <Input
                    type="number"
                    value={series.hingeQtyPerOpenable}
                    onChange={(e) => set('hingeQtyPerOpenable', Number(e.target.value))}
                  />
                </Field>
                <Field label="Hinge ₹ / pc">
                  <Input
                    type="number"
                    value={series.hingeRate}
                    onChange={(e) => set('hingeRate', Number(e.target.value))}
                  />
                </Field>
                <Field label="Door connector qty / door" hint="Default 4 pc">
                  <Input
                    type="number"
                    value={series.doorConnectorQtyPerDoor}
                    onChange={(e) => set('doorConnectorQtyPerDoor', Number(e.target.value))}
                  />
                </Field>
                <Field label="Door connector ₹ / pc">
                  <Input
                    type="number"
                    value={series.doorConnectorRate}
                    onChange={(e) => set('doorConnectorRate', Number(e.target.value))}
                  />
                </Field>
                <Field label="Lamination arm size">
                  <Select
                    value={series.laminationArmSizeMm}
                    onChange={(e) => set('laminationArmSizeMm', Number(e.target.value))}
                  >
                    {series.laminationArmRates.map((r) => (
                      <option key={r.sizeMm} value={r.sizeMm}>
                        {r.label ?? `${r.sizeMm} mm`}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Lamination arm ₹" hint="From size catalogue" tone="link">
                  <Input
                    tone="link"
                    readOnly
                    value={rateForSize(series.laminationArmRates, series.laminationArmSizeMm, 0)}
                  />
                </Field>
                <Field label="Lock guide ₹">
                  <Input
                    type="number"
                    value={series.lockGuideRate}
                    onChange={(e) => set('lockGuideRate', Number(e.target.value))}
                  />
                </Field>
                <Field label="Brush ₹">
                  <Input
                    type="number"
                    value={series.brushRate}
                    onChange={(e) => set('brushRate', Number(e.target.value))}
                  />
                </Field>
                <Field label="EPDM ₹">
                  <Input
                    type="number"
                    value={series.epdmRate}
                    onChange={(e) => set('epdmRate', Number(e.target.value))}
                  />
                </Field>
                <Field label="Lock ₹">
                  <Input
                    type="number"
                    value={series.lockRate}
                    onChange={(e) => set('lockRate', Number(e.target.value))}
                  />
                </Field>
                <Field label="Lock / handle type (quote)" hint="Shown on Export Quote PDF">
                  <Input
                    value={series.lockHandleLabel ?? ''}
                    onChange={(e) => set('lockHandleLabel', e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid grid-4" style={{ marginTop: '0.75rem' }}>
                <Field
                  label="Door extra (quote)"
                  hint="Door closer OR floor spring — never both"
                >
                  <Select
                    value={series.doorExtraKind ?? 'none'}
                    onChange={(e) => {
                      const kind = e.target.value as 'none' | 'door-closer' | 'floor-spring';
                      if (kind === 'door-closer') {
                        setMany({
                          doorExtraKind: 'door-closer',
                          floorSpringRate: 0,
                          doorCloserRate: series.doorCloserRate || 1100,
                        });
                      } else if (kind === 'floor-spring') {
                        setMany({
                          doorExtraKind: 'floor-spring',
                          doorCloserRate: 0,
                          floorSpringRate: series.floorSpringRate || 2800,
                        });
                      } else {
                        setMany({
                          doorExtraKind: 'none',
                          doorCloserRate: 0,
                          floorSpringRate: 0,
                        });
                      }
                    }}
                  >
                    <option value="none">None</option>
                    <option value="door-closer">Door closer</option>
                    <option value="floor-spring">Floor spring</option>
                  </Select>
                </Field>
                {(series.doorExtraKind ?? 'none') === 'door-closer' ? (
                  <>
                    <Field label="Door closer ₹">
                      <Input
                        type="number"
                        value={series.doorCloserRate}
                        onChange={(e) => set('doorCloserRate', Number(e.target.value))}
                      />
                    </Field>
                    <Field label="Door closer brand">
                      <Input
                        value={series.doorCloserBrand ?? ''}
                        onChange={(e) => set('doorCloserBrand', e.target.value)}
                      />
                    </Field>
                    <Field label="Door closer colour">
                      <Input
                        value={series.doorCloserColour ?? ''}
                        onChange={(e) => set('doorCloserColour', e.target.value)}
                      />
                    </Field>
                    <Field label="Door closer weight kg">
                      <Input
                        type="number"
                        value={series.doorCloserWeightKg ?? 0}
                        onChange={(e) => set('doorCloserWeightKg', Number(e.target.value))}
                      />
                    </Field>
                  </>
                ) : null}
                {(series.doorExtraKind ?? 'none') === 'floor-spring' ? (
                  <>
                    <Field label="Floor spring ₹">
                      <Input
                        type="number"
                        value={series.floorSpringRate}
                        onChange={(e) => set('floorSpringRate', Number(e.target.value))}
                      />
                    </Field>
                    <Field label="Floor spring brand">
                      <Input
                        value={series.floorSpringBrand ?? ''}
                        onChange={(e) => set('floorSpringBrand', e.target.value)}
                      />
                    </Field>
                    <Field label="Floor spring colour">
                      <Input
                        value={series.floorSpringColour ?? ''}
                        onChange={(e) => set('floorSpringColour', e.target.value)}
                      />
                    </Field>
                    <Field label="Floor spring weight kg">
                      <Input
                        type="number"
                        value={series.floorSpringWeightKg ?? 0}
                        onChange={(e) => set('floorSpringWeightKg', Number(e.target.value))}
                      />
                    </Field>
                  </>
                ) : null}
              </div>
              <SizedRateEditor
                title="Friction stay catalogue (₹ per set = 2 pc) — sizes in mm"
                rows={series.frictionStayRates}
                onChange={(next) => set('frictionStayRates', next)}
              />
              <SizedRateEditor
                title="Lamination arm catalogue (150 / 200 / 250 / 305 mm)"
                rows={series.laminationArmRates}
                onChange={(next) => set('laminationArmRates', next)}
              />
              <p className="muted tiny" style={{ marginTop: '0.65rem' }}>
                Sliding rollers and track defaults stay hidden for casement/door series. Quote PDF
                shows door closer or floor spring exclusively.
              </p>
            </Card>
          ) : null}

          {showDoorSwingHw ? (
            <Card title="Swing door hardware (not sliding rollers)">
              <div className="grid grid-4">
                <Field label="Floor spring ₹" hint="Use Door extra above for exclusive quote line">
                  <Input
                    type="number"
                    value={series.floorSpringRate}
                    onChange={(e) =>
                      setMany({
                        floorSpringRate: Number(e.target.value),
                        doorExtraKind: Number(e.target.value) > 0 ? 'floor-spring' : series.doorExtraKind,
                        doorCloserRate: Number(e.target.value) > 0 ? 0 : series.doorCloserRate,
                      })
                    }
                  />
                </Field>
                <Field label="Door set ₹">
                  <Input
                    type="number"
                    value={series.doorSetRate}
                    onChange={(e) => set('doorSetRate', Number(e.target.value))}
                  />
                </Field>
                <Field label="Swing handle ₹">
                  <Input
                    type="number"
                    value={series.swingHandleRate}
                    onChange={(e) => set('swingHandleRate', Number(e.target.value))}
                  />
                </Field>
                <Field label="Swing lock ₹">
                  <Input
                    type="number"
                    value={series.swingLockRate}
                    onChange={(e) => set('swingLockRate', Number(e.target.value))}
                  />
                </Field>
              </div>
            </Card>
          ) : null}

          <Card
            title="Profile members (role × side factors × section SKU × ₹/m)"
            actions={
              <Btn
                onClick={() =>
                  update({
                    ...series,
                    members: [
                      ...series.members,
                      {
                        id: uid(),
                        name: 'New member',
                        memberClass: showSlidingHw ? 'Shutter' : classes[0],
                        shutterPart: showSlidingHw ? 'sash' : undefined,
                        wFactor: 2,
                        hFactor: 2,
                        topFactor: 1,
                        bottomFactor: 1,
                        leftFactor: 1,
                        rightFactor: 1,
                        ratePerM: 200,
                      },
                    ],
                  })
                }
              >
                + Member
              </Btn>
            }
          >
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Type</th>
                  <th>Top</th>
                  <th>Bottom</th>
                  <th>Left</th>
                  <th>Right</th>
                  <th>V↔</th>
                  <th>H↕</th>
                  <th>H SKU</th>
                  <th>V SKU</th>
                  <th>₹/m</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visibleMembers.map((m) => {
                  const role = roleFromClass(m.memberClass);
                  const shutterPart = shutterPartFromMember(m);
                  const otherClasses =
                    series.material === 'UPVC'
                      ? ['UPVC only', 'UPVC shutter', 'Window', 'Meeting', m.memberClass]
                      : ['Window', 'Meeting', m.memberClass].filter(
                          (c) => !isUpvcOnlyMemberClass(c),
                        );
                  return (
                    <tr key={m.id}>
                      <td>
                        <input
                          value={m.name}
                          onChange={(e) => updateMember(m.id, { name: e.target.value })}
                        />
                      </td>
                      <td>
                        {showSlidingHw ? (
                          <select
                            value={role}
                            onChange={(e) => applyMemberRole(m.id, e.target.value as MemberRole)}
                          >
                            {SLIDING_ROLES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={m.memberClass}
                            onChange={(e) =>
                              updateMember(m.id, {
                                memberClass: e.target.value,
                                shutterPart: undefined,
                              })
                            }
                          >
                            {[...new Set([...classes, m.memberClass])].map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>
                        {showSlidingHw && role === 'track' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <select
                              value={TRACK_TYPES.includes(m.memberClass as (typeof TRACK_TYPES)[number])
                                ? m.memberClass
                                : '2-track'}
                              onChange={(e) =>
                                updateMember(m.id, {
                                  memberClass: e.target.value,
                                  shutterPart: undefined,
                                  railCount:
                                    e.target.value === '2-track'
                                      ? 2
                                      : e.target.value === '2.5-track' || e.target.value === '3-track'
                                        ? 3
                                        : m.railCount,
                                })
                              }
                            >
                              {TRACK_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                            <label className="tiny muted">
                              Rails{' '}
                              <NumberInput
                                step="1"
                                inputMode="numeric"
                                value={m.railCount ?? (m.memberClass === '2-track' ? 2 : 3)}
                                onCommit={(n) => {
                                  if (n == null) return;
                                  updateMember(m.id, { railCount: n });
                                }}
                              />
                            </label>
                          </div>
                        ) : showSlidingHw && role === 'shutter' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <select
                              value={shutterPart}
                              onChange={(e) => {
                                const part = e.target.value as ShutterPart;
                                const mapped = SHUTTER_PARTS.find((p) => p.value === part);
                                updateMember(m.id, {
                                  shutterPart: part,
                                  memberClass: mapped?.memberClass ?? 'Shutter',
                                  interlockStyle:
                                    part === 'interlock'
                                      ? m.interlockStyle ?? 'slim'
                                      : m.interlockStyle,
                                });
                              }}
                            >
                              {SHUTTER_PARTS.map((p) => (
                                <option key={p.value} value={p.value}>
                                  {p.label}
                                </option>
                              ))}
                            </select>
                            {shutterPart === 'interlock' ? (
                              <select
                                value={m.interlockStyle ?? 'slim'}
                                onChange={(e) =>
                                  updateMember(m.id, {
                                    interlockStyle: e.target.value as InterlockStyle,
                                  })
                                }
                              >
                                <option value="slim">Slim interlock</option>
                                <option value="cap">Cap on verticals</option>
                                <option value="same-section">Same section all sides</option>
                              </select>
                            ) : null}
                          </div>
                        ) : showSlidingHw && role === 'mesh' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <select
                              value="Mesh"
                              onChange={() => updateMember(m.id, { memberClass: 'Mesh' })}
                            >
                              <option value="Mesh">Mesh</option>
                            </select>
                            <label className="tiny muted">
                              <input
                                type="checkbox"
                                checked={Boolean(m.meshAdapter)}
                                onChange={(e) =>
                                  updateMember(m.id, { meshAdapter: e.target.checked })
                                }
                              />{' '}
                              + adapter 2V+2H
                            </label>
                          </div>
                        ) : showSlidingHw && role === 'other' ? (
                          <select
                            value={m.memberClass}
                            onChange={(e) =>
                              updateMember(m.id, { memberClass: e.target.value })
                            }
                          >
                            {otherClasses
                              .filter((v, i, a) => a.indexOf(v) === i)
                              .map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <span className="muted tiny">{m.memberClass}</span>
                        )}
                      </td>
                      <td>
                        <NumberInput
                          step="0.05"
                          inputMode="decimal"
                          emptyAs="null"
                          value={m.topFactor ?? null}
                          onCommit={(n) => updateMember(m.id, { topFactor: n })}
                        />
                      </td>
                      <td>
                        <NumberInput
                          step="0.05"
                          inputMode="decimal"
                          emptyAs="null"
                          value={m.bottomFactor ?? null}
                          onCommit={(n) => updateMember(m.id, { bottomFactor: n })}
                        />
                      </td>
                      <td>
                        <NumberInput
                          step="0.05"
                          inputMode="decimal"
                          emptyAs="null"
                          value={m.leftFactor ?? null}
                          onCommit={(n) => updateMember(m.id, { leftFactor: n })}
                        />
                      </td>
                      <td>
                        <NumberInput
                          step="0.05"
                          inputMode="decimal"
                          emptyAs="null"
                          value={m.rightFactor ?? null}
                          onCommit={(n) => updateMember(m.id, { rightFactor: n })}
                        />
                      </td>
                      <td>
                        <NumberInput
                          step="0.05"
                          inputMode="decimal"
                          value={m.wFactor}
                          onCommit={(n) => {
                            if (n == null) return;
                            updateMember(m.id, { wFactor: n });
                          }}
                        />
                      </td>
                      <td>
                        <NumberInput
                          step="0.05"
                          inputMode="decimal"
                          value={m.hFactor}
                          onCommit={(n) => {
                            if (n == null) return;
                            updateMember(m.id, { hFactor: n });
                          }}
                        />
                      </td>
                      <td>
                        <select
                          value={m.horizontalProfileSkuId || m.profileSkuId || ''}
                          onChange={(e) =>
                            updateMember(m.id, {
                              horizontalProfileSkuId: e.target.value || undefined,
                              profileSkuId: e.target.value || m.profileSkuId,
                            })
                          }
                        >
                          <option value="">—</option>
                          {matProfiles.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={m.verticalProfileSkuId || m.profileSkuId || ''}
                          onChange={(e) =>
                            updateMember(m.id, {
                              verticalProfileSkuId: e.target.value || undefined,
                              profileSkuId: e.target.value || m.profileSkuId,
                            })
                          }
                        >
                          <option value="">—</option>
                          {matProfiles.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <NumberInput
                          inputMode="decimal"
                          value={m.ratePerM}
                          onCommit={(n) => {
                            if (n == null) return;
                            updateMember(m.id, { ratePerM: n });
                          }}
                        />
                      </td>
                      <td>
                        <Btn
                          variant="ghost"
                          onClick={() =>
                            update({
                              ...series,
                              members: series.members.filter((x) => x.id !== m.id),
                            })
                          }
                        >
                          ✕
                        </Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="muted tiny" style={{ marginTop: '0.75rem' }}>
              Side factors (Top / Bottom / Left / Right) drive fabricator BOM detail; coarse V↔ / H↕
              remain the quote fallback when sides are empty. H SKU = top+bottom section, V SKU =
              left+right — both filtered to this series material. Track rails (bottom only) come from
              Rails qty (2-track→2, 3-track→3). UPVC-only classes never appear on Aluminium series.
              Rates stay Settings-driven — formulas in code.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
