import { v4 as uid } from 'uuid';
import { Btn, Card, PageHeader, NumberInput } from '../../components/ui';
import { filterSeries } from '../../engine/materialContext';
import type { Material, SeriesKind } from '../../types';
import { useApp } from '../../store/AppContext';

export function SettingsWindowTypesPage() {
  const { state, patch } = useApp();

  return (
    <div>
      <PageHeader
        title="Window types ₹/sqft"
        subtitle="Rate card used by Openings, Quotation, Compare, Builder. Linked series must match material × kind."
      />
      <Card
        title="Types"
        actions={
          <Btn
            onClick={() => {
              const series = filterSeries(state.series, 'UPVC', 'sliding')[0] ?? state.series[0];
              patch('windowTypes', [
                ...state.windowTypes,
                {
                  id: uid(),
                  name: 'New window type',
                  material: 'UPVC',
                  kind: (series?.kind ?? 'sliding') as SeriesKind,
                  ratePerSqft: 600,
                  note: '',
                  seriesId: series?.id,
                },
              ]);
            }}
          >
            + Add type
          </Btn>
        }
      >
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Material</th>
              <th>Kind</th>
              <th>₹/sqft</th>
              <th>Linked series</th>
              <th>Note</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.windowTypes.map((t) => {
              const seriesOpts = filterSeries(state.series, t.material, [
                t.kind,
                ...(t.kind === 'door' ? (['sliding', 'casement'] as SeriesKind[]) : []),
              ]);
              return (
                <tr key={t.id}>
                  <td>
                    <input
                      value={t.name}
                      onChange={(e) =>
                        patch(
                          'windowTypes',
                          state.windowTypes.map((x) =>
                            x.id === t.id ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={t.material}
                      onChange={(e) => {
                        const material = e.target.value as Material;
                        const match = filterSeries(state.series, material, t.kind)[0];
                        patch(
                          'windowTypes',
                          state.windowTypes.map((x) =>
                            x.id === t.id
                              ? { ...x, material, seriesId: match?.id ?? undefined }
                              : x,
                          ),
                        );
                      }}
                    >
                      <option>UPVC</option>
                      <option>Aluminium</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={t.kind}
                      onChange={(e) => {
                        const kind = e.target.value as SeriesKind;
                        const match = filterSeries(state.series, t.material, kind)[0];
                        patch(
                          'windowTypes',
                          state.windowTypes.map((x) =>
                            x.id === t.id
                              ? { ...x, kind, seriesId: match?.id ?? undefined }
                              : x,
                          ),
                        );
                      }}
                    >
                      <option value="sliding">sliding</option>
                      <option value="casement">casement</option>
                      <option value="door">door</option>
                      <option value="other">other</option>
                    </select>
                  </td>
                  <td>
                    <NumberInput
                      value={t.ratePerSqft}
                      onChange={(e) =>
                        patch(
                          'windowTypes',
                          state.windowTypes.map((x) =>
                            x.id === t.id ? { ...x, ratePerSqft: Number(e.target.value) } : x,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={t.seriesId ?? ''}
                      onChange={(e) =>
                        patch(
                          'windowTypes',
                          state.windowTypes.map((x) =>
                            x.id === t.id
                              ? { ...x, seriesId: e.target.value || undefined }
                              : x,
                          ),
                        )
                      }
                    >
                      <option value="">—</option>
                      {seriesOpts.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      value={t.note}
                      onChange={(e) =>
                        patch(
                          'windowTypes',
                          state.windowTypes.map((x) =>
                            x.id === t.id ? { ...x, note: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <Btn
                      variant="ghost"
                      onClick={() =>
                        patch(
                          'windowTypes',
                          state.windowTypes.filter((x) => x.id !== t.id),
                        )
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
      </Card>
    </div>
  );
}
