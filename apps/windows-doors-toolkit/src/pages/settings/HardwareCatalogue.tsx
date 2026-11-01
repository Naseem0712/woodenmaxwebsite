import { v4 as uid } from 'uuid';
import { Btn, Card, PageHeader } from '../../components/ui';
import { useApp } from '../../store/AppContext';

export function SettingsHardwareCataloguePage() {
  const { state, patch } = useApp();

  return (
    <div>
      <PageHeader
        title="Hardware catalogue"
        subtitle="Price list for Tool 07 Hardware BOM matrix (item → category / unit / rate)."
      />
      <Card
        title="Items"
        actions={
          <Btn
            onClick={() =>
              patch('hardware', [
                ...state.hardware,
                {
                  id: uid(),
                  name: 'New hardware',
                  category: 'Accessories',
                  unit: 'pc',
                  rate: 100,
                },
              ])
            }
          >
            + Add item
          </Btn>
        }
      >
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Rate ₹</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.hardware.map((h) => (
              <tr key={h.id}>
                <td>
                  <input
                    value={h.name}
                    onChange={(e) =>
                      patch(
                        'hardware',
                        state.hardware.map((x) =>
                          x.id === h.id ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    value={h.category}
                    onChange={(e) =>
                      patch(
                        'hardware',
                        state.hardware.map((x) =>
                          x.id === h.id ? { ...x, category: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    value={h.unit}
                    onChange={(e) =>
                      patch(
                        'hardware',
                        state.hardware.map((x) =>
                          x.id === h.id ? { ...x, unit: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={h.rate}
                    onChange={(e) =>
                      patch(
                        'hardware',
                        state.hardware.map((x) =>
                          x.id === h.id ? { ...x, rate: Number(e.target.value) } : x,
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
                        'hardware',
                        state.hardware.filter((x) => x.id !== h.id),
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
