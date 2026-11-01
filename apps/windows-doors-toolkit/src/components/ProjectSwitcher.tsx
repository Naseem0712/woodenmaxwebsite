import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Btn, Input, NumberInput } from './ui';

export function ProjectSwitcher() {
  const {
    state,
    selectProject,
    createProject,
    renameProject,
    updateProjectLessOff,
  } = useApp();
  const [draftName, setDraftName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const active = state.projects.find((p) => p.id === state.activeProjectId);

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
              {p.name}
            </option>
          ))}
        </select>
      </label>
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
      <Btn
        variant="ghost"
        onClick={() => {
          createProject(draftName || `Job ${state.projects.length + 1}`);
          setDraftName('');
        }}
      >
        + New
      </Btn>
      {active ? (
        <div className="project-lessoff" title="Project less-off overrides Settings when set">
          <span className="tiny muted">Less-off W/H</span>
          <NumberInput
            value={active.lessOffWidthMm ?? ''}
            emptyAs="null"
            placeholder={`def ${state.allowances.lessOffWidthMm}`}
            onCommit={(n) =>
              updateProjectLessOff(active.id, n, active.lessOffHeightMm)
            }
            style={{ width: 72 }}
          />
          <NumberInput
            value={active.lessOffHeightMm ?? ''}
            emptyAs="null"
            placeholder={`def ${state.allowances.lessOffHeightMm}`}
            onCommit={(n) =>
              updateProjectLessOff(active.id, active.lessOffWidthMm, n)
            }
            style={{ width: 72 }}
          />
          <Btn
            variant="ghost"
            onClick={() => updateProjectLessOff(active.id, null, null)}
            title="Clear project override — use Settings defaults"
          >
            Use Settings
          </Btn>
        </div>
      ) : null}
    </div>
  );
}
