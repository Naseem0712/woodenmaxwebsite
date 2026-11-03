/**
 * UPVC Site Measure → full fabrication package (materials + HW + glass + mesh + costing + quote).
 * Aluminium projects must not call this — keep Alu isolation / individual send path intact.
 */
import { v4 as uid } from 'uuid';
import type {
  AppState,
  CutLine,
  GlassPaneLine,
  MeshGrillLine,
  OpeningLine,
  ProfileSku,
} from '../types';
import {
  applySeriesToCasement,
  applySeriesToSliding,
  casementMemberCount,
  lookupGlass,
  lookupWindowType,
  profileRatePerM,
} from './calcs';
import {
  buildSlidingFabricatorBom,
  materialMatchesProject,
} from './fabricatorBom';
import { resolveLessOffMm, withPersistedNet } from './lessOff';
import { resolveEffectiveCatalogue } from './masterCatalogue';
import {
  filterMembersForMaterial,
  filterSeries,
  projectMaterial,
} from './materialContext';
import {
  effectiveHFactor,
  effectiveWFactor,
  fullMeshSizeMm,
  glassShutterWidthMm,
  hasSideFactors,
  sideFactor,
  slidingMeshSizeMm,
} from './memberFactors';
import {
  meshLineAmount,
  resolveMeshCosting,
  suggestOpenableMesh,
  syncMeshYesNo,
} from './meshCosting';
import { formatRemnantLine, nestProfileCuts, type NestResult } from './nesting';
import { defaultStockLengthM } from './profileStockDefaults';

export interface UpvcPackageSummary {
  openings: number;
  cutLines: number;
  glassLines: number;
  meshLines: number;
  hardwareLines: number;
  profileBars: number;
  remnantLines: string[];
  nesting: NestResult;
  quoteCustomer: string;
  quoteDate: string;
  slidingFed: boolean;
  casementFed: boolean;
}

export interface UpvcPackageResult {
  next: AppState;
  summary: UpvcPackageSummary;
}

function toMm(value: number, unit: string): number {
  if (unit === 'mm') return value;
  if (unit === 'inch') return value * 25.4;
  return value * 304.8;
}

function resolveProfileId(
  profiles: ProfileSku[],
  material: 'UPVC' | 'Aluminium',
  skuId: string | undefined,
  nameHints: string[],
): string {
  if (skuId) {
    const hit = profiles.find((p) => p.id === skuId && p.material === material);
    if (hit) return hit.id;
  }
  const candidates = profiles.filter((p) => p.material === material);
  for (const hint of nameHints) {
    const h = hint.toLowerCase();
    const hit = candidates.find((p) => p.name.toLowerCase().includes(h));
    if (hit) return hit.id;
  }
  return candidates[0]?.id ?? '';
}

function emitSideCuts(
  out: CutLine[],
  opts: {
    memberName: string;
    memberId: string;
    count: number;
    widthMm: number;
    heightMm: number;
    qty: number;
    seriesId: string;
    siteMeasureId: string;
    windowLabel: string;
    profiles: ProfileSku[];
    material: 'UPVC' | 'Aluminium';
    profileSkuId?: string;
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  },
) {
  const sides: Array<{ side: string; cutMm: number; f: number }> = [
    { side: 'top', cutMm: opts.widthMm, f: opts.top ?? 0 },
    { side: 'bottom', cutMm: opts.widthMm, f: opts.bottom ?? 0 },
    { side: 'left', cutMm: opts.heightMm, f: opts.left ?? 0 },
    { side: 'right', cutMm: opts.heightMm, f: opts.right ?? 0 },
  ];
  for (const { side, cutMm, f } of sides) {
    const pieces = Math.round(f * opts.count * opts.qty);
    if (pieces <= 0 || cutMm <= 0) continue;
    out.push({
      id: uid(),
      windowLabel: `${opts.windowLabel} · ${opts.memberName} · ${side}`,
      profileId: resolveProfileId(opts.profiles, opts.material, opts.profileSkuId, [
        opts.memberName,
        side,
      ]),
      cutMm: Math.round(cutMm),
      pieces,
      seriesId: opts.seriesId,
      siteMeasureId: opts.siteMeasureId,
    });
  }
}

/**
 * Build UPVC full package from Site Measure openings (net fab sizes).
 * Writes openings, cuts, glass, mesh, costing jobs, quote header — Settings rates only.
 */
export function generateUpvcFullPackage(state: AppState): UpvcPackageResult {
  const material = projectMaterial(state);
  if (material !== 'UPVC') {
    throw new Error('Generate full package is UPVC-only — Aluminium keeps the individual send path.');
  }

  const catalogue = resolveEffectiveCatalogue(state);
  const meshSettings = resolveMeshCosting(state.allowances);
  const matProfiles = catalogue.profiles.filter((p) => p.material === 'UPVC');
  const matSeries = filterSeries(catalogue.series, 'UPVC');
  const today = new Date().toISOString().slice(0, 10);

  const openings: OpeningLine[] = [];
  const cuts: CutLine[] = [];
  const glassPanes: GlassPaneLine[] = [];
  const meshGrill: MeshGrillLine[] = [];
  const nestPieces: Array<{
    profileKey: string;
    profileName: string;
    cutMm: number;
    pieces: number;
    stockLengthM: number;
    ratePerM: number;
  }> = [];

  let slidingFed = false;
  let casementFed = false;
  let nextSliding = { ...state.sliding };
  let nextCasement = { ...state.casement };
  let hardwareLineCount = 0;

  const first = state.siteMeasures[0];
  const lead =
    state.leads.find((l) => l.id === first?.leadId) ?? state.leads[0];

  for (const m of state.siteMeasures) {
    const netted = withPersistedNet(state, m);
    const wt = lookupWindowType(catalogue.windowTypes, m.windowTypeId);
    if (!wt) continue;
    const series = wt.seriesId
      ? catalogue.series.find((s) => s.id === wt.seriesId)
      : undefined;
    if (!series || !materialMatchesProject(wt, series, 'UPVC')) continue;

    const netW = netted.netWidth;
    const netH = netted.netHeight;
    const unit = m.unit;
    const widthMm = toMm(netW, unit);
    const heightMm = toMm(netH, unit);
    const label = m.location || 'Opening';
    const glassTypeId = m.glassTypeId || catalogue.glassTypes[0]?.id || '';
    const inset = series.glassInsetMm || 0;

    openings.push({
      id: uid(),
      location: label,
      windowTypeId: m.windowTypeId,
      width: netW,
      height: netH,
      qty: m.qty,
      tracks: m.tracks,
      glassDoors: m.glassDoors,
      meshDoors: m.meshDoors,
      meshType: m.meshType,
      hasVent: m.hasVent,
      ventCount: m.ventCount,
      glassTypeId,
      colourId: m.colourId,
      lockHandleLabel: m.lockHandleLabel,
      doorExtraKind: m.doorExtraKind,
      notes: m.notes ?? '',
      discountPercent: m.discountPercent ?? null,
    });

    const isSliding =
      wt.kind === 'sliding' ||
      series.kind === 'sliding' ||
      (wt.kind === 'door' && (m.tracks ?? 0) > 0);

    if (isSliding) {
      let job = applySeriesToSliding(series, { ...state.sliding }, state.allowances);
      job = {
        ...job,
        material: 'UPVC',
        seriesId: series.id,
        tracks: m.tracks || series.defaultTracks || 2,
        glassShutters: m.glassDoors || series.defaultShutters || 2,
        meshDoors: m.meshDoors,
        meshType: m.meshType,
        mesh: syncMeshYesNo(m.meshDoors, m.meshType),
        widthMm,
        heightMm,
        qty: m.qty,
        glassTypeId,
        glassInsetMm: inset,
      };
      if (!slidingFed) {
        nextSliding = job;
        slidingFed = true;
      }

      const glass = lookupGlass(catalogue.glassTypes, glassTypeId);
      const fab = buildSlidingFabricatorBom(
        state,
        series,
        job,
        matProfiles,
        catalogue.hardware,
        glass,
        defaultStockLengthM('UPVC'),
      );
      hardwareLineCount += fab.hardware.length;

      for (const c of fab.cuts) {
        const profileId = resolveProfileId(matProfiles, 'UPVC', c.profileSkuId, [c.name, c.detail]);
        const profile = matProfiles.find((p) => p.id === profileId);
        const stock =
          c.stockLengthM > 0
            ? c.stockLengthM
            : profile?.stockLengthM && profile.stockLengthM > 0
              ? profile.stockLengthM
              : defaultStockLengthM('UPVC');
        const rate = profile ? profileRatePerM(profile, state.allowances) : c.ratePerM;
        cuts.push({
          id: uid(),
          windowLabel: `${label} · ${c.name}`,
          profileId,
          cutMm: Math.round(c.cutMm),
          pieces: c.pieces,
          seriesId: series.id,
          siteMeasureId: m.id,
        });
        nestPieces.push({
          profileKey: profileId || c.key,
          profileName: profile?.name || c.name,
          cutMm: Math.round(c.cutMm),
          pieces: c.pieces,
          stockLengthM: stock,
          ratePerM: rate,
        });
      }

      // Glass panes — shutter glass size
      const shutterW = glassShutterWidthMm(widthMm, Math.max(2, job.glassShutters || 2));
      const glassW = Math.max(0, Math.round(shutterW - 2 * inset));
      const glassH = Math.max(0, Math.round(heightMm - 2 * inset));
      const panes = Math.max(1, job.glassShutters) * m.qty;
      if (glassW > 0 && glassH > 0 && panes > 0) {
        glassPanes.push({
          id: uid(),
          windowLabel: label,
          glassTypeId,
          widthMm: glassW,
          heightMm: glassH,
          panes,
        });
      }

      // Mesh list
      if (m.meshDoors > 0 && m.meshType !== 'none') {
        const meshSize =
          m.meshType === 'rolling' || m.meshType === 'collapsible'
            ? fullMeshSizeMm(widthMm, heightMm)
            : slidingMeshSizeMm(widthMm, heightMm);
        const meshAmt = meshLineAmount(
          {
            width: netW,
            height: netH,
            unit,
            meshType: m.meshType,
            meshDoors: m.meshDoors,
            glassDoors: m.glassDoors,
            hasVent: m.hasVent,
            ventCount: m.ventCount,
          },
          meshSettings,
          m.qty,
          series.meshNetPerSqft,
        );
        meshGrill.push({
          id: uid(),
          kind: 'mesh',
          location: label,
          widthMm: Math.round(meshSize.widthMm),
          heightMm: Math.round(meshSize.heightMm),
          qty: Math.max(1, m.meshDoors) * m.qty,
          ratePerSqft: meshAmt.rate,
        });
      }
    } else {
      // Casement / door / openable — member cuts + series hardware via openings path
      let job = applySeriesToCasement(series, { ...state.casement }, state.allowances);
      const openable = m.glassDoors || series.defaultOpenable || 1;
      const panels = Math.max(openable, series.defaultPanels || openable);
      const ventSug =
        m.hasVent === 'Yes'
          ? suggestOpenableMesh(meshSettings, {
              openablePanels: openable,
              hasVent: 'Yes',
              doorSide: false,
            })
          : null;
      job = {
        ...job,
        material: 'UPVC',
        seriesId: series.id,
        panels,
        openablePanels: openable,
        doorLeaves: wt.kind === 'door' ? openable : 0,
        meshDoors: m.meshDoors,
        meshType: m.meshType,
        mesh: syncMeshYesNo(m.meshDoors, m.meshType),
        hasVent: m.hasVent,
        ventCount: m.ventCount || ventSug?.ventCount || 0,
        widthMm,
        heightMm,
        qty: m.qty,
        glassTypeId,
        glassInsetMm: inset,
      };
      if (!casementFed) {
        nextCasement = job;
        casementFed = true;
      }

      const members = filterMembersForMaterial(series.members, 'UPVC');
      for (const mem of members) {
        const count = casementMemberCount(mem.memberClass, job);
        if (count <= 0) continue;
        const panelClasses = new Set(['Openable panel', 'Panel', 'Mesh panel', 'UPVC openable']);
        const wFor =
          panelClasses.has(mem.memberClass) && job.panels > 0
            ? widthMm / job.panels
            : widthMm;
        const linkedSku = mem.profileSkuId
          ? matProfiles.find((p) => p.id === mem.profileSkuId)
          : undefined;
        const stock =
          (linkedSku?.stockLengthM && linkedSku.stockLengthM > 0
            ? linkedSku.stockLengthM
            : 0) || defaultStockLengthM('UPVC');
        const rate =
          mem.ratePerM ||
          (linkedSku ? profileRatePerM(linkedSku, state.allowances) : 0);

        if (hasSideFactors(mem)) {
          emitSideCuts(cuts, {
            memberName: mem.name,
            memberId: mem.id,
            count,
            widthMm: wFor,
            heightMm,
            qty: m.qty,
            seriesId: series.id,
            siteMeasureId: m.id,
            windowLabel: label,
            profiles: matProfiles,
            material: 'UPVC',
            profileSkuId: mem.profileSkuId,
            top: sideFactor(mem, 'top'),
            bottom: sideFactor(mem, 'bottom'),
            left: sideFactor(mem, 'left'),
            right: sideFactor(mem, 'right'),
          });
          // nest pieces for sides
          for (const side of ['top', 'bottom', 'left', 'right'] as const) {
            const f = sideFactor(mem, side);
            const pieces = Math.round(f * count * m.qty);
            const cutMm = side === 'top' || side === 'bottom' ? wFor : heightMm;
            if (pieces <= 0) continue;
            const profileId = resolveProfileId(matProfiles, 'UPVC', mem.profileSkuId, [mem.name, side]);
            const profile = matProfiles.find((p) => p.id === profileId);
            nestPieces.push({
              profileKey: profileId || `${mem.id}:${side}`,
              profileName: profile?.name || `${mem.name} · ${side}`,
              cutMm: Math.round(cutMm),
              pieces,
              stockLengthM: stock,
              ratePerM: rate || (profile ? profileRatePerM(profile, state.allowances) : 0),
            });
          }
          continue;
        }

        const hF = effectiveHFactor(mem);
        const wF = effectiveWFactor(mem);
        if (Number.isInteger(hF) && hF > 0) {
          const pieces = Math.round(hF * count * m.qty);
          const profileId = resolveProfileId(matProfiles, 'UPVC', mem.profileSkuId, [
            mem.name,
            'vertical',
          ]);
          cuts.push({
            id: uid(),
            windowLabel: `${label} · ${mem.name} vertical`,
            profileId,
            cutMm: Math.round(heightMm),
            pieces,
            seriesId: series.id,
            siteMeasureId: m.id,
          });
          nestPieces.push({
            profileKey: profileId || `${mem.id}:v`,
            profileName: matProfiles.find((p) => p.id === profileId)?.name || `${mem.name} vertical`,
            cutMm: Math.round(heightMm),
            pieces,
            stockLengthM: stock,
            ratePerM: rate,
          });
        }
        if (Number.isInteger(wF) && wF > 0) {
          const pieces = Math.round(wF * count * m.qty);
          const profileId = resolveProfileId(matProfiles, 'UPVC', mem.profileSkuId, [
            mem.name,
            'top',
          ]);
          cuts.push({
            id: uid(),
            windowLabel: `${label} · ${mem.name} top/bottom`,
            profileId,
            cutMm: Math.round(wFor),
            pieces,
            seriesId: series.id,
            siteMeasureId: m.id,
          });
          nestPieces.push({
            profileKey: profileId || `${mem.id}:h`,
            profileName: matProfiles.find((p) => p.id === profileId)?.name || `${mem.name} top/bottom`,
            cutMm: Math.round(wFor),
            pieces,
            stockLengthM: stock,
            ratePerM: rate,
          });
        }
      }

      // Glass — openable leaf size
      const leafW = Math.max(0, Math.round(widthMm / Math.max(1, panels) - 2 * inset));
      const leafH = Math.max(0, Math.round(heightMm - 2 * inset));
      const panes = Math.max(1, openable) * m.qty;
      if (leafW > 0 && leafH > 0) {
        glassPanes.push({
          id: uid(),
          windowLabel: label,
          glassTypeId,
          widthMm: leafW,
          heightMm: leafH,
          panes,
        });
      }

      if (m.meshDoors > 0 && m.meshType !== 'none') {
        const meshSize =
          m.meshType === 'door-side'
            ? {
                widthMm: widthMm / Math.max(1, openable),
                heightMm,
              }
            : fullMeshSizeMm(widthMm, heightMm);
        const meshAmt = meshLineAmount(
          {
            width: netW,
            height: netH,
            unit,
            meshType: m.meshType,
            meshDoors: m.meshDoors,
            glassDoors: openable,
            panels,
            hasVent: m.hasVent,
            ventCount: m.ventCount,
          },
          meshSettings,
          m.qty,
          series.meshNetPerSqft,
        );
        meshGrill.push({
          id: uid(),
          kind: 'mesh',
          location: label,
          widthMm: Math.round(meshSize.widthMm),
          heightMm: Math.round(meshSize.heightMm),
          qty: Math.max(1, m.meshDoors) * m.qty,
          ratePerSqft: meshAmt.rate,
        });
      }

      // Approximate hardware lines from series seed rates present
      hardwareLineCount += 1;
    }
  }

  const nesting = nestProfileCuts(
    nestPieces,
    state.allowances.endTrimMm,
    state.allowances.sawAllowanceMm,
  );

  const customerName =
    lead?.name || state.jobMeta.customerName || state.quote.customerName || '';
  const siteAddress =
    lead?.addressNote || state.jobMeta.siteAddress || state.quote.siteAddress || '';
  const phone = lead?.phone || state.quote.phone || '';

  const unit = state.siteMeasures[0]?.unit ?? state.allowances.unit;
  const less = resolveLessOffMm(state, null);

  const next: AppState = {
    ...state,
    openings,
    cuts,
    glassPanes,
    meshGrill,
    sliding: nextSliding,
    casement: nextCasement,
    allowances: { ...state.allowances, unit },
    labour: {
      fabPerSqft: state.labour.fabPerSqft || state.allowances.fabricationLabourPerSqft,
      installPerSqft: state.labour.installPerSqft || state.allowances.installationLabourPerSqft,
      fabPerWindow: state.labour.fabPerWindow,
      installPerWindow: state.labour.installPerWindow,
    },
    jobMeta: {
      ...state.jobMeta,
      customerName: customerName || state.jobMeta.customerName,
      siteAddress: siteAddress || state.jobMeta.siteAddress,
      jobLabel: lead ? `${lead.leadNo} UPVC package` : state.jobMeta.jobLabel || 'UPVC package',
    },
    quote: {
      ...state.quote,
      customerName: customerName || state.quote.customerName,
      siteAddress: siteAddress || state.quote.siteAddress,
      phone: phone || state.quote.phone,
      quoteDate: state.quote.quoteDate || today,
      quoteNo:
        state.quote.quoteNo ||
        `Q-${today.replace(/-/g, '')}-${String(openings.length).padStart(2, '0')}`,
    },
    leads: lead
      ? state.leads.map((l) =>
          l.id === lead.id
            ? {
                ...l,
                status: l.status === 'Won' || l.status === 'Lost' ? l.status : 'Quoted',
                openingsCount: openings.reduce((n, o) => n + o.qty, 0),
              }
            : l,
        )
      : state.leads,
  };

  // silence unused less warning — kept for future net audit
  void less;
  void matSeries;

  return {
    next,
    summary: {
      openings: openings.length,
      cutLines: cuts.length,
      glassLines: glassPanes.length,
      meshLines: meshGrill.length,
      hardwareLines: hardwareLineCount,
      profileBars: nesting.totalBars,
      remnantLines: nesting.remnantLines.map(formatRemnantLine),
      nesting,
      quoteCustomer: next.quote.customerName,
      quoteDate: next.quote.quoteDate,
      slidingFed,
      casementFed,
    },
  };
}
