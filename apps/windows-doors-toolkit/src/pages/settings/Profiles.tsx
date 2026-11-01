import { v4 as uid } from 'uuid';
import { Btn, Card, PageHeader, NumberInput } from '../../components/ui';
import { useApp } from '../../store/AppContext';

export function SettingsProfilesPage() {
  const { state, patch } = useApp();

  return (
    <div>
      <PageHeader
        title="Profiles stock"
        subtitle="Stock length and UPVC ₹/m or Aluminium kg/m. Used by Tool 05 Cutting (Al rate from Allowances)."
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
