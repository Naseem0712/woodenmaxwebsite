import { useMemo, useState } from 'react';
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
import type { Material, ProfileMember, SeriesDefinition, SeriesKind, SizedRate } from '../../types';
import { useApp } from '../../store/AppContext';

const SLIDING_CLASSES = ['2-track', '3-track', 'Shutter', 'Meeting', 'Mesh', 'UPVC only', 'UPVC shutter', 'Window'];
const CASEMENT_CLASSES = [
  'Window',
  'Mullion',
  'Openable panel',
  'Panel',
  'Mesh panel',
  'UPVC only',
  'UPVC mullion',
  'UPVC openable',
];
const DOOR_CLASSES = [...CASEMENT_CLASSES, 'Door leaf'];

function blankSeries(): SeriesDefinition {
  const frictionStayRates = defaultFrictionStayRates();
  return ensureSeriesHardwareDefaults({
    id: uid(),
    name: 'New series',
    material: 'UPVC',
    kind: 'sliding',
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
    members: [{ id: uid(), name: 'Outer frame', memberClass: '2-track', wFactor: 2, hFactor: 2, ratePerM: 260 }],
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
  const { state, patch } = useApp();
  const [selectedId, setSelectedId] = useState(state.series[0]?.id ?? '');
  const seriesRaw = useMemo(
    () => state.series.find((s) => s.id === selectedId) ?? state.series[0],
    [state.series, selectedId],
  );
  const series = seriesRaw ? ensureSeriesHardwareDefaults(seriesRaw) : undefined;

  const update = (next: SeriesDefinition) => {
    patch(
      'series',
      state.series.map((s) => (s.id === next.id ? ensureSeriesHardwareDefaults(next) : s)),
    );
    setSelectedId(next.id);
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
    update({
      ...series,
      members: series.members.map((m) => (m.id === id ? { ...m, ...patchMember } : m)),
    });
  };

  const kind = series?.kind ?? 'sliding';
  const classes =
    kind === 'casement' ? CASEMENT_CLASSES : kind === 'door' ? DOOR_CLASSES : SLIDING_CLASSES;
  const showSlidingHw = kind === 'sliding';
  const showCasementHw = kind === 'casement' || kind === 'door' || kind === 'other';
  const showDoorSwingHw = kind === 'door';
  const nameWarn = series ? seriesNameKindMismatch(series.name, series.kind) : null;

  return (
    <div>
      <PageHeader
        title="Series & members"
        subtitle="Masters are material × kind. Series header shows only hardware for that Kind — sliding never mixes with casement/door."
      />
      <Toolbar>
        <Select
          value={series?.id ?? ''}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{ minWidth: 320 }}
        >
          {state.series.map((s) => (
            <option key={s.id} value={s.id}>
              {s.material} · {s.kind} · {s.name}
            </option>
          ))}
        </Select>
        <Btn
          onClick={() => {
            const s = blankSeries();
            patch('series', [...state.series, s]);
            setSelectedId(s.id);
          }}
        >
          + New series
        </Btn>
        {series ? (
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

      {!series ? (
        <Card title="No series">Add a series to begin.</Card>
      ) : (
        <>
          <Card title="Series header">
            <div className="grid grid-4">
              <Field label="Name">
                <Input value={series.name} onChange={(e) => set('name', e.target.value)} />
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
            title="Profile members (qty rules × ₹/m)"
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
                        memberClass: classes[0],
                        wFactor: 2,
                        hFactor: 2,
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
                  <th>Class</th>
                  <th>W factor</th>
                  <th>H factor</th>
                  <th>₹/m</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {series.members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <input
                        value={m.name}
                        onChange={(e) => updateMember(m.id, { name: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        value={m.memberClass}
                        onChange={(e) => updateMember(m.id, { memberClass: e.target.value })}
                      >
                        {[...new Set([...classes, m.memberClass])].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <NumberInput
                        step="0.05"
                        value={m.wFactor}
                        onChange={(e) => updateMember(m.id, { wFactor: Number(e.target.value) })}
                      />
                    </td>
                    <td>
                      <NumberInput
                        step="0.05"
                        value={m.hFactor}
                        onChange={(e) => updateMember(m.id, { hFactor: Number(e.target.value) })}
                      />
                    </td>
                    <td>
                      <NumberInput
                        value={m.ratePerM}
                        onChange={(e) => updateMember(m.id, { ratePerM: Number(e.target.value) })}
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
                ))}
              </tbody>
            </table>
            <p className="muted tiny" style={{ marginTop: '0.75rem' }}>
              Metres ≈ (W_factor × W + H_factor × H) / 1000 × qty_rule(class, tracks, shutters…). Edit rates here;
              Tool 02/03 recalculate when you pick this series.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
