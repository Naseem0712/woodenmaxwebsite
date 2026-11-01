import { v4 as uid } from 'uuid';
import { Btn, Card, PageHeader, NumberInput } from '../../components/ui';
import { useApp } from '../../store/AppContext';

export function SettingsGlassTypesPage() {
  const { state, patch } = useApp();

  return (
    <div>
      <PageHeader
        title="Glass types"
        subtitle="Thickness and ₹/sqft used by Sliding, Casement, Glass panes, and Doors."
      />
      <Card
        title="Glass master"
        actions={
          <Btn
            onClick={() =>
              patch('glassTypes', [
                ...state.glassTypes,
                {
                  id: uid(),
                  name: 'New glass',
                  thicknessMm: 5,
                  ratePerSqft: 55,
                  useNote: '',
                },
              ])
            }
          >
            + Add glass
          </Btn>
        }
      >
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Thickness mm</th>
              <th>₹/sqft</th>
              <th>Use note</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.glassTypes.map((g) => (
              <tr key={g.id}>
                <td>
                  <input
                    value={g.name}
                    onChange={(e) =>
                      patch(
                        'glassTypes',
                        state.glassTypes.map((x) =>
                          x.id === g.id ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    step="0.01"
                    value={g.thicknessMm}
                    onChange={(e) =>
                      patch(
                        'glassTypes',
                        state.glassTypes.map((x) =>
                          x.id === g.id ? { ...x, thicknessMm: Number(e.target.value) } : x,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={g.ratePerSqft}
                    onChange={(e) =>
                      patch(
                        'glassTypes',
                        state.glassTypes.map((x) =>
                          x.id === g.id ? { ...x, ratePerSqft: Number(e.target.value) } : x,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    value={g.useNote}
                    onChange={(e) =>
                      patch(
                        'glassTypes',
                        state.glassTypes.map((x) =>
                          x.id === g.id ? { ...x, useNote: e.target.value } : x,
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
                        'glassTypes',
                        state.glassTypes.filter((x) => x.id !== g.id),
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
