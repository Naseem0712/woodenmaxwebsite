import { useState } from 'react';
import { settingsLessOffForMaterial } from '../engine/lessOff';
import { useApp } from '../store/AppContext';
import type { Material } from '../types';
import { Btn, Input, NumberInput } from './ui';

export function ProjectSwitcher() {
  const {
    state,
    selectProject,
    createProject,
    renameProject,
    setProjectMaterial,
    updateProjectLessOff,
  } = useApp();
  const [draftName, setDraftName] = useState('');
  const [draftMaterial, setDraftMaterial] = useState<Material>('UPVC');
  const [renaming, setRenaming] = useState(false);
  const active = state.projects.find((p) => p.id === state.activeProjectId);
  const material = active?.material ?? 'UPVC';
  const settingsLess = settingsLessOffForMaterial(state, material);

  return (
    <div className="project-switcher">
      <label className="project-switcher-label">
        <span>Project</span>
        <select
          className="input tone-in"
          value={state.activeProjectId}
          onChange={(e) => selectProject(e.target.value)}
          title="Switch job — data stays separate per project"
        >
          {state.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.material})
            </option>
          ))}
        </select>
      </label>
      {active ? (
        <label className="project-switcher-label" title="Locks series, stock, rates & tools to this material">
          <span>Material</span>
          <select
            className="input tone-in material-lock"
            value={material}
            onChange={(e) => setProjectMaterial(active.id, e.target.value as Material)}
          >
            <option value="UPVC">UPVC</option>
            <option value="Aluminium">Aluminium</option>
          </select>
        </label>
      ) : null}
      {renaming ? (
        <Input
          value={active?.name ?? ''}
          onChange={(e) => active && renameProject(active.id, e.target.value)}
          onBlur={() => setRenaming(false)}
          autoFocus
          style={{ maxWidth: 180 }}
        />
      ) : (
        <Btn variant="ghost" onClick={() => setRenaming(true)}>
          Rename
        </Btn>
      )}
      <Input
        placeholder="New project name"
        value={draftName}
        onChange={(e) => setDraftName(e.target.value)}
        style={{ maxWidth: 160 }}
      />
      <select
        className="input tone-in"
        value={draftMaterial}
        onChange={(e) => setDraftMaterial(e.target.value as Material)}
        title="Material for the new project"
        style={{ maxWidth: 110 }}
      >
        <option value="UPVC">UPVC</option>
        <option value="Aluminium">Aluminium</option>
      </select>
      <Btn
        variant="ghost"
        onClick={() => {
          createProject(draftName || `Job ${state.projects.length + 1}`, draftMaterial);
          setDraftName('');
        }}
      >
        + New
      </Btn>
      {active ? (
        <div className="project-lessoff" title="Project less-off overrides Settings when set">
          <span className="tiny muted">Less-off W/H ({material})</span>
          <NumberInput
            value={active.lessOffWidthMm ?? ''}
            emptyAs="null"
            placeholder={`def ${settingsLess.widthMm}`}
            onCommit={(n) =>
              updateProjectLessOff(active.id, n, active.lessOffHeightMm)
            }
            style={{ width: 72 }}
          />
          <NumberInput
            value={active.lessOffHeightMm ?? ''}
            emptyAs="null"
            placeholder={`def ${settingsLess.heightMm}`}
            onCommit={(n) =>
              updateProjectLessOff(active.id, active.lessOffWidthMm, n)
            }
            style={{ width: 72 }}
          />
          <Btn
            variant="ghost"
            onClick={() => updateProjectLessOff(active.id, null, null)}
            title="Clear project override — use Settings defaults for this material"
          >
            Use Settings
          </Btn>
        </div>
      ) : null}
    </div>
  );
}
