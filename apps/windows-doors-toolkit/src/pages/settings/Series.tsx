import { useMemo, useState } from 'react';
import { v4 as uid } from 'uuid';
import { Btn, Card, Field, Input, PageHeader, Select, Toolbar, NumberInput } from '../../components/ui';
import type { Material, ProfileMember, SeriesDefinition } from '../../types';
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

function blankSeries(): SeriesDefinition {
  return {
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
    otherHardware: 120,
    frictionStayRate: 320,
    handleRate: 250,
    meshAreaShare: 0.5,
    meshNetPerSqft: 40,
    note: '',
    members: [
      { id: uid(), name: 'Outer frame', memberClass: '2-track', wFactor: 2, hFactor: 2, ratePerM: 260 },
    ],
  };
}

export function SettingsSeriesPage() {
  const { state, patch } = useApp();
  const [selectedId, setSelectedId] = useState(state.series[0]?.id ?? '');
  const series = useMemo(
    () => state.series.find((s) => s.id === selectedId) ?? state.series[0],
    [state.series, selectedId],
  );

  const update = (next: SeriesDefinition) => {
    patch(
      'series',
      state.series.map((s) => (s.id === next.id ? next : s)),
    );
    setSelectedId(next.id);
  };

  const set = <K extends keyof SeriesDefinition>(key: K, value: SeriesDefinition[K]) => {
    if (!series) return;
    update({ ...series, [key]: value });
  };

  const updateMember = (id: string, patchMember: Partial<ProfileMember>) => {
    if (!series) return;
    update({
      ...series,
      members: series.members.map((m) => (m.id === id ? { ...m, ...patchMember } : m)),
    });
  };

  const classes = series?.kind === 'casement' ? CASEMENT_CLASSES : SLIDING_CLASSES;

  return (
    <div>
      <PageHeader
        title="Series & members"
        subtitle="Create / edit series. Member class + W/H factors drive metres from size on Tools 02 & 03."
      />
      <Toolbar>
        <Select
          value={series?.id ?? ''}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{ minWidth: 260 }}
        >
          {state.series.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
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
              <Field label="Kind">
                <Select
                  value={series.kind}
                  onChange={(e) =>
                    set('kind', e.target.value as SeriesDefinition['kind'])
                  }
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
              <Field label="Glass inset mm">
                <Input
                  type="number"
                  value={series.glassInsetMm}
                  onChange={(e) => set('glassInsetMm', Number(e.target.value))}
                />
              </Field>
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
              <Field label="Other hardware ₹">
                <Input
                  type="number"
                  value={series.otherHardware}
                  onChange={(e) => set('otherHardware', Number(e.target.value))}
                />
              </Field>
              <Field label="Friction stay ₹">
                <Input
                  type="number"
                  value={series.frictionStayRate}
                  onChange={(e) => set('frictionStayRate', Number(e.target.value))}
                />
              </Field>
              <Field label="Handle ₹">
                <Input
                  type="number"
                  value={series.handleRate}
                  onChange={(e) => set('handleRate', Number(e.target.value))}
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
            </div>
          </Card>

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
