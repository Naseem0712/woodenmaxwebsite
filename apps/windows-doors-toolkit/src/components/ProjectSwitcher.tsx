import { useState } from 'react';
import { settingsLessOffForMaterial } from '../engine/lessOff';
import { isModeVerified } from '../engine/modePricing';
import { useApp } from '../store/AppContext';
import { CUSTOMER_MODES, type CustomerModeId, type Material } from '../types';
import { ModeVerificationGate } from './ModeVerificationGate';
import { Btn, Input, NumberInput } from './ui';

export function ProjectSwitcher() {
  const {
    state,
    selectProject,
    createProject,
    renameProject,
    setProjectMaterial,
    setProjectCustomerMode,
    requestProjectCustomerMode,
    submitModeVerification,
    updateProjectLessOff,
  } = useApp();
  const [draftName, setDraftName] = useState('');
  const [draftMaterial, setDraftMaterial] = useState<Material>('UPVC');
  const [draftMode, setDraftMode] = useState<CustomerModeId>('home-owner');
  const [renaming, setRenaming] = useState(false);
  const [pendingMode, setPendingMode] = useState<Exclude<CustomerModeId, 'home-owner'> | null>(
    null,
  );
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
  const [pendingNewProject, setPendingNewProject] = useState(false);
  const active = state.projects.find((p) => p.id === state.activeProjectId);
  const material = active?.material ?? 'UPVC';
  const customerMode = active?.customerMode ?? 'home-owner';
  const settingsLess = settingsLessOffForMaterial(state, material);
  const modeDef = CUSTOMER_MODES.find((m) => m.id === customerMode);

  const trySetMode = (projectId: string, mode: CustomerModeId) => {
    // Home owner has no verification gate — must still write customerMode so
    // Layout / Home / guards re-render immediately (Vendor → Home owner was a no-op).
    if (mode === 'home-owner') {
      setProjectCustomerMode(projectId, mode);
      return;
    }
    if (requestProjectCustomerMode(projectId, mode)) return;
    setPendingProjectId(projectId);
    setPendingNewProject(false);
    setPendingMode(mode);
  };

  const tryCreate = () => {
    const name = draftName || `Job ${state.projects.length + 1}`;
    if (draftMode === 'home-owner') {
      createProject(name, draftMaterial, draftMode);
      setDraftName('');
      return;
    }
    const verified = isModeVerified(state, draftMode);
    if (verified) {
      createProject(name, draftMaterial, draftMode);
      setDraftName('');
      return;
    }
    setPendingNewProject(true);
    setPendingProjectId(null);
    setPendingMode(draftMode as Exclude<CustomerModeId, 'home-owner'>);
  };

  return (
    <>
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
        {active ? (
          <label
            className="project-switcher-label"
            title={modeDef?.description ?? 'Customer mode shapes quote UX — rates stay in Settings'}
          >
            <span>Mode</span>
            <select
              className="input tone-in"
              value={customerMode}
              onChange={(e) => trySetMode(active.id, e.target.value as CustomerModeId)}
            >
              {CUSTOMER_MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                  {m.requiresVerification && !isModeVerified(state, m.id) ? ' 🔒' : ''}
                </option>
              ))}
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
        <select
          className="input tone-in"
          value={draftMode}
          onChange={(e) => setDraftMode(e.target.value as CustomerModeId)}
          title="Customer mode for the new project"
          style={{ maxWidth: 130 }}
        >
          {CUSTOMER_MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <Btn variant="ghost" onClick={tryCreate}>
          + New
        </Btn>
        {active ? (
          <div className="project-lessoff" title="Project less-off overrides Settings when set">
            <span className="tiny muted">Less-off W/H ({material})</span>
            <NumberInput
              value={active.lessOffWidthMm ?? ''}
              emptyAs="null"
              placeholder={`def ${settingsLess.widthMm}`}
              onCommit={(n) => updateProjectLessOff(active.id, n, active.lessOffHeightMm)}
              style={{ width: 72 }}
            />
            <NumberInput
              value={active.lessOffHeightMm ?? ''}
              emptyAs="null"
              placeholder={`def ${settingsLess.heightMm}`}
              onCommit={(n) => updateProjectLessOff(active.id, active.lessOffWidthMm, n)}
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
      {pendingMode ? (
        <ModeVerificationGate
          mode={pendingMode}
          onCancel={() => {
            setPendingMode(null);
            setPendingProjectId(null);
            setPendingNewProject(false);
          }}
          onSubmit={(data) => {
            const mode = pendingMode;
            if (pendingNewProject) {
              submitModeVerification(mode, data, null);
              createProject(draftName || `Job ${state.projects.length + 1}`, draftMaterial, mode);
              setDraftName('');
            } else {
              submitModeVerification(mode, data, pendingProjectId ?? undefined);
            }
            setPendingMode(null);
            setPendingProjectId(null);
            setPendingNewProject(false);
          }}
        />
      ) : null}
    </>
  );
}
