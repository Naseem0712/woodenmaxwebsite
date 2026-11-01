import { Btn, Toolbar } from './ui';
import type { ExportDocument, ExportFormat, RateMode } from '../engine/exportDocs';
import { runExport } from '../engine/exportDocs';

export type ExportBuilders = {
  quote: (rateMode: RateMode) => ExportDocument;
  bom: (rateMode: RateMode) => ExportDocument;
};

/**
 * Visible Export controls: Quote + BOM, each as PDF/Excel × with/without rates.
 */
export function ExportToolbar({
  builders,
  dense = false,
}: {
  builders: ExportBuilders;
  /** Compact label strip for tight card headers */
  dense?: boolean;
}) {
  const go = (kind: 'quote' | 'bom', format: ExportFormat, rateMode: RateMode) => {
    const doc = kind === 'quote' ? builders.quote(rateMode) : builders.bom(rateMode);
    runExport(doc, format);
  };

  return (
    <div className={`export-toolbar ${dense ? 'export-toolbar-dense' : ''} no-print`}>
      <div className="export-group">
        <div className="export-group-label">Export Quote</div>
        <Toolbar>
          <Btn variant="ghost" title="PDF quotation including Settings rates" onClick={() => go('quote', 'pdf', 'include')}>
            PDF · with rates
          </Btn>
          <Btn variant="ghost" title="PDF quotation without rates or amounts" onClick={() => go('quote', 'pdf', 'exclude')}>
            PDF · no rates
          </Btn>
          <Btn variant="ghost" title="Excel/CSV quotation including rates" onClick={() => go('quote', 'excel', 'include')}>
            Excel · with rates
          </Btn>
          <Btn variant="ghost" title="Excel/CSV quotation without rates" onClick={() => go('quote', 'excel', 'exclude')}>
            Excel · no rates
          </Btn>
        </Toolbar>
      </div>
      <div className="export-group">
        <div className="export-group-label">Export BOM</div>
        <Toolbar>
          <Btn variant="ghost" title="PDF materials + hardware with rates" onClick={() => go('bom', 'pdf', 'include')}>
            PDF · with rates
          </Btn>
          <Btn variant="ghost" title="PDF materials + hardware without rates" onClick={() => go('bom', 'pdf', 'exclude')}>
            PDF · no rates
          </Btn>
          <Btn variant="ghost" title="Excel/CSV materials + hardware with rates" onClick={() => go('bom', 'excel', 'include')}>
            Excel · with rates
          </Btn>
          <Btn variant="ghost" title="Excel/CSV materials + hardware without rates" onClick={() => go('bom', 'excel', 'exclude')}>
            Excel · no rates
          </Btn>
        </Toolbar>
      </div>
    </div>
  );
}
