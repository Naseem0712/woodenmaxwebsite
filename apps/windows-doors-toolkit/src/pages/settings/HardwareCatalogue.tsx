import { useMemo, useState } from 'react';
import { v4 as uid } from 'uuid';
import { Btn, Card, PageHeader, NumberInput, Select, Field } from '../../components/ui';
import type { HardwareClass } from '../../types';
import { useApp } from '../../store/AppContext';

const CLASSES: HardwareClass[] = ['sliding', 'casement', 'door', 'shared'];

function inferHardwareClass(name: string, category: string): HardwareClass {
  const n = `${name} ${category}`.toLowerCase();
  if (/\b(roller|sliding|track|anti-lift)\b/.test(n)) return 'sliding';
  if (/\b(floor spring|door closer|door set|swing|door connector|door hinge)\b/.test(n)) return 'door';
  if (/\b(friction|casement|hinge|lamination|lock guide|tilt)\b/.test(n)) return 'casement';
  if (/\b(brush|epdm|gasket|silicone|packer|drain|end cap|fastener)\b/.test(n)) return 'shared';
  return 'shared';
}

export function SettingsHardwareCataloguePage() {
  const { state, patch } = useApp();
  const [filter, setFilter] = useState<HardwareClass | 'all'>('all');

  const rows = useMemo(() => {
    return state.hardware
      .map((h) => ({
        ...h,
        hardwareClass: h.hardwareClass ?? inferHardwareClass(h.name, h.category),
      }))
      .filter((h) => filter === 'all' || h.hardwareClass === filter);
  }, [state.hardware, filter]);

  return (
    <div>
      <PageHeader
        title="Hardware catalogue"
        subtitle="Editable price list by class — sliding · casement · door · shared. Tool 07 BOM uses these rates; never mix classes on a series."
      />
      <Card title="Filter">
        <Field label="Hardware class">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as HardwareClass | 'all')}
            style={{ maxWidth: 220 }}
          >
            <option value="all">All</option>
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </Card>
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
                  hardwareClass: filter === 'all' ? 'shared' : filter,
                  brand: '',
                  colour: '',
                  weightCapacityKg: 0,
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
              <th>Brand</th>
              <th>Colour</th>
              <th>Weight kg</th>
              <th>Category</th>
              <th>Class</th>
              <th>Unit</th>
              <th>Rate ₹</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
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
                    value={h.brand ?? ''}
                    placeholder="Brand"
                    onChange={(e) =>
                      patch(
                        'hardware',
                        state.hardware.map((x) =>
                          x.id === h.id ? { ...x, brand: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    value={h.colour ?? ''}
                    placeholder="Colour"
                    onChange={(e) =>
                      patch(
                        'hardware',
                        state.hardware.map((x) =>
                          x.id === h.id ? { ...x, colour: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={h.weightCapacityKg ?? 0}
                    onChange={(e) =>
                      patch(
                        'hardware',
                        state.hardware.map((x) =>
                          x.id === h.id ? { ...x, weightCapacityKg: Number(e.target.value) } : x,
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
                  <select
                    value={h.hardwareClass}
                    onChange={(e) =>
                      patch(
                        'hardware',
                        state.hardware.map((x) =>
                          x.id === h.id
                            ? { ...x, hardwareClass: e.target.value as HardwareClass }
                            : x,
                        ),
                      )
                    }
                  >
                    {CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
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
                  <NumberInput
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
