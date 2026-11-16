import { useMemo, useState } from 'react';
import { v4 as uid } from 'uuid';
import { Btn, Card, PageHeader, NumberInput, Select, Toolbar } from '../../components/ui';
import {
  ALUMINIUM_DEFAULT_STOCK_LENGTH_FT,
  UPVC_DEFAULT_STOCK_LENGTH_M,
  defaultStockLengthM,
  stockLengthAfterMaterialChange,
} from '../../engine/profileStockDefaults';
import { filterProfiles, projectMaterial } from '../../engine/materialContext';
import type { Material, SeriesKind } from '../../types';
import { useApp } from '../../store/AppContext';

export function SettingsProfilesPage() {
  const { state, patch } = useApp();
  const jobMaterial = projectMaterial(state);
  /** Default: active project material only — never list the other system. */
  const [materialFilter, setMaterialFilter] = useState<Material | 'project'>('project');
  const effectiveMaterial: Material =
    materialFilter === 'project' ? jobMaterial : materialFilter;

  const visible = useMemo(
    () => filterProfiles(state.profiles, effectiveMaterial),
    [state.profiles, effectiveMaterial],
  );

  const addProfile = () => {
    patch('profiles', [
      ...state.profiles,
      {
        id: uid(),
        name: `New ${effectiveMaterial} profile`,
        material: effectiveMaterial,
        kind: 'sliding' as SeriesKind,
        stockLengthM: defaultStockLengthM(effectiveMaterial),
        ratePerMUpvc: effectiveMaterial === 'UPVC' ? 200 : 0,
        kgPerMAluminium: effectiveMaterial === 'Aluminium' ? 0.5 : 0,
      },
    ]);
  };

  return (
    <div>
      <PageHeader
        title="Profiles stock"
        subtitle={`Stock length and UPVC ₹/m or Aluminium kg/m. Defaults: UPVC ${UPVC_DEFAULT_STOCK_LENGTH_M} m · Aluminium ${ALUMINIUM_DEFAULT_STOCK_LENGTH_FT} ft (${defaultStockLengthM('Aluminium').toFixed(4)} m). Filtered to the active project material — Cutting / BOM never mix Alu ↔ UPVC.`}
      />
      <Card title="Filter">
        <Toolbar>
          <label className="tiny muted">
            Material{' '}
            <Select
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value as Material | 'project')}
            >
              <option value="project">Project ({jobMaterial})</option>
              <option value="UPVC">UPVC only</option>
              <option value="Aluminium">Aluminium only</option>
            </Select>
          </label>
          <span className="tiny muted">
            Showing {visible.length} / {state.profiles.length} SKUs · {effectiveMaterial}
          </span>
        </Toolbar>
      </Card>
      <Card
        title={`Profile SKUs · ${effectiveMaterial}`}
        actions={<Btn onClick={addProfile}>+ Add profile</Btn>}
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
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">
                  No {effectiveMaterial} profiles yet — add one for this material.
                </td>
              </tr>
            ) : (
              visible.map((p) => (
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
                      onChange={(e) => {
                        const nextMaterial = e.target.value as Material;
                        patch(
                          'profiles',
                          state.profiles.map((x) =>
                            x.id === p.id
                              ? {
                                  ...x,
                                  material: nextMaterial,
                                  stockLengthM: stockLengthAfterMaterialChange(
                                    x.material,
                                    nextMaterial,
                                    x.stockLengthM,
                                  ),
                                }
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
              ))
            )}
          </tbody>
        </table>
        <p className="muted tiny" style={{ marginTop: '0.75rem' }}>
          Active project is <strong>{jobMaterial}</strong> — this list defaults to that material only.
          For Aluminium SKUs set kg/m and leave UPVC ₹/m at 0. Effective ₹/m = kg/m × (Al ₹/kg + coating
          ₹/kg) from Allowances. Stock length defaults: UPVC 5.8 m / Aluminium 16 ft — change any SKU
          freely.
        </p>
      </Card>
    </div>
  );
}
