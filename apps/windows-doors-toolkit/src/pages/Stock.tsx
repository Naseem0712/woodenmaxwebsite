import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { v4 as uid } from 'uuid';
import { Btn, Card, Kpi, Num, NumberInput, PageHeader, Select, Toolbar } from '../components/ui';
import { calcStock } from '../engine/calcs';
import { projectMaterial } from '../engine/materialContext';
import { useApp } from '../store/AppContext';
import type { Material, SeriesKind, StockIssue, StockLine } from '../types';

export function StockPage() {
  const { state, patch, setState } = useApp();
  const calc = calcStock(state);
  const activeName =
    state.projects.find((p) => p.id === state.activeProjectId)?.name ?? 'Active project';
  const jobMaterial = projectMaterial(state);
  const [materialFilter, setMaterialFilter] = useState<Material | 'all' | 'project'>('project');
  const [kindFilter, setKindFilter] = useState<SeriesKind | 'all'>('all');

  const effectiveMaterial: Material | 'all' =
    materialFilter === 'project' ? jobMaterial : materialFilter;

  const visibleSeries = useMemo(() => {
    return state.series.filter((s) => {
      if (effectiveMaterial !== 'all' && s.material !== effectiveMaterial) return false;
      if (kindFilter !== 'all' && s.kind !== kindFilter) return false;
      return true;
    });
  }, [state.series, effectiveMaterial, kindFilter]);

  const updateLine = (id: string, patchLine: Partial<StockLine>) => {
    patch(
      'stock',
      state.stock.map((r) => (r.id === id ? { ...r, ...patchLine } : r)),
    );
  };

  const addSection = (seriesId: string) => {
    patch('stock', [
      ...state.stock,
      {
        id: uid(),
        seriesId,
        sectionName: 'New section',
        openingBalanceM: 0,
        purchasesM: 0,
        note: '',
      },
    ]);
  };

  const issueToProject = (stockLineId: string, metres: number) => {
    if (metres <= 0) return;
    const issue: StockIssue = {
      id: uid(),
      stockLineId,
      projectId: state.activeProjectId,
      metres,
      date: new Date().toISOString().slice(0, 10),
      note: `Issued to ${activeName}`,
      source: 'manual',
    };
    patch('stockIssues', [...state.stockIssues, issue]);
  };

  return (
    <div>
      <PageHeader
        title="Series stock"
        subtitle="Inventory by material × kind (sliding / casement). Default filter follows the active project material so you never issue the wrong system."
        badge="Global shop stock"
      />

      <Card title="Filter">
        <Toolbar>
          <label className="tiny muted">
            Material{' '}
            <Select
              value={materialFilter}
              onChange={(e) =>
                setMaterialFilter(e.target.value as Material | 'all' | 'project')
              }
            >
              <option value="project">Project ({jobMaterial})</option>
              <option value="UPVC">UPVC</option>
              <option value="Aluminium">Aluminium</option>
              <option value="all">All materials</option>
            </Select>
          </label>
          <label className="tiny muted">
            Kind{' '}
            <Select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value as SeriesKind | 'all')}
            >
              <option value="all">All kinds</option>
              <option value="sliding">sliding</option>
              <option value="casement">casement</option>
              <option value="door">door</option>
              <option value="other">other</option>
            </Select>
          </label>
        </Toolbar>
      </Card>

      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        <Kpi label="Sections" value={calc.rows.length} />
        <Kpi label="Remaining m" value={<Num n={calc.totalRemaining} />} />
        <Kpi label="Issued m" value={<Num n={calc.totalIssued} />} />
        <Kpi
          label="Active project"
          value={
            <span className="tiny">
              {activeName} · {jobMaterial} · <Link to="/cutting">Cutting</Link>
            </span>
          }
        />
      </div>

      {visibleSeries.map((series) => {
        const rows = calc.bySeries.get(series.id) ?? [];
        return (
          <Card
            key={series.id}
            title={`${series.material} · ${series.kind} · ${series.name}`}
            actions={
              <Toolbar>
                <Btn variant="ghost" onClick={() => addSection(series.id)}>
                  + Section
                </Btn>
              </Toolbar>
            }
          >
            <table className="data">
              <thead>
                <tr>
                  <th>Section / profile</th>
                  <th>Opening m</th>
                  <th>Purchases m</th>
                  <th>Issued m</th>
                  <th>Remaining m</th>
                  <th>Note</th>
                  <th>Issue to project</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="muted">
                      No sections yet — add one for this series.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <input
                          value={r.sectionName}
                          onChange={(e) => updateLine(r.id, { sectionName: e.target.value })}
                        />
                      </td>
                      <td>
                        <NumberInput
                          value={r.openingBalanceM}
                          onCommit={(n) =>
                            updateLine(r.id, { openingBalanceM: n ?? r.openingBalanceM })
                          }
                        />
                      </td>
                      <td>
                        <NumberInput
                          value={r.purchasesM}
                          onCommit={(n) => updateLine(r.id, { purchasesM: n ?? r.purchasesM })}
                        />
                      </td>
                      <td className="calc">
                        <Num n={r.issuedM} />
                      </td>
                      <td className={`calc ${r.remainingM < 0 ? 'warn' : ''}`}>
                        <Num n={r.remainingM} />
                      </td>
                      <td>
                        <input
                          value={r.note}
                          onChange={(e) => updateLine(r.id, { note: e.target.value })}
                        />
                      </td>
                      <td>
                        <Btn
                          variant="ghost"
                          onClick={() => {
                            const raw = window.prompt('Metres to issue to active project', '5.8');
                            if (raw == null) return;
                            const m = Number(raw);
                            if (!Number.isNaN(m) && m > 0) issueToProject(r.id, m);
                          }}
                        >
                          Issue…
                        </Btn>
                      </td>
                      <td>
                        <Btn
                          variant="danger"
                          onClick={() => {
                            setState((s) => ({
                              ...s,
                              stock: s.stock.filter((x) => x.id !== r.id),
                              stockIssues: s.stockIssues.filter((x) => x.stockLineId !== r.id),
                            }));
                          }}
                        >
                          Del
                        </Btn>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        );
      })}

      <Card title="Recent issues">
        <table className="data">
          <thead>
            <tr>
              <th>Date</th>
              <th>Series / section</th>
              <th>Project</th>
              <th>Metres</th>
              <th>Source</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {[...state.stockIssues].reverse().slice(0, 40).map((iss) => {
              const line = state.stock.find((s) => s.id === iss.stockLineId);
              const series = state.series.find((s) => s.id === line?.seriesId);
              const proj = state.projects.find((p) => p.id === iss.projectId);
              return (
                <tr key={iss.id}>
                  <td>{iss.date}</td>
                  <td>
                    {series?.name ?? '—'} · {line?.sectionName ?? '—'}
                  </td>
                  <td>{proj?.name ?? iss.projectId}</td>
                  <td className="calc">
                    <Num n={iss.metres} />
                  </td>
                  <td>{iss.source}</td>
                  <td>{iss.note}</td>
                </tr>
              );
            })}
            {!state.stockIssues.length ? (
              <tr>
                <td colSpan={6} className="muted">
                  No stock issues yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
