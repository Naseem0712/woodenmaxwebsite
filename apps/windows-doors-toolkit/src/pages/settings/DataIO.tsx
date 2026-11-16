import { useRef, useState } from 'react';
import { Btn, Card, PageHeader, Toolbar } from '../../components/ui';
import { useApp } from '../../store/AppContext';

export function SettingsDataPage() {
  const { exportJson, importJson, resetSeed } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [paste, setPaste] = useState('');

  const download = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `windows-doors-toolkit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg('Exported JSON download started.');
  };

  const onFile = async (file: File) => {
    try {
      const text = await file.text();
      importJson(text);
      setMsg(`Imported from ${file.name}.`);
    } catch (e) {
      setMsg(`Import failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div>
      <PageHeader
        title="Export / Import"
        subtitle="Persist via browser localStorage automatically. Use JSON for backup, another PC, or reset to sample seed."
      />
      <Card title="Backup">
        <Toolbar>
          <Btn onClick={download}>Download JSON</Btn>
          <Btn variant="ghost" onClick={() => fileRef.current?.click()}>
            Import from file…
          </Btn>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = '';
            }}
          />
        </Toolbar>
        {msg ? <p className="success">{msg}</p> : null}
      </Card>
      <Card title="Paste JSON">
        <textarea
          className="input tone-in"
          style={{ width: '100%', minHeight: 160, fontFamily: 'ui-monospace, Consolas, monospace' }}
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="Paste exported toolkit JSON here…"
        />
        <Toolbar>
          <Btn
            onClick={() => {
              try {
                importJson(paste);
                setMsg('Imported from paste.');
              } catch (e) {
                setMsg(`Paste import failed: ${e instanceof Error ? e.message : String(e)}`);
              }
            }}
          >
            Import paste
          </Btn>
          <Btn
            variant="ghost"
            onClick={() => {
              setPaste(exportJson());
              setMsg('Current state copied into the box — you can select-all and copy.');
            }}
          >
            Fill with current state
          </Btn>
        </Toolbar>
      </Card>
      <Card title="Reset">
        <p className="muted" style={{ marginBottom: '0.75rem' }}>
          Replace everything with the generic Series A / B sample seed (India 2026 fiction rates). This cannot be
          undone unless you exported first.
        </p>
        <Btn
          variant="danger"
          onClick={() => {
            if (window.confirm('Reset all toolkit data to seed sample?')) {
              resetSeed();
              setMsg('Reset to seed.');
            }
          }}
        >
          Reset to seed
        </Btn>
      </Card>
    </div>
  );
}
