import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BuildPlannerInputForm from '../components/buildPlanner/BuildPlannerInputForm';
import BuildPlannerChecklist from '../components/buildPlanner/BuildPlannerChecklist';
import BuildPlannerCompatibilityCards from '../components/buildPlanner/BuildPlannerCompatibilityCards';
import BuildPlannerWarnings from '../components/buildPlanner/BuildPlannerWarnings';
import BuildPlannerVisualizer from '../components/buildPlanner/BuildPlannerVisualizer';
import CartValidationStatus from '../components/buildPlanner/CartValidationStatus';
import RecommendedPartsPanel from '../components/buildPlanner/RecommendedPartsPanel';
import CustomPartAnalysisPanel from '../components/buildPlanner/CustomPartAnalysisPanel';
import BuildPlannerNotesPanel from '../components/buildPlanner/BuildPlannerNotesPanel';
import CompatibilityPanel from '../../components/CompatibilityPanel';
import {
  analyzeCustomPartCompatibility,
  generateBuildPlannerReport,
} from '../services/buildPlanner/buildPlannerService';
import { projectCartService } from '../services/shopping/ProjectCartService';
import { runAITask } from '../services/aiOrchestrator';
import { useProjectStore } from '../../store/projectStore';

const INITIAL_FORM = {
  projectName: 'Weekend Trail Build',
  projectType: 'ebike_conversion',
  userDescription: '',
  bikeType: 'mountain-bike',
  intendedUse: 'trail',
  riderHeightCm: '',
  frameSizeCm: '',
  wheelSizeIn: '',
  budgetUsd: '600',
  notes: '',
};

function toProjectId(projectName) {
  const normalized = (projectName || 'build-planner')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return `build-planner-${normalized || 'default'}`;
}

function decisionIdForPart(part, index) {
  const base = `${String(part?.category || 'other').toLowerCase()}-${String(part?.name || `part-${index + 1}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`;

  return String(part?.id || base || `part-${index + 1}`);
}

export default function BuildPlannerPage() {
  const [formState, setFormState] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [analysis, setAnalysis] = useState({ summary: '' });
  const [linkedProjectItems, setLinkedProjectItems] = useState([]);
  const [customPartResults, setCustomPartResults] = useState([]);
  const [customAnalyzing, setCustomAnalyzing] = useState(false);
  const [customAnalysisError, setCustomAnalysisError] = useState('');

  const projectId = useMemo(() => toProjectId(formState.projectName), [formState.projectName]);
  const projects = useProjectStore((state) => state.projects);
  const ensureProject = useProjectStore((state) => state.ensureProject);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);
  const addSourcingNote = useProjectStore((state) => state.addSourcingNote);
  const removeSourcingNote = useProjectStore((state) => state.removeSourcingNote);
  const syncBrowsableItems = useProjectStore((state) => state.syncBrowsableItems);
  const markItemPreferred = useProjectStore((state) => state.markItemPreferred);
  const clearItemPreferred = useProjectStore((state) => state.clearItemPreferred);
  const setItemDeprioritized = useProjectStore((state) => state.setItemDeprioritized);

  useEffect(() => {
    ensureProject(projectId, formState.projectName);
    setActiveProject(projectId);
  }, [projectId, formState.projectName, ensureProject, setActiveProject]);

  const activeProject = useMemo(() => {
    return projects.find((project) => project.id === projectId) || null;
  }, [projects, projectId]);

  const projectNotes = useMemo(() => {
    return (activeProject?.notes || []).map((note) => ({
      id: note.id,
      url: note.url || note.links?.[0] || '',
      title: note.title || note.content || note.links?.[0] || 'Custom Link',
      category: note.category || 'general',
      relatedItemIds: Array.isArray(note.relatedItemIds) ? note.relatedItemIds : [],
      comment: note.comment || note.content || '',
      normalizedName: note.normalizedName,
      groupKey: note.groupKey,
      variantHash: note.variantHash,
      price: note.price,
      selected: Boolean(note.selected),
      createdAt: new Date(Number(note.createdAt || Date.now())).toISOString(),
    }));
  }, [activeProject]);

  const recommendedPartsWithDecisionIds = useMemo(() => {
    const parts = report?.aiPlan?.recommendedParts || [];
    return parts.map((part, index) => ({
      ...part,
      decisionId: decisionIdForPart(part, index),
    }));
  }, [report]);

  const decisionStateMap = useMemo(() => {
    const map = {};
    (activeProject?.items || []).forEach((item) => {
      map[item.id] = {
        isPreferred: Boolean(item.isPreferred),
        isDeprioritized: Boolean(item.isDeprioritized),
        relatedItemIds: Array.isArray(item.relatedItemIds) ? item.relatedItemIds : [],
      };
    });
    return map;
  }, [activeProject]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const items = recommendedPartsWithDecisionIds.map((part) => ({
      id: part.decisionId,
      name: part.name || 'Unnamed Part',
      category: String(part.category || 'other').toLowerCase(),
      specs: part.specs || {},
    }));

    syncBrowsableItems(projectId, items);
  }, [projectId, recommendedPartsWithDecisionIds, syncBrowsableItems]);

  const buildPlacements = (checklist = [], linkedItems = [], cartItems = []) => {
    const linkedSet = new Set((linkedItems || []).map((name) => String(name || '').toLowerCase()));
    const cartSet = new Set((cartItems || []).map((item) => String(item?.name || '').toLowerCase()));

    const checklistPlacements = (checklist || []).map((item, index) => {
      const recommendedName = item?.recommendedItem?.name || item?.title || `Step ${index + 1}`;
      const loweredName = String(recommendedName).toLowerCase();

      let status = 'pending';
      if ((item?.status || '').toLowerCase() === 'incompatible') {
        status = 'conflict';
      } else if (cartSet.has(loweredName)) {
        status = 'added';
      } else if (linkedSet.has(loweredName)) {
        status = 'linked';
      }

      return {
        id: item?.id || `placement-${index + 1}`,
        label: recommendedName,
        source: item?.source || 'planner',
        status,
        x: item?.placement?.x,
        y: item?.placement?.y,
      };
    });

    const customPlacements = (customPartResults || []).map((result, index) => {
      const loweredName = String(result?.itemName || '').toLowerCase();
      const fromCart = cartSet.has(loweredName);
      const statusMap = {
        compatible: fromCart ? 'added' : 'linked',
        probable: fromCart ? 'added' : 'linked',
        verify: 'pending',
        incompatible: 'conflict',
      };

      return {
        id: result.id || `custom-placement-${index + 1}`,
        label: result.itemName || `Custom Item ${index + 1}`,
        source: 'custom-analysis',
        status: statusMap[result.status] || 'pending',
        x: 12 + (index % 3) * 28,
        y: 75 + Math.floor(index / 3) * 10,
      };
    });

    return [...checklistPlacements, ...customPlacements];
  };

  const customStatusToCompatibilityStatus = (status) => {
    if (status === 'compatible') return 'compatible';
    if (status === 'probable') return 'caution';
    if (status === 'verify') return 'needs-info';
    if (status === 'incompatible') return 'incompatible';
    return 'uncertain';
  };

  const customResultToCompatibilityCard = (result, index) => ({
    id: result.id || `custom-compatibility-${index + 1}`,
    title: `Custom: ${result.itemName || `Item ${index + 1}`}`,
    status: customStatusToCompatibilityStatus(result.status),
    confidence: typeof result.confidence === 'number' ? result.confidence : 0.58,
    summary: result.summary || 'Custom part analysis result.',
    missingMeasurements: result.requiredChecks || [],
  });

  const combinedCompatibilityCards = useMemo(() => {
    const baseCards = report?.compatibility?.compatibilityCards || [];
    const customCards = customPartResults.map(customResultToCompatibilityCard);
    return [...baseCards, ...customCards];
  }, [report, customPartResults]);

  const combinedWarnings = useMemo(() => {
    const base = report?.compatibility?.warnings || [];
    const custom = customPartResults.flatMap((result) => result.warnings || []);
    return [...new Set([...base, ...custom])];
  }, [report, customPartResults]);

  const combinedMissingMeasurements = useMemo(() => {
    const base = report?.compatibility?.missingMeasurements || [];
    const custom = customPartResults.flatMap((result) => result.requiredChecks || []);
    return [...new Set([...base, ...custom])];
  }, [report, customPartResults]);

  const cartValidation = useMemo(() => {
    const compatibilityCards = combinedCompatibilityCards;

    const incompatible = compatibilityCards.filter((card) => card?.status === 'incompatible').length;
    const caution = compatibilityCards.filter((card) => card?.status === 'caution').length;
    const lowConfidence = compatibilityCards.filter((card) => (card?.confidence || 0) < 0.6).length;

    let status = 'ready';
    let summary = 'All checked items are currently compatible with your cart and project profile.';

    if (incompatible > 0) {
      status = 'blocked';
      summary = `Resolve ${incompatible} incompatible item${incompatible > 1 ? 's' : ''} before checkout.`;
    } else if (caution > 0 || lowConfidence > 0) {
      status = 'caution';
      summary = 'Review caution items and low-confidence matches before buying parts.';
    }

    return {
      status,
      summary,
      counts: {
        incompatible,
        caution,
        lowConfidence,
      },
    };
  }, [combinedCompatibilityCards]);

  const placements = useMemo(() => {
    const checklist = report?.aiPlan?.checklist || [];
    const cartItems = projectCartService.getCart(projectId)?.items || [];
    return buildPlacements(checklist, linkedProjectItems, cartItems);
  }, [report, linkedProjectItems, projectId, customPartResults]);

  const mapConfidence = (status, confidence) => {
    if (typeof confidence === 'number') {
      return confidence;
    }

    if (status === 'compatible') return 0.86;
    if (status === 'caution') return 0.64;
    if (status === 'incompatible') return 0.9;
    if (status === 'needs-info') return 0.35;
    if (status === 'probable') return 0.68;
    if (status === 'verify') return 0.55;
    return 0.58;
  };

  const normalizeAICompatibilityCards = (compatibilityResult, fallbackCards = []) => {
    const compatibilityItems = compatibilityResult?.compatibility || compatibilityResult?.checks || [];
    if (!Array.isArray(compatibilityItems) || compatibilityItems.length === 0) {
      return fallbackCards;
    }

    return compatibilityItems.map((entry, index) => ({
      id: entry.id || `compatibility-${index + 1}`,
      title: entry.title || entry.item || `Compatibility Check ${index + 1}`,
      status: entry.status || 'uncertain',
      confidence: mapConfidence(entry.status, entry.confidence),
      summary: entry.summary || `${entry.item || 'Item'} status is ${entry.status || 'uncertain'}.`,
      missingMeasurements: entry.missingMeasurements || [],
    }));
  };

  const linkItemToProject = (checklistItem) => {
    const linkedName = checklistItem?.recommendedItem?.name || checklistItem?.title || checklistItem?.id;
    if (!linkedName) {
      return linkedProjectItems;
    }

    let next = linkedProjectItems;
    setLinkedProjectItems((current) => {
      if (current.includes(linkedName)) {
        next = current;
        return current;
      }

      next = [...current, linkedName];
      return next;
    });

    return next;
  };

  const linkNameToProject = (name) => {
    if (!name) {
      return linkedProjectItems;
    }

    let next = linkedProjectItems;
    setLinkedProjectItems((current) => {
      if (current.includes(name)) {
        next = current;
        return current;
      }

      next = [...current, name];
      return next;
    });

    return next;
  };

  const rerunCompatibilityWithCart = async (baseReport, nextLinkedItems = linkedProjectItems) => {
    if (!baseReport?.aiPlan) {
      return baseReport;
    }

    const cart = projectCartService.getCart(projectId);

    try {
      const compatibilityResult = await runAITask('compatibilityCheck', {
        project: baseReport.profile,
        planSummary: baseReport.aiPlan.projectSummary,
        checklist: baseReport.aiPlan.checklist,
        linkedItems: nextLinkedItems,
        cart: cart.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          selectedProduct: item.selectedProduct
            ? {
                title: item.selectedProduct.title,
                totalPrice: item.selectedProduct.totalPrice,
                source: item.selectedProduct.source,
              }
            : null,
        })),
        fallbackData: {
          warnings: baseReport.compatibility?.warnings || [],
          missingMeasurements: baseReport.compatibility?.missingMeasurements || [],
          compatibility: (baseReport.compatibility?.compatibilityCards || []).map((card) => ({
            item: card.title,
            status: card.status,
            confidence: card.confidence,
            summary: card.summary,
            missingMeasurements: card.missingMeasurements || [],
          })),
        },
      });

      const nextCompatibility = {
        warnings: compatibilityResult.data?.warnings || baseReport.compatibility?.warnings || [],
        missingMeasurements: compatibilityResult.data?.missingMeasurements || baseReport.compatibility?.missingMeasurements || [],
        compatibilityCards: normalizeAICompatibilityCards(
          compatibilityResult.data,
          baseReport.compatibility?.compatibilityCards || []
        ),
      };

      return {
        ...baseReport,
        compatibility: nextCompatibility,
      };
    } catch (compatibilityError) {
      console.warn('Compatibility refresh failed; keeping previous compatibility cards.', compatibilityError);
      return baseReport;
    }
  };

  const addToCart = async (checklistItem) => {
    const recommendation = checklistItem.recommendedItem;
    if (!recommendation?.name) {
      return;
    }

    projectCartService.addItem(projectId, {
      name: recommendation.name,
      quantity: recommendation.quantity || 1,
      alternatives: [],
      category: checklistItem.category || 'Checklist',
      sourceType: 'checklist',
      notes: recommendation.description || '',
    });

    const nextLinkedItems = linkItemToProject(checklistItem);

    if (report) {
      const refreshed = await rerunCompatibilityWithCart(report, nextLinkedItems);
      setReport(refreshed);
    }
  };

  const addAllRecommendedToCart = async () => {
    const checklist = report?.aiPlan?.checklist || [];
    for (const item of checklist) {
      if (item.recommendedItem?.name) {
        await addToCart(item);
      }
    }
  };

  const addRecommendedPartToCart = async (part, selectedProduct = null) => {
    if (!part?.name) {
      return;
    }

    const normalizedSelectedProduct = selectedProduct
      ? {
          id: `${String(selectedProduct.source || 'market').toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`,
          title: selectedProduct.title || part.name,
          price: Number(selectedProduct.price || 0),
          shipping: Number(selectedProduct.shippingCost || 0),
          totalPrice: Number((selectedProduct.totalCost ?? selectedProduct.price) || 0),
          shippingCost: Number(selectedProduct.shippingCost || 0),
          totalCost: Number((selectedProduct.totalCost ?? selectedProduct.price) || 0),
          distance: Number.isFinite(Number(selectedProduct.distance)) ? Number(selectedProduct.distance) : null,
          type: selectedProduct.type === 'local' ? 'local' : 'online',
          score: Number.isFinite(Number(selectedProduct.score)) ? Number(selectedProduct.score) : undefined,
          explanation: Array.isArray(selectedProduct.explanation)
            ? selectedProduct.explanation.filter(Boolean).slice(0, 4)
            : undefined,
          image: selectedProduct.image || 'https://via.placeholder.com/240x240?text=Listing',
          source: ['amazon', 'ebay', 'local', 'offerup', 'marketcheck', 'facebook_marketplace', 'craigslist', 'google_places']
            .includes(String(selectedProduct.source).toLowerCase())
            ? String(selectedProduct.source).toLowerCase()
            : 'marketcheck',
          sourceLabel: selectedProduct.source || 'Marketplace',
          url: selectedProduct.url || '',
          videoReferences: Array.isArray(selectedProduct.videoReferences)
            ? selectedProduct.videoReferences
                .filter((ref) => ref && typeof ref === 'object' && ref.url)
                .slice(0, 2)
                .map((ref) => {
                  const url = String(ref.url || '');
                  let parsedVideoId = '';
                  try {
                    parsedVideoId = new URL(url).searchParams.get('v') || '';
                  } catch {
                    parsedVideoId = '';
                  }
                  const derivedVideoId = String(ref.videoId || '') || parsedVideoId;
                  return {
                    videoId: derivedVideoId,
                    url,
                    title: String(ref.title || 'Reference video'),
                    channelName: String(ref.channelName || ''),
                    matchConfidence: Number.isFinite(Number(ref.matchConfidence)) ? Number(ref.matchConfidence) : 0,
                    matchReason: String(ref.matchReason || ''),
                  };
                })
            : undefined,
        }
      : undefined;

    projectCartService.addItem(projectId, {
      name: part.name,
      quantity: 1,
      alternatives: [],
      selectedProduct: normalizedSelectedProduct,
      category: part.category || 'Recommended',
      sourceType: 'recommended',
      notes: part.description || part.reason || '',
    });

    const nextLinkedItems = linkNameToProject(part.name);

    if (report) {
      const refreshed = await rerunCompatibilityWithCart(report, nextLinkedItems);
      setReport(refreshed);
    }
  };

  const addRecommendedPartToProject = (part) => {
    if (!part?.name) {
      return;
    }

    linkNameToProject(part.name);
  };

  const analyzeCustomPart = async (input) => {
    if (!input?.itemName) {
      return;
    }

    setCustomAnalyzing(true);
    setCustomAnalysisError('');

    try {
      const result = await analyzeCustomPartCompatibility(input, formState);
      setCustomPartResults((current) => [result, ...current]);
    } catch (customError) {
      console.error('Custom analysis failed', customError);
      setCustomAnalysisError('Could not analyze this part right now. Please try again.');
    } finally {
      setCustomAnalyzing(false);
    }
  };

  const addCustomResultToCart = async (result) => {
    if (!result?.itemName) {
      return;
    }

    projectCartService.addItem(projectId, {
      name: result.itemName,
      quantity: 1,
      alternatives: [],
      category: result.category || 'Custom',
      sourceType: 'custom-analysis',
      notes: result.summary || '',
    });

    const nextLinkedItems = linkNameToProject(result.itemName);

    if (report) {
      const refreshed = await rerunCompatibilityWithCart(report, nextLinkedItems);
      setReport(refreshed);
    }
  };

  const replaceRecommendedPart = (result) => {
    if (!result?.itemName || !report?.aiPlan?.recommendedParts) {
      return;
    }

    setReport((current) => {
      if (!current?.aiPlan?.recommendedParts) {
        return current;
      }

      const parts = [...current.aiPlan.recommendedParts];
      const targetIndex = parts.findIndex((part) =>
        String(part.category || '').toLowerCase() === String(result.category || '').toLowerCase()
      );

      const replacement = {
        name: result.itemName,
        category: result.category || 'Custom',
        type: result.subsystem || 'custom',
        description: result.summary || 'Added from custom analysis.',
        reason: (result.reasons || [])[0] || 'Replacement from custom analysis.',
        estimatedPrice: 'Varies',
        priority: result.status === 'incompatible' ? 'optional' : 'required',
        fitmentConfidence: result.confidence || 0.6,
        universal: false,
        mustVerify: result.status !== 'compatible',
        exampleSearchQueries: [result.itemName, ...(result.recommendedAlternatives || [])].slice(0, 3),
      };

      if (targetIndex >= 0) {
        parts[targetIndex] = replacement;
      } else {
        parts.unshift(replacement);
      }

      return {
        ...current,
        aiPlan: {
          ...current.aiPlan,
          recommendedParts: parts.slice(0, 6),
        },
      };
    });
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError('');

    try {
      const nextReport = await generateBuildPlannerReport(formState);
      const refreshed = await rerunCompatibilityWithCart(nextReport, linkedProjectItems);
      setReport(refreshed);
      setCustomPartResults([]);
      setCustomAnalysisError('');
      setAnalysis({
        summary: refreshed.aiPlan?.projectSummary || 'No AI summary available.',
      });
    } catch (submissionError) {
      console.error('Build planner failed:', submissionError);
      setError('Could not generate build plan right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await runAnalysis();
  };

  const notePartOptions = useMemo(() => {
    return recommendedPartsWithDecisionIds.map((part, index) => ({
      id: part?.decisionId,
      name: part?.name || `Part ${index + 1}`,
      category: part?.category || 'general',
    }));
  }, [recommendedPartsWithDecisionIds]);

  const handleSaveProjectNote = (noteInput) => {
    const result = addSourcingNote({
      projectId,
      projectName: formState.projectName,
      url: noteInput?.url || '',
      title: noteInput?.title || '',
      category: noteInput?.category || 'general',
      partIds: Array.isArray(noteInput?.partIds) ? noteInput.partIds : [],
      comment: noteInput?.comment || '',
      price: noteInput?.price || null,
    });

    if (result?.added && result?.note?.relatedItemIds?.length) {
      result.note.relatedItemIds.forEach((id) => markItemPreferred(projectId, id));
    }

    return result;
  };

  const handleDeleteProjectNote = (noteId) => {
    removeSourcingNote(projectId, noteId);
  };

  return (
    <div className="bg-gradient-to-br from-cyan-50 via-white to-lime-50 px-4 py-6 lg:px-6">
      <div className="mx-auto flex w-full max-w-[1400px] gap-6">
        <div className="w-full space-y-6 lg:pr-[360px]">
        <section className="rounded-2xl border border-cyan-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Build Planner</h1>
          <p className="mt-2 text-slate-600">
            Plan a safe bike build with AI-generated checklist steps, compatibility review cards, and cart-ready recommendations.
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cyan-700">
            Project Cart ID: {projectId}
          </p>
        </section>

        <BuildPlannerInputForm value={formState} onChange={setFormState} onSubmit={handleSubmit} loading={loading} />

        <section className="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="rounded-xl bg-cyan-700 px-4 py-2 font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-cyan-300"
            >
              Re-analyze Build
            </button>

            <Link
              to="/saved-notes"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              Saved Parts / Notes
            </Link>
          </div>
        </section>

        {error && (
          <section className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-800">
            {error}
          </section>
        )}

        {report && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">AI Analysis</h2>
              <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                {analysis.summary || report.aiPlan.projectSummary}
              </pre>
              <p className="mt-3 text-sm text-slate-700">
                <span className="font-semibold">Build strategy:</span> {report.aiPlan.buildStrategy}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-semibold">Readiness:</span> {report.aiPlan.readinessScore}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-semibold">Next best action:</span> {report.aiPlan.nextBestAction}
              </p>

              {Array.isArray(report.aiPlan.donorBikeSuggestions) && report.aiPlan.donorBikeSuggestions.length > 0 && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">Donor Bike Suggestions</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {report.aiPlan.donorBikeSuggestions.map((entry) => (
                      <li key={entry.id}>
                        <span className="font-semibold">{entry.name}</span> - {entry.reason} ({(Number(entry.fitmentConfidence || 0) * 100).toFixed(0)}% fit)
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="mt-2 text-xs text-slate-500">
                AI Provider: {report.aiPlan.provider} • Model: {report.aiPlan.plannerVersion} • Generated: {new Date(report.generatedAt).toLocaleString()}
              </p>
            </section>

            <BuildPlannerChecklist
              checklist={report.aiPlan.checklist}
              onAddRecommended={addToCart}
              onAddAllRecommended={addAllRecommendedToCart}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <RecommendedPartsPanel
                parts={recommendedPartsWithDecisionIds}
                onAddToCart={addRecommendedPartToCart}
                onAddToProject={addRecommendedPartToProject}
                decisionStateMap={decisionStateMap}
                onMarkPreferred={(itemId) => markItemPreferred(projectId, itemId)}
                onClearPreferred={(itemId) => clearItemPreferred(projectId, itemId)}
                onToggleDeprioritized={(itemId, value) => setItemDeprioritized(projectId, itemId, value)}
              />

              <CustomPartAnalysisPanel
                onAnalyze={analyzeCustomPart}
                analyzing={customAnalyzing}
                analysisError={customAnalysisError}
                results={customPartResults}
                onAddToCart={addCustomResultToCart}
                onReplaceRecommended={replaceRecommendedPart}
              />
            </div>

            <BuildPlannerWarnings
              warnings={combinedWarnings}
              missingMeasurements={combinedMissingMeasurements}
            />

            <CartValidationStatus
              status={cartValidation.status}
              summary={cartValidation.summary}
              counts={cartValidation.counts}
            />

            <CompatibilityPanel />

            <BuildPlannerVisualizer placements={placements} />

            <BuildPlannerCompatibilityCards cards={combinedCompatibilityCards} />
          </>
        )}
        </div>

        <aside className="hidden lg:block">
          <div className="fixed right-6 top-6 w-[340px]">
            <div className="max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
              <BuildPlannerNotesPanel
                projectKey={projectId}
                notes={projectNotes}
                parts={notePartOptions}
                onSaveNote={handleSaveProjectNote}
                onDeleteNote={handleDeleteProjectNote}
                onMarkPreferred={(itemId) => markItemPreferred(projectId, itemId)}
                onClearPreferred={(itemId) => clearItemPreferred(projectId, itemId)}
              />
            </div>
          </div>
        </aside>
      </div>

      <div className="mx-auto mt-4 w-full max-w-[1400px] lg:hidden">
        <BuildPlannerNotesPanel
          projectKey={projectId}
          notes={projectNotes}
          parts={notePartOptions}
          onSaveNote={handleSaveProjectNote}
          onDeleteNote={handleDeleteProjectNote}
          onMarkPreferred={(itemId) => markItemPreferred(projectId, itemId)}
          onClearPreferred={(itemId) => clearItemPreferred(projectId, itemId)}
        />
      </div>
    </div>
  );
}
