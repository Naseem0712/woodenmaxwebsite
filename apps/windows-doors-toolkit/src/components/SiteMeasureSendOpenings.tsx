import { Link } from 'react-router-dom';
import type { Material } from '../types';
import { Btn } from './ui';

export type SendOpeningsTarget = 'quote' | 'costing' | 'configurator' | 'cutting' | 'full-package';

export type SendOpeningsStatus = {
  text: string;
  to?: string;
  linkLabel?: string;
} | null;

const TARGETS: Array<{
  id: Exclude<SendOpeningsTarget, 'full-package'>;
  label: string;
  sub: string;
  title: string;
  testId: string;
}> = [
  {
    id: 'quote',
    label: 'Quote',
    sub: 'Net fab · 01 Openings',
    title:
      'Send all openings to the Quote / 01 Openings schedule using net fabrication size (site size minus less-off).',
    testId: 'send-openings-quote',
  },
  {
    id: 'costing',
    label: 'Costing',
    sub: 'Net fab · 02 / 03',
    title:
      'Send the first sliding opening to 02 Sliding and the first casement/door to 03 Casement, using net fabrication size.',
    testId: 'send-openings-costing',
  },
  {
    id: 'configurator',
    label: 'Configurator',
    sub: 'Net fab · cart',
    title: 'Send all openings to the Configurator cart using net fabrication size.',
    testId: 'send-openings-configurator',
  },
  {
    id: 'cutting',
    label: 'Cutting',
    sub: 'Net fab · 05 cut list',
    title:
      'Send all openings to 05 Cutting as frame cut pairs (W×2 + H×2 per qty) using net fabrication size — not raw site size.',
    testId: 'send-openings-cutting',
  },
];

type Props = {
  disabled: boolean;
  onSend: (target: SendOpeningsTarget) => void;
  status?: SendOpeningsStatus;
  /** panel = mobile Actions fold; desktop = full-width strip under openings header */
  variant?: 'desktop' | 'panel';
  /** When UPVC, show primary Generate full package. Aluminium keeps individual sends only. */
  material?: Material;
};

/**
 * Coherent “Send openings to…” actions for Site Measure.
 * All destinations use net fabrication size (site − less-off).
 * UPVC adds a primary full-package action (materials + HW + glass + mesh + cost + quote).
 */
export function SiteMeasureSendOpenings({
  disabled,
  onSend,
  status,
  variant = 'desktop',
  material,
}: Props) {
  const showFullPackage = material === 'UPVC';

  return (
    <div
      className={`site-measure-send site-measure-send-${variant}`}
      data-testid="site-measure-send-openings"
      data-material={material ?? ''}
    >
      <div className="site-measure-send-head">
        <div className="site-measure-send-title">Send openings to…</div>
        <p className="site-measure-send-help muted tiny">
          <strong>Net fab size</strong> = site W×H after less-off (Settings / project / row). Full site
          size stays on this sheet.
          {showFullPackage ? (
            <>
              {' '}
              UPVC: prefer <strong>Generate full package</strong> for materials + hardware + glass +
              mesh + costing + quote in one step.
            </>
          ) : null}
        </p>
      </div>

      {showFullPackage ? (
        <div className="site-measure-send-primary" data-testid="send-openings-full-package-wrap">
          <Btn
            title="Generate materials BOM (nested), hardware, glass, mesh, costing jobs, and quote header from net fab sizes. Rates from Settings only."
            data-testid="send-openings-full-package"
            disabled={disabled}
            onClick={() => onSend('full-package')}
          >
            <span className="site-measure-send-btn-label">Generate full package</span>
            <span className="site-measure-send-btn-sub">
              Materials · HW · glass · mesh · cost · quote
            </span>
          </Btn>
        </div>
      ) : null}

      <div className="site-measure-send-grid" role="group" aria-label="Send openings destinations">
        {TARGETS.map((t) => (
          <Btn
            key={t.id}
            variant="ghost"
            title={t.title}
            data-testid={t.testId}
            disabled={disabled}
            onClick={() => onSend(t.id)}
          >
            <span className="site-measure-send-btn-label">{t.label}</span>
            <span className="site-measure-send-btn-sub">{t.sub}</span>
          </Btn>
        ))}
      </div>
      {status ? (
        <p className="site-measure-send-status" data-testid="site-measure-send-status" role="status">
          {status.text}
          {status.to && status.linkLabel ? (
            <>
              {' '}
              <Link to={status.to}>{status.linkLabel}</Link>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
