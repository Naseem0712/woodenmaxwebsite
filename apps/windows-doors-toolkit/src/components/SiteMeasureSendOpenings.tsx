import { Link } from 'react-router-dom';
import { Btn } from './ui';

export type SendOpeningsTarget = 'quote' | 'costing' | 'configurator' | 'cutting';

export type SendOpeningsStatus = {
  text: string;
  to?: string;
  linkLabel?: string;
} | null;

const TARGETS: Array<{
  id: SendOpeningsTarget;
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
};

/**
 * Coherent “Send openings to…” actions for Site Measure.
 * All four destinations use net fabrication size (site − less-off).
 */
export function SiteMeasureSendOpenings({
  disabled,
  onSend,
  status,
  variant = 'desktop',
}: Props) {
  return (
    <div
      className={`site-measure-send site-measure-send-${variant}`}
      data-testid="site-measure-send-openings"
    >
      <div className="site-measure-send-head">
        <div className="site-measure-send-title">Send openings to…</div>
        <p className="site-measure-send-help muted tiny">
          <strong>Net fab size</strong> = site W×H after less-off (Settings / project / row). Full site
          size stays on this sheet.
        </p>
      </div>
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
