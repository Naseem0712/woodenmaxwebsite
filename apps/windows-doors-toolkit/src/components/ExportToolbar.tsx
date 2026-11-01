import type { ReactNode } from 'react';
import { Btn, Toolbar } from './ui';
import type { ExportDocument, ExportFormat, RateMode } from '../engine/exportDocs';
import { runExport } from '../engine/exportDocs';

export type ExportBuilders = {
  /** Quote exports package amounts (no ₹/sqft toggle). rateMode kept for call-site compatibility. */
  quote: (rateMode: RateMode) => ExportDocument;
  bom: (rateMode: RateMode) => ExportDocument;
  sizeList?: (rateMode: RateMode) => ExportDocument;
  profileBoq?: (rateMode: RateMode) => ExportDocument;
};

export function ExportToolbar({
  builders,
  dense = false,
  panel = false,
}: {
  builders: ExportBuilders;
  dense?: boolean;
  panel?: boolean;
}) {
  const go = (
    kind: 'quote' | 'bom' | 'sizeList' | 'profileBoq',
    format: ExportFormat,
    rateMode: RateMode,
  ) => {
    const builder =
      kind === 'quote'
        ? builders.quote
        : kind === 'bom'
          ? builders.bom
          : kind === 'sizeList'
            ? builders.sizeList
            : builders.profileBoq;
    if (!builder) return;
    runExport(builder(rateMode), format);
  };

  const quoteButtons = (
    <>
      <Btn
        variant="ghost"
        title="PDF quotation with package amount per opening (no ₹/sqft)"
        onClick={() => go('quote', 'pdf', 'include')}
      >
        PDF · package
      </Btn>
      <Btn
        variant="ghost"
        title="Excel/CSV quotation with package amount per opening (no ₹/sqft)"
        onClick={() => go('quote', 'excel', 'include')}
      >
        Excel · package
      </Btn>
    </>
  );

  const rateButtons = (
    kind: 'bom' | 'sizeList' | 'profileBoq',
    titles: { pdfWith: string; pdfNo: string; xlsWith: string; xlsNo: string },
  ) => (
    <>
      <Btn variant="ghost" title={titles.pdfWith} onClick={() => go(kind, 'pdf', 'include')}>
        PDF · with rates
      </Btn>
      <Btn variant="ghost" title={titles.pdfNo} onClick={() => go(kind, 'pdf', 'exclude')}>
        PDF · no rates
      </Btn>
      <Btn variant="ghost" title={titles.xlsWith} onClick={() => go(kind, 'excel', 'include')}>
        Excel · with rates
      </Btn>
      <Btn variant="ghost" title={titles.xlsNo} onClick={() => go(kind, 'excel', 'exclude')}>
        Excel · no rates
      </Btn>
    </>
  );

  const bomButtons = rateButtons('bom', {
    pdfWith: 'PDF materials + hardware with rates',
    pdfNo: 'PDF materials + hardware without rates',
    xlsWith: 'Excel/CSV materials + hardware with rates',
    xlsNo: 'Excel/CSV materials + hardware without rates',
  });
  const sizeButtons = builders.sizeList
    ? rateButtons('sizeList', {
        pdfWith: 'PDF window size list (optional rates)',
        pdfNo: 'PDF window size list without rates',
        xlsWith: 'Excel window size list with rates',
        xlsNo: 'Excel window size list without rates',
      })
    : null;
  const boqButtons = builders.profileBoq
    ? rateButtons('profileBoq', {
        pdfWith: 'PDF profile + hardware BOQ with rates',
        pdfNo: 'PDF profile + hardware BOQ without rates',
        xlsWith: 'Excel profile + hardware BOQ with rates',
        xlsNo: 'Excel profile + hardware BOQ without rates',
      })
    : null;

  const group = (label: string, buttons: ReactNode) => (
    <div className="export-group">
      <div className="export-group-label">{label}</div>
      {panel ? <div className="export-btn-grid">{buttons}</div> : <Toolbar>{buttons}</Toolbar>}
    </div>
  );

  return (
    <div
      className={`export-toolbar ${dense ? 'export-toolbar-dense' : ''} ${panel ? 'export-toolbar-panel' : ''} no-print`}
      data-testid={panel ? 'export-toolbar-panel' : 'export-toolbar'}
    >
      {group('Export Quote', quoteButtons)}
      {group('Export BOM', bomButtons)}
      {sizeButtons ? group('Export Size list', sizeButtons) : null}
      {boqButtons ? group('Export Profile BOQ', boqButtons) : null}
    </div>
  );
}
