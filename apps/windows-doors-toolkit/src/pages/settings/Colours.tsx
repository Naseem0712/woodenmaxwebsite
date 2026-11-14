import { v4 as uid } from 'uuid';
import { Btn, Card, PageHeader, NumberInput } from '../../components/ui';
import { useApp } from '../../store/AppContext';
import type { ColourOption, Material } from '../../types';

export function SettingsColoursPage() {
  const { state, patch } = useApp();

  const update = (id: string, patchRow: Partial<ColourOption>) => {
    patch(
      'colourOptions',
      state.colourOptions.map((c) => (c.id === id ? { ...c, ...patchRow } : c)),
    );
  };

  return (
    <div>
      <PageHeader
        title="Colour / finish options"
        subtitle="Available colours for the quote configurator. Rate adj ₹/sqft is Settings-driven (sample seeds only)."
      />
      <Card
        title="Colour master"
        actions={
          <Btn
            onClick={() =>
              patch('colourOptions', [
                ...state.colourOptions,
                {
                  id: uid(),
                  name: 'New colour',
                  material: 'Both',
                  rateAdjPerSqft: 0,
                  note: '',
                },
              ])
            }
          >
            + Add colour
          </Btn>
        }
      >
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Material</th>
              <th>₹/sqft adj</th>
              <th>Note</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.colourOptions.map((c) => (
              <tr key={c.id}>
                <td>
                  <input value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} />
                </td>
                <td>
                  <select
                    value={c.material}
                    onChange={(e) =>
                      update(c.id, { material: e.target.value as Material | 'Both' })
                    }
                  >
                    <option value="Both">Both</option>
                    <option value="UPVC">UPVC</option>
                    <option value="Aluminium">Aluminium</option>
                  </select>
                </td>
                <td>
                  <NumberInput
                    value={c.rateAdjPerSqft}
                    onCommit={(n) => update(c.id, { rateAdjPerSqft: n ?? 0 })}
                  />
                </td>
                <td>
                  <input value={c.note} onChange={(e) => update(c.id, { note: e.target.value })} />
                </td>
                <td>
                  <Btn
                    variant="ghost"
                    onClick={() =>
                      patch(
                        'colourOptions',
                        state.colourOptions.filter((x) => x.id !== c.id),
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
