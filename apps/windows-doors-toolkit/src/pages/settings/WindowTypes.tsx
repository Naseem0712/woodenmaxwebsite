import { v4 as uid } from 'uuid';
import { Btn, Card, PageHeader, NumberInput } from '../../components/ui';
import type { Material } from '../../types';
import { useApp } from '../../store/AppContext';

export function SettingsWindowTypesPage() {
  const { state, patch } = useApp();

  return (
    <div>
      <PageHeader
        title="Window types ₹/sqft"
        subtitle="Rate card used by 01 Openings, 08 Quotation, 09 Compare, and 13 Builder."
      />
      <Card
        title="Types"
        actions={
          <Btn
            onClick={() =>
              patch('windowTypes', [
                ...state.windowTypes,
                {
                  id: uid(),
                  name: 'New window type',
                  material: 'UPVC',
                  ratePerSqft: 600,
                  note: '',
                  seriesId: state.series[0]?.id,
                },
              ])
            }
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
              <th>₹/sqft</th>
              <th>Linked series</th>
              <th>Note</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.windowTypes.map((t) => (
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
                    onChange={(e) =>
                      patch(
                        'windowTypes',
                        state.windowTypes.map((x) =>
                          x.id === t.id ? { ...x, material: e.target.value as Material } : x,
                        ),
                      )
                    }
                  >
                    <option>UPVC</option>
                    <option>Aluminium</option>
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
                    {state.series.map((s) => (
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
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
