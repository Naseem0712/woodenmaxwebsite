import { v4 as uid } from 'uuid';
import { Btn, Card, PageHeader, NumberInput } from '../../components/ui';
import type { Material, SeriesKind } from '../../types';
import { useApp } from '../../store/AppContext';

export function SettingsProfilesPage() {
  const { state, patch } = useApp();

  return (
    <div>
      <PageHeader
        title="Profiles stock"
        subtitle="Stock length and UPVC ₹/m or Aluminium kg/m. Tagged by material × kind — Cutting only lists the active project material."
      />
      <Card
        title="Profile SKUs"
        actions={
          <Btn
            onClick={() =>
              patch('profiles', [
                ...state.profiles,
                {
                  id: uid(),
                  name: 'New profile',
                  material: 'UPVC' as Material,
                  kind: 'sliding' as SeriesKind,
                  stockLengthM: 5.8,
                  ratePerMUpvc: 200,
                  kgPerMAluminium: 0,
                },
              ])
            }
          >
            + Add profile
          </Btn>
        }
      >
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Material</th>
              <th>Kind</th>
              <th>Stock length m</th>
              <th>UPVC ₹/m</th>
              <th>Al kg/m</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.profiles.map((p) => (
              <tr key={p.id}>
                <td>
                  <input
                    value={p.name}
                    onChange={(e) =>
                      patch(
                        'profiles',
                        state.profiles.map((x) =>
                          x.id === p.id ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <select
                    value={p.material}
                    onChange={(e) =>
                      patch(
                        'profiles',
                        state.profiles.map((x) =>
                          x.id === p.id
                            ? { ...x, material: e.target.value as Material }
                            : x,
                        ),
                      )
                    }
                  >
                    <option>UPVC</option>
                    <option>Aluminium</option>
                  </select>
                </td>
                <td>
                  <select
                    value={p.kind}
                    onChange={(e) =>
                      patch(
                        'profiles',
                        state.profiles.map((x) =>
                          x.id === p.id ? { ...x, kind: e.target.value as SeriesKind } : x,
                        ),
                      )
                    }
                  >
                    <option value="sliding">sliding</option>
                    <option value="casement">casement</option>
                    <option value="door">door</option>
                    <option value="other">other</option>
                  </select>
                </td>
                <td>
                  <NumberInput
                    step="0.1"
                    value={p.stockLengthM}
                    onChange={(e) =>
                      patch(
                        'profiles',
                        state.profiles.map((x) =>
                          x.id === p.id ? { ...x, stockLengthM: Number(e.target.value) } : x,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={p.ratePerMUpvc}
                    onChange={(e) =>
                      patch(
                        'profiles',
                        state.profiles.map((x) =>
                          x.id === p.id ? { ...x, ratePerMUpvc: Number(e.target.value) } : x,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    step="0.01"
                    value={p.kgPerMAluminium}
                    onChange={(e) =>
                      patch(
                        'profiles',
                        state.profiles.map((x) =>
                          x.id === p.id
                            ? { ...x, kgPerMAluminium: Number(e.target.value) }
                            : x,
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
                        'profiles',
                        state.profiles.filter((x) => x.id !== p.id),
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
        <p className="muted tiny" style={{ marginTop: '0.75rem' }}>
          For Aluminium SKUs set kg/m and leave UPVC ₹/m at 0. Effective ₹/m = kg/m × (Al ₹/kg + coating ₹/kg) from
          Allowances.
        </p>
      </Card>
    </div>
  );
}
