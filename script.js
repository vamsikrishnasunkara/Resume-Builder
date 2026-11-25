/* ============================================================
   Resume Studio — script.js
   Faithful recreation of Canva "Purple & White Modern Student CV"
   - Live real-time preview matching Canva template (Image 4 & Image 2)
   - Profile photo upload with circular crop containment
   - Individual Section-by-Section Font Sizing & Typography Controls
   - Design Movement & Resizing (Photo, Capsule, Rays) with Drag & Sliders
   - "Fill Page" & Spacing presets
   - Hipolabs Universities & Photon City autocompletes
   - Interactive skill tags & quick suggestions
   - Multi-entry repeat cards (Education, Experience, Projects)
   - LocalStorage auto-save & state restoration
   ============================================================ */
'use strict';

const $ = (selector, ctx = document) => ctx.querySelector(selector);
const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

// ── DOM References ───────────────────────────────────────────
const form            = $('#resume-form');
const printBtn        = $('#print-button');
const clearBtn        = $('#clear-btn');
const savedEl         = $('#saved-status');
const quoteEl         = $('#quote-text');
const quoteAuthorEl   = $('#quote-author');
const progressFill    = $('#progress-fill');
const progressPct     = $('#progress-pct');
const atsBadge        = $('#ats-badge');
const avatarPreviewImg= $('#avatar-preview-img');
const avatarFileInput = $('#avatar-file-input');
const avatarUploadWrap= $('#avatar-upload-wrap');
const resumeAvatarImg = $('#resume-avatar-img');
const resumePaper     = $('#resume-preview');
const itemPill        = $('#canvas-item-pill');

// Default Canva portrait image (matches Image 4)
const DEFAULT_AVATAR_URL = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

// ── Storage Keys ─────────────────────────────────────────────
const STORAGE_KEY = 'resumeStudio_canva_v1';
const STYLE_STORAGE_KEY = 'resumeStudio_canva_element_styles_v2';

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Storage save failed:', err);
  }
}
function loadFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

let _saveTimeout;
function debouncedSave() {
  clearTimeout(_saveTimeout);
  _saveTimeout = setTimeout(() => {
    saveToStorage(collectFormData());
    flashSavedIndicator();
  }, 600);
}

function flashSavedIndicator() {
  if (!savedEl) return;
  savedEl.textContent = '✓ Saved to browser';
  clearTimeout(savedEl._timer);
  savedEl._timer = setTimeout(() => {
    savedEl.textContent = 'Your resume is saved on this device';
  }, 2200);
}

// ── Debounce Helper ──────────────────────────────────────────
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ── Escape HTML ──────────────────────────────────────────────
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Color Theme Management ───────────────────────────────────
let currentTheme = localStorage.getItem('rs_canva_theme') || 'purple';

function applyTheme(theme) {
  currentTheme = theme;
  document.body.dataset.theme = theme;
  localStorage.setItem('rs_canva_theme', theme);

  $$('.template-dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.theme === theme);
  });

  const themeColors = {
    purple:  '#21092F',
    indigo:  '#161642',
    emerald: '#063d2e',
    rose:    '#4a0720',
    slate:   '#111827'
  };
  const strokeColor = themeColors[theme] || '#21092F';
  $$('.sunburst-lines line').forEach(line => line.setAttribute('stroke', strokeColor));
}

// ══════════════════════════════════════════════════════════════
// ████████  INDIVIDUAL ELEMENT STYLES & DESIGN CONFIG ████████
// ══════════════════════════════════════════════════════════════

const defaultElementStyles = {
  // Global
  fontScale: 1.0,
  sectionGap: '5.5mm',
  fontFamily: "'Montserrat', sans-serif",

  // Per-section font sizes in pt
  nameSize: 26,
  titleSize: 7.5,
  headingsSize: 11,
  aboutSize: 8,
  skillsSize: 8,
  eduSize: 7.5,
  expSize: 7.5,
  langSize: 8,
  projSize: 8.5,
  contactSize: 7.2,

  // Per-section bold & italic overrides
  boldOverrides: {},
  italicOverrides: {},

  // Design elements (Image 2 Canva geometry)
  photoSize: 38,      // mm
  photoX: 22,         // mm
  photoY: 6.5,        // mm

  pillWidth: 98,      // mm (stretches to touch sunburst lines)
  pillHeight: 35,     // mm
  pillX: -12,         // mm
  pillY: 8,           // mm

  raysWidth: 78,      // mm
  raysHeight: 56,     // mm
  raysX: -4,          // mm
  raysY: -4           // mm
};

let elementStyles = { ...defaultElementStyles };

function loadStylesFromStorage() {
  try {
    const saved = JSON.parse(localStorage.getItem(STYLE_STORAGE_KEY));
    if (saved && typeof saved === 'object') {
      elementStyles = {
        ...defaultElementStyles,
        ...saved,
        boldOverrides: { ...(saved.boldOverrides || {}) },
        italicOverrides: { ...(saved.italicOverrides || {}) }
      };
      // Auto-upgrade older test dimensions to ensure Canva Image 2 connection
      if (elementStyles.pillWidth < 90) elementStyles.pillWidth = 98;
      if (elementStyles.photoX < 15) elementStyles.photoX = 22;
      if (elementStyles.raysWidth < 65) elementStyles.raysWidth = 78;
    }
  } catch {}
}

function saveStylesToStorage() {
  try {
    localStorage.setItem(STYLE_STORAGE_KEY, JSON.stringify(elementStyles));
  } catch {}
}

function applyStylesToPreview() {
  const root = document.documentElement;

  // Global scale & gaps
  root.style.setProperty('--rv-font-scale', elementStyles.fontScale);
  root.style.setProperty('--rv-section-gap', elementStyles.sectionGap);
  const gapNum = parseFloat(elementStyles.sectionGap);
  root.style.setProperty('--rv-main-section-gap', (gapNum * 0.9).toFixed(1) + 'mm');
  root.style.setProperty('--rv-font-family-head', elementStyles.fontFamily);

  // Individual Font Sizes
  root.style.setProperty('--rv-name-size', `${elementStyles.nameSize}pt`);
  root.style.setProperty('--rv-title-badge-size', `${elementStyles.titleSize}pt`);
  root.style.setProperty('--rv-sidebar-heading-size', `${elementStyles.headingsSize * 0.78}pt`);
  root.style.setProperty('--rv-main-heading-size', `${elementStyles.headingsSize}pt`);
  root.style.setProperty('--rv-about-size', `${elementStyles.aboutSize}pt`);
  root.style.setProperty('--rv-skills-size', `${elementStyles.skillsSize}pt`);
  root.style.setProperty('--rv-edu-title-size', `${elementStyles.eduSize}pt`);
  root.style.setProperty('--rv-edu-body-size', `${(elementStyles.eduSize * 0.94).toFixed(1)}pt`);
  root.style.setProperty('--rv-exp-title-size', `${elementStyles.expSize}pt`);
  root.style.setProperty('--rv-exp-body-size', `${(elementStyles.expSize * 0.94).toFixed(1)}pt`);
  root.style.setProperty('--rv-lang-size', `${elementStyles.langSize}pt`);
  root.style.setProperty('--rv-proj-title-size', `${elementStyles.projSize}pt`);
  root.style.setProperty('--rv-proj-desc-size', `${(elementStyles.projSize * 0.88).toFixed(1)}pt`);
  root.style.setProperty('--rv-contact-size', `${elementStyles.contactSize}pt`);

  // Design elements (Photo, Pill, Rays)
  root.style.setProperty('--rv-avatar-size', `${elementStyles.photoSize}mm`);
  root.style.setProperty('--rv-avatar-left', `${elementStyles.photoX}mm`);
  root.style.setProperty('--rv-avatar-top', `${elementStyles.photoY}mm`);

  root.style.setProperty('--rv-pill-width', `${elementStyles.pillWidth}mm`);
  root.style.setProperty('--rv-pill-height', `${elementStyles.pillHeight}mm`);
  root.style.setProperty('--rv-pill-left', `${elementStyles.pillX}mm`);
  root.style.setProperty('--rv-pill-top', `${elementStyles.pillY}mm`);

  root.style.setProperty('--rv-sunburst-width', `${elementStyles.raysWidth}mm`);
  root.style.setProperty('--rv-sunburst-height', `${elementStyles.raysHeight || 56}mm`);
  root.style.setProperty('--rv-sunburst-right', `${elementStyles.raysX}mm`);
  root.style.setProperty('--rv-sunburst-top', `${elementStyles.raysY}mm`);

  // Dynamic Typography Overrides
  applyTypographyOverrides();

  // Update inputs in the editor panel
  syncEditorControlValues();
  updateTargetBadge();
  updateGizmo();
  saveStylesToStorage();
}

function applyTypographyOverrides() {
  const isBold = target => Boolean(elementStyles.boldOverrides?.[target]);
  const isItalic = target => Boolean(elementStyles.italicOverrides?.[target]);

  const nameEl = $('#preview-name');
  if (nameEl) {
    nameEl.style.fontWeight = isBold('name') ? '900' : '800';
    nameEl.style.fontStyle = isItalic('name') ? 'italic' : 'normal';
  }

  const titleEl = $('#preview-title-badge');
  if (titleEl) {
    titleEl.style.fontWeight = isBold('title') ? '900' : '600';
    titleEl.style.fontStyle = isItalic('title') ? 'italic' : 'normal';
  }

  const aboutEl = $('#preview-summary');
  if (aboutEl) {
    aboutEl.style.fontWeight = isBold('about') ? '700' : '400';
    aboutEl.style.fontStyle = isItalic('about') ? 'italic' : 'normal';
  }

  const skillsEl = $('#preview-skills');
  if (skillsEl) {
    skillsEl.style.fontWeight = isBold('skills') ? '700' : '400';
    skillsEl.style.fontStyle = isItalic('skills') ? 'italic' : 'normal';
  }

  const eduEl = $('#preview-education');
  if (eduEl) {
    eduEl.style.fontWeight = isBold('education') ? '700' : '400';
    eduEl.style.fontStyle = isItalic('education') ? 'italic' : 'normal';
  }

  const expEl = $('#preview-experience');
  if (expEl) {
    expEl.style.fontWeight = isBold('experience') ? '700' : '400';
    expEl.style.fontStyle = isItalic('experience') ? 'italic' : 'normal';
  }

  const langEl = $('#preview-languages');
  if (langEl) {
    langEl.style.fontWeight = isBold('languages') ? '700' : '400';
    langEl.style.fontStyle = isItalic('languages') ? 'italic' : 'normal';
  }

  const projEl = $('#preview-projects');
  if (projEl) {
    projEl.style.fontWeight = isBold('projects') ? '700' : '400';
    projEl.style.fontStyle = isItalic('projects') ? 'italic' : 'normal';
  }

  const contactEl = $('#preview-contact');
  if (contactEl) {
    contactEl.style.fontWeight = isBold('contact') ? '700' : '400';
    contactEl.style.fontStyle = isItalic('contact') ? 'italic' : 'normal';
  }

  $$('.sidebar-section-title, .main-section-title').forEach(h => {
    h.style.fontWeight = isBold('headings') ? '900' : '800';
    h.style.fontStyle = isItalic('headings') ? 'italic' : 'normal';
  });

  const bActive = isBold(currentTarget);
  const iActive = isItalic(currentTarget);
  $('#qbtn-target-bold')?.classList.toggle('active', bActive);
  $('#cip-btn-bold')?.classList.toggle('active', bActive);
  $('#qbtn-target-italic')?.classList.toggle('active', iActive);
  $('#cip-btn-italic')?.classList.toggle('active', iActive);
}

function syncEditorControlValues() {
  const gapLabels = { '3.5mm': 'Compact', '5.5mm': 'Normal', '8.5mm': 'Spacious', '11.5mm': 'Fill Page' };
  const lgap = $('#label-section-gap');
  if (lgap) lgap.textContent = gapLabels[elementStyles.sectionGap] || 'Normal';

  $$('.preset-btn, .quick-btn').forEach(btn => {
    if (btn.dataset.gap) {
      btn.classList.toggle('active', btn.dataset.gap === elementStyles.sectionGap);
    }
  });

  const qFontSelect = $('#quick-font-select');
  if (qFontSelect) qFontSelect.value = elementStyles.fontFamily;

  $$('.cursor-target-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === currentTarget);
  });
  $$('.cip-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === currentTarget);
  });
}

// ── Target Element Selection for Individual Editing ───────────
let currentTarget = 'name';

function setTarget(targetName, triggerElement = null) {
  currentTarget = targetName;
  const select = $('#target-element-select');
  if (select) select.value = targetName;

  // Highlight selected element on canvas
  $$('.selectable-item').forEach(el => el.classList.remove('selected-item'));
  if (triggerElement) {
    triggerElement.classList.add('selected-item');
    positionItemPill(triggerElement, targetName);
  } else {
    const el = $(`[data-target="${targetName}"]`);
    if (el) {
      el.classList.add('selected-item');
      positionItemPill(el, targetName);
    } else if (itemPill) {
      itemPill.classList.remove('visible');
    }
  }

  updateTargetBadge();
  updateGizmo();
  syncEditorControlValues();
}

function positionItemPill(targetEl, targetName) {
  if (!itemPill || !targetEl || !resumePaper?.contains(targetEl)) return;

  const rect = targetEl.getBoundingClientRect();
  const tagNames = {
    name: 'Name', title: 'Title', headings: 'Headings', about: 'About Me',
    skills: 'Skills', education: 'Education', experience: 'Experience',
    languages: 'Language', projects: 'Projects', contact: 'Contact',
    photo: 'Photo', pill: 'Capsule', rays: 'Rays', all: 'All'
  };

  const tagEl = $('#cip-tag');
  if (tagEl) tagEl.textContent = tagNames[targetName] || targetName;

  const valEl = $('#cip-val');
  if (valEl) valEl.textContent = getTargetValueString(targetName);

  const isDesign = (targetName === 'photo' || targetName === 'pill' || targetName === 'rays');
  const switcher = $('#cip-design-switcher');
  if (switcher) switcher.classList.toggle('visible', isDesign);

  const panel = $('.preview-panel');
  if (!panel) return;
  const panelRect = panel.getBoundingClientRect();
  let top = (rect.top - panelRect.top) + panel.scrollTop - 44;
  let left = (rect.left - panelRect.left) + panel.scrollLeft + (rect.width / 2) - (isDesign ? 130 : 85);

  if (top < panel.scrollTop + 8) {
    top = (rect.bottom - panelRect.top) + panel.scrollTop + 10;
  }
  if (left < panel.scrollLeft + 8) {
    left = panel.scrollLeft + 8;
  }

  itemPill.style.top = `${top}px`;
  itemPill.style.left = `${left}px`;
  itemPill.classList.add('visible');
}

function getTargetValueString(target) {
  switch (target) {
    case 'name': return `${elementStyles.nameSize} pt`;
    case 'title': return `${elementStyles.titleSize} pt`;
    case 'headings': return `${elementStyles.headingsSize} pt`;
    case 'about': return `${elementStyles.aboutSize} pt`;
    case 'skills': return `${elementStyles.skillsSize} pt`;
    case 'education': return `${elementStyles.eduSize} pt`;
    case 'experience': return `${elementStyles.expSize} pt`;
    case 'languages': return `${elementStyles.langSize} pt`;
    case 'projects': return `${elementStyles.projSize} pt`;
    case 'contact': return `${elementStyles.contactSize} pt`;
    case 'photo': return `${elementStyles.photoSize} mm`;
    case 'pill': return `${elementStyles.pillWidth} mm`;
    case 'rays': return `${elementStyles.raysWidth} mm`;
    case 'all': return `${Math.round(elementStyles.fontScale * 100)}%`;
    default: return `${elementStyles.nameSize} pt`;
  }
}

function updateTargetBadge() {
  const str = getTargetValueString(currentTarget);
  const qbadge = $('#qbadge-target-size');
  const cipVal = $('#cip-val');
  if (qbadge) qbadge.textContent = str;
  if (cipVal) cipVal.textContent = str;
}

function toggleTargetBold() {
  elementStyles.boldOverrides = elementStyles.boldOverrides || {};
  elementStyles.boldOverrides[currentTarget] = !elementStyles.boldOverrides[currentTarget];
  applyStylesToPreview();
  showToast(`${currentTarget.toUpperCase()}: Bold ${elementStyles.boldOverrides[currentTarget] ? 'ON' : 'OFF'}`);
}

function toggleTargetItalic() {
  elementStyles.italicOverrides = elementStyles.italicOverrides || {};
  elementStyles.italicOverrides[currentTarget] = !elementStyles.italicOverrides[currentTarget];
  applyStylesToPreview();
  showToast(`${currentTarget.toUpperCase()}: Italic ${elementStyles.italicOverrides[currentTarget] ? 'ON' : 'OFF'}`);
}

function changeTargetSize(delta) {
  const tagNames = {
    name: 'Candidate Name', title: 'Title Badge', headings: 'Section Headings',
    about: 'About Me', skills: 'Skills', education: 'Education',
    experience: 'Experience', languages: 'Languages', projects: 'Projects',
    contact: 'Contact Info', photo: 'Photo Size', pill: 'Capsule Width',
    rays: 'Sunburst Rays Size', all: 'Document Scale'
  };

  switch (currentTarget) {
    case 'name':
      elementStyles.nameSize = Math.max(16, Math.min(42, Math.round((elementStyles.nameSize + delta) * 10) / 10));
      break;
    case 'title':
      elementStyles.titleSize = Math.max(6, Math.min(18, Math.round((elementStyles.titleSize + delta * 0.5) * 10) / 10));
      break;
    case 'headings':
      elementStyles.headingsSize = Math.max(8, Math.min(22, Math.round((elementStyles.headingsSize + delta) * 10) / 10));
      break;
    case 'about':
      elementStyles.aboutSize = Math.max(6.5, Math.min(18, Math.round((elementStyles.aboutSize + delta * 0.5) * 10) / 10));
      break;
    case 'skills':
      elementStyles.skillsSize = Math.max(6.5, Math.min(18, Math.round((elementStyles.skillsSize + delta * 0.5) * 10) / 10));
      break;
    case 'education':
      elementStyles.eduSize = Math.max(6, Math.min(16, Math.round((elementStyles.eduSize + delta * 0.5) * 10) / 10));
      break;
    case 'experience':
      elementStyles.expSize = Math.max(6, Math.min(16, Math.round((elementStyles.expSize + delta * 0.5) * 10) / 10));
      break;
    case 'languages':
      elementStyles.langSize = Math.max(6.5, Math.min(18, Math.round((elementStyles.langSize + delta * 0.5) * 10) / 10));
      break;
    case 'projects':
      elementStyles.projSize = Math.max(6.5, Math.min(18, Math.round((elementStyles.projSize + delta * 0.5) * 10) / 10));
      break;
    case 'contact':
      elementStyles.contactSize = Math.max(6, Math.min(16, Math.round((elementStyles.contactSize + delta * 0.5) * 10) / 10));
      break;
    case 'photo':
      elementStyles.photoSize = Math.max(18, Math.min(65, Math.round((elementStyles.photoSize + delta * 2) * 10) / 10));
      break;
    case 'pill':
      elementStyles.pillWidth = Math.max(40, Math.min(140, Math.round((elementStyles.pillWidth + delta * 3) * 10) / 10));
      break;
    case 'rays':
      elementStyles.raysWidth = Math.max(30, Math.min(145, Math.round((elementStyles.raysWidth + delta * 3) * 10) / 10));
      elementStyles.raysHeight = Math.max(25, Math.min(120, Math.round(((elementStyles.raysHeight || 56) + delta * 2) * 10) / 10));
      break;
    case 'all':
      elementStyles.fontScale = Math.max(0.8, Math.min(1.4, Math.round((elementStyles.fontScale + delta * 0.05) * 100) / 100));
      break;
  }
  applyStylesToPreview();
  showToast(`${tagNames[currentTarget] || currentTarget}: ${getTargetValueString(currentTarget)}`);
}

function initIndividualStyleControls() {
  loadStylesFromStorage();
  applyStylesToPreview();

  // Target dropdown change
  $('#target-element-select')?.addEventListener('change', e => {
    setTarget(e.target.value);
  });

  // Size buttons in Quick Bar
  $('#qbtn-target-up')?.addEventListener('click', () => changeTargetSize(+1));
  $('#qbtn-target-down')?.addEventListener('click', () => changeTargetSize(-1));

  // Size buttons in Floating Item Pill
  $('#cip-btn-up')?.addEventListener('click', () => changeTargetSize(+1));
  $('#cip-btn-down')?.addEventListener('click', () => changeTargetSize(-1));

  // Bold & Italic Toggles
  $('#qbtn-target-bold')?.addEventListener('click', toggleTargetBold);
  $('#cip-btn-bold')?.addEventListener('click', toggleTargetBold);
  $('#qbtn-target-italic')?.addEventListener('click', toggleTargetItalic);
  $('#cip-btn-italic')?.addEventListener('click', toggleTargetItalic);

  // Quick Design Switcher buttons (Sidebar & Floating Pill)
  document.addEventListener('click', e => {
    const targetBtn = e.target.closest('.cursor-target-btn, .cip-tab-btn');
    if (targetBtn && targetBtn.dataset.target) {
      e.stopPropagation();
      setTarget(targetBtn.dataset.target);
      return;
    }

    const selectable = e.target.closest('.selectable-item');
    if (selectable && resumePaper?.contains(selectable)) {
      const targetName = selectable.dataset.target || 'name';
      setTarget(targetName, selectable);
    } else if (!e.target.closest('#canvas-item-pill') && !e.target.closest('#quick-style-bar') && !e.target.closest('#styles-section') && !e.target.closest('#design-transform-gizmo')) {
      // Clear selection if clicking outside
      $$('.selectable-item').forEach(el => el.classList.remove('selected-item'));
      itemPill?.classList.remove('visible');
      $('#design-transform-gizmo')?.classList.remove('active');
    }
  });

  // Fit Page spacing presets
  $('#qbtn-gap-tight')?.addEventListener('click', () => { elementStyles.sectionGap = '3.5mm'; applyStylesToPreview(); });
  $('#qbtn-gap-normal')?.addEventListener('click', () => { elementStyles.sectionGap = '5.5mm'; applyStylesToPreview(); });
  $('#qbtn-gap-fill')?.addEventListener('click', () => {
    elementStyles.sectionGap = '11.5mm';
    applyStylesToPreview();
    showToast('Section spacing expanded to fill A4 page ✨');
  });

  $$('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.gap) {
        elementStyles.sectionGap = btn.dataset.gap;
        applyStylesToPreview();
      }
    });
  });

  // Font typography selector
  $('#quick-font-select')?.addEventListener('change', e => {
    elementStyles.fontFamily = e.target.value;
    applyStylesToPreview();
  });

  // Snap to Canva Perfect Match (Image 2)
  $('#btn-snap-canva')?.addEventListener('click', () => {
    elementStyles.photoSize = 38;
    elementStyles.photoX = 22;
    elementStyles.photoY = 6.5;

    elementStyles.pillWidth = 98;
    elementStyles.pillHeight = 35;
    elementStyles.pillX = -12;
    elementStyles.pillY = 8;

    elementStyles.raysWidth = 78;
    elementStyles.raysHeight = 56;
    elementStyles.raysX = -4;
    elementStyles.raysY = -4;

    applyStylesToPreview();
    showToast('✨ Snapped design to exact Canva Image 2 alignment!');
  });

  // Directional Nudge / Move with Cursor Clicks on Floating Pill
  $('#cip-move-left')?.addEventListener('click', () => nudgeTarget(-1, 0));
  $('#cip-move-right')?.addEventListener('click', () => nudgeTarget(1, 0));
  $('#cip-move-up')?.addEventListener('click', () => nudgeTarget(0, -1));
  $('#cip-move-down')?.addEventListener('click', () => nudgeTarget(0, 1));

  // Direct Drag & Resize on Canvas with Cursor
  initCanvasDrag();
}

function nudgeTarget(dx, dy) {
  if (currentTarget === 'photo') {
    elementStyles.photoX = Math.round((elementStyles.photoX + dx) * 10) / 10;
    elementStyles.photoY = Math.round((elementStyles.photoY + dy) * 10) / 10;
  } else if (currentTarget === 'pill') {
    elementStyles.pillX = Math.round((elementStyles.pillX + dx) * 10) / 10;
    elementStyles.pillY = Math.round((elementStyles.pillY + dy) * 10) / 10;
  } else if (currentTarget === 'rays') {
    elementStyles.raysX = Math.round((elementStyles.raysX - dx) * 10) / 10;
    elementStyles.raysY = Math.round((elementStyles.raysY + dy) * 10) / 10;
  }
  applyStylesToPreview();
  updateGizmo();
}

// ── Interactive Transform Gizmo (Snaps to Exact Element Bounds) ──
function updateGizmo() {
  const gizmo = $('#design-transform-gizmo');
  const gizmoLabel = $('#gizmo-label');
  const headerGraphic = $('.resume-header-graphic');
  if (!gizmo || !headerGraphic) return;

  if (currentTarget !== 'photo' && currentTarget !== 'pill' && currentTarget !== 'rays') {
    gizmo.classList.remove('active');
    return;
  }

  const avatarFrame = $('#avatar-photo-frame');
  const pillEl      = $('#lavender-pill');
  const sunburstRays= $('#sunburst-rays-svg');
  const targetEl    = currentTarget === 'photo' ? avatarFrame : (currentTarget === 'pill' ? pillEl : sunburstRays);
  if (!targetEl) return;

  const elRect = targetEl.getBoundingClientRect();
  const headerRect = headerGraphic.getBoundingClientRect();

  const topPx    = elRect.top - headerRect.top;
  const leftPx   = elRect.left - headerRect.left;
  const widthPx  = elRect.width;
  const heightPx = elRect.height;

  gizmo.style.top    = `${topPx}px`;
  gizmo.style.left   = `${leftPx}px`;
  gizmo.style.width  = `${widthPx}px`;
  gizmo.style.height = `${heightPx}px`;

  const labels = { photo: 'Profile Photo', pill: 'Lavender Capsule', rays: 'Sunburst Rays' };
  if (gizmoLabel) gizmoLabel.textContent = labels[currentTarget] || 'Design Element';
  gizmo.classList.add('active');
}

// ── Direct Cursor Move & Resize on Canvas (Canva-style Interaction) ──
function initCanvasDrag() {
  const avatarFrame = $('#avatar-photo-frame');
  const pillEl      = $('#lavender-pill');
  const sunburstRays= $('#sunburst-rays-svg');
  const gizmo       = $('#design-transform-gizmo');
  const gizmoMove   = $('#gizmo-move-handle');

  function getPxPerMm() {
    const paper = $('#resume-preview');
    return (paper ? paper.getBoundingClientRect().width : 794) / 210;
  }

  // 1. Move Function: drag element or gizmo top handle anywhere with cursor
  function startMoveDrag(e, forcedTarget = null) {
    if (e.button !== 0) return;
    if (forcedTarget) setTarget(forcedTarget);
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const pxPerMm = getPxPerMm();

    const startPhotoX = elementStyles.photoX;
    const startPhotoY = elementStyles.photoY;
    const startPillX  = elementStyles.pillX;
    const startPillY  = elementStyles.pillY;
    const startRaysX  = elementStyles.raysX;
    const startRaysY  = elementStyles.raysY;

    document.body.style.userSelect = 'none';

    function onMouseMove(moveEvent) {
      const dxMm = (moveEvent.clientX - startX) / pxPerMm;
      const dyMm = (moveEvent.clientY - startY) / pxPerMm;

      if (currentTarget === 'photo') {
        elementStyles.photoX = Math.round((startPhotoX + dxMm) * 10) / 10;
        elementStyles.photoY = Math.round((startPhotoY + dyMm) * 10) / 10;
      } else if (currentTarget === 'pill') {
        elementStyles.pillX = Math.round((startPillX + dxMm) * 10) / 10;
        elementStyles.pillY = Math.round((startPillY + dyMm) * 10) / 10;
      } else if (currentTarget === 'rays') {
        elementStyles.raysX = Math.round((startRaysX - dxMm) * 10) / 10;
        elementStyles.raysY = Math.round((startRaysY + dyMm) * 10) / 10;
      }

      applyStylesToPreview();
      updateGizmo();
    }

    function onMouseUp() {
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      const targetEl = currentTarget === 'photo' ? avatarFrame : (currentTarget === 'pill' ? pillEl : sunburstRays);
      if (targetEl) positionItemPill(targetEl, currentTarget);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // Move handle on top of gizmo
  gizmoMove?.addEventListener('mousedown', e => startMoveDrag(e));

  // Direct mousedown on elements selects them and immediately allows moving with cursor
  avatarFrame?.addEventListener('mousedown', e => startMoveDrag(e, 'photo'));
  pillEl?.addEventListener('mousedown', e => startMoveDrag(e, 'pill'));
  sunburstRays?.addEventListener('mousedown', e => startMoveDrag(e, 'rays'));

  // 2. Resize Function: Pull corner or edge handles to decrease / increase size with cursor
  $$('.gizmo-handle', gizmo).forEach(handleEl => {
    handleEl.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const handleType = handleEl.dataset.handle;
      const startX = e.clientX;
      const startY = e.clientY;
      const pxPerMm = getPxPerMm();

      const startPhotoSize = elementStyles.photoSize;
      const startPillW     = elementStyles.pillWidth;
      const startPillH     = elementStyles.pillHeight;
      const startRaysW     = elementStyles.raysWidth;
      const startRaysH     = elementStyles.raysHeight || 56;

      document.body.style.userSelect = 'none';

      function onResizeMove(moveEvent) {
        const dxMm = (moveEvent.clientX - startX) / pxPerMm;
        const dyMm = (moveEvent.clientY - startY) / pxPerMm;

        const multX = handleType.includes('e') ? 1 : (handleType.includes('w') ? -1 : 0);
        const multY = handleType.includes('s') ? 1 : (handleType.includes('n') ? -1 : 0);

        if (currentTarget === 'photo') {
          // Proportional corner resize for photo
          const delta = (dxMm * (multX || 1) + dyMm * (multY || 1)) * 0.65;
          elementStyles.photoSize = Math.max(18, Math.min(65, Math.round((startPhotoSize + delta) * 10) / 10));
        } else if (currentTarget === 'pill') {
          // Width stretching
          if (handleType === 'e' || handleType.includes('e')) {
            elementStyles.pillWidth = Math.max(35, Math.min(145, Math.round((startPillW + dxMm) * 10) / 10));
          } else if (handleType.includes('w')) {
            elementStyles.pillWidth = Math.max(35, Math.min(145, Math.round((startPillW - dxMm) * 10) / 10));
          }
          // Height resizing
          if (handleType === 's' || handleType.includes('s')) {
            elementStyles.pillHeight = Math.max(20, Math.min(60, Math.round((startPillH + dyMm) * 10) / 10));
          } else if (handleType.includes('n')) {
            elementStyles.pillHeight = Math.max(20, Math.min(60, Math.round((startPillH - dyMm) * 10) / 10));
          }
        } else if (currentTarget === 'rays') {
          // Sunburst rays increase / decrease spread and height with cursor
          const deltaW = (multX || 1) * dxMm;
          const deltaH = (multY || 1) * dyMm;
          if (handleType === 'e' || handleType.includes('e') || handleType.includes('w')) {
            elementStyles.raysWidth = Math.max(30, Math.min(150, Math.round((startRaysW + deltaW) * 10) / 10));
          }
          if (handleType === 's' || handleType.includes('s') || handleType.includes('n')) {
            elementStyles.raysHeight = Math.max(25, Math.min(130, Math.round((startRaysH + deltaH) * 10) / 10));
          }
        }

        applyStylesToPreview();
        updateGizmo();
      }

      function onResizeUp() {
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onResizeMove);
        document.removeEventListener('mouseup', onResizeUp);
        const targetEl = currentTarget === 'photo' ? avatarFrame : (currentTarget === 'pill' ? pillEl : sunburstRays);
        if (targetEl) positionItemPill(targetEl, currentTarget);
      }

      document.addEventListener('mousemove', onResizeMove);
      document.addEventListener('mouseup', onResizeUp);
    });
  });
}

// ── Autocomplete API Services ────────────────────────────────
async function fetchUniversities(query) {
  if (!query || query.length < 2) return [];
  try {
    const url = `https://universities.hipolabs.com/search?name=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.slice(0, 6);
  } catch {
    return [];
  }
}

async function fetchLocations(query) {
  if (!query || query.length < 2) return [];
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).map(f => {
      const p = f.properties || {};
      const parts = [p.name, p.state, p.country].filter(Boolean);
      return { display: parts.join(', ') };
    });
  } catch {
    return [];
  }
}

function createAutocomplete({ inputEl, fetchFn, renderItem, onSelect, minChars = 2 }) {
  const wrap = inputEl.closest('.autocomplete-wrap') || inputEl.parentElement;
  let dropdown = null;
  let results = [];
  let activeIdx = -1;

  function close() {
    if (dropdown) { dropdown.remove(); dropdown = null; }
    results = [];
    activeIdx = -1;
  }

  function open(items) {
    close();
    if (!items.length) return;
    results = items;
    dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';

    items.forEach((item, i) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'autocomplete-item';
      itemEl.innerHTML = renderItem(item);
      itemEl.addEventListener('mousedown', e => {
        e.preventDefault();
        onSelect(results[i], inputEl);
        close();
      });
      dropdown.appendChild(itemEl);
    });

    wrap.appendChild(dropdown);
  }

  const debouncedFetch = debounce(async () => {
    const val = inputEl.value.trim();
    if (val.length < minChars) { close(); return; }
    const items = await fetchFn(val);
    open(items);
  }, 280);

  inputEl.addEventListener('input', debouncedFetch);
  inputEl.addEventListener('blur', () => setTimeout(close, 200));
  inputEl.addEventListener('keydown', e => {
    if (!dropdown) return;
    const items = $$('.autocomplete-item', dropdown);
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = (activeIdx + 1) % items.length;
      items.forEach(el => el.classList.remove('active'));
      items[activeIdx].classList.add('active');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = (activeIdx - 1 + items.length) % items.length;
      items.forEach(el => el.classList.remove('active'));
      items[activeIdx].classList.add('active');
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      onSelect(results[activeIdx], inputEl);
      close();
    } else if (e.key === 'Escape') {
      close();
    }
  });
}

// ── Motivational Quote ───────────────────────────────────────
async function loadMotivationalQuote() {
  if (!quoteEl) return;
  try {
    const r = await fetch('https://api.quotable.io/quotes/random?tags=motivational|success|technology');
    if (!r.ok) throw new Error();
    const [q] = await r.json();
    quoteEl.textContent = `"${q.content}"`;
    if (quoteAuthorEl) quoteAuthorEl.textContent = `— ${q.author}`;
  } catch {
    quoteEl.textContent = '"Your resume is the first chapter of your success story."';
    if (quoteAuthorEl) quoteAuthorEl.textContent = '— Resume Studio';
  }
}

// ── Profile Photo Upload Handling ────────────────────────────
let currentAvatarDataUrl = '';

function initAvatarUpload() {
  if (!avatarUploadWrap || !avatarFileInput) return;

  avatarUploadWrap.addEventListener('click', () => avatarFileInput.click());
  avatarUploadWrap.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      avatarFileInput.click();
    }
  });

  avatarFileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image is larger than 2 MB. Please select a smaller photo.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      currentAvatarDataUrl = dataUrl;

      if (avatarPreviewImg) avatarPreviewImg.src = dataUrl;
      if (resumeAvatarImg)  resumeAvatarImg.src = dataUrl;

      const stored = loadFromStorage();
      stored.avatarDataUrl = dataUrl;
      saveToStorage(stored);

      showToast('Profile photo updated ✓', 'success');
      updateProgress();
    };
    reader.readAsDataURL(file);
  });
}

// ── Skills Tag System ────────────────────────────────────────
const POPULAR_SKILLS = [
  'Python', 'Agile', 'JavaScript', 'React', 'Node.js', 'SQL',
  'Graphic Design', 'Microsoft Office', 'Adobe Photoshop', 'Figma',
  'Java', 'C++', 'Git', 'Docker', 'Machine Learning', 'Communication'
];
let skillTags = [];

function initSkillTags() {
  const wrap = $('#skill-tags-wrap');
  const textInput = $('#skill-text-input');
  const suggestionsWrap = $('#skill-suggestions');
  if (!wrap || !textInput) return;

  if (suggestionsWrap) {
    POPULAR_SKILLS.forEach(skill => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skill-suggestion-btn';
      btn.textContent = skill;
      btn.addEventListener('click', () => {
        addSkillTag(skill);
        debouncedSave();
        updatePreview();
      });
      suggestionsWrap.appendChild(btn);
    });
  }

  textInput.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ',') && textInput.value.trim()) {
      e.preventDefault();
      addSkillTag(textInput.value.trim().replace(/,$/, ''));
      textInput.value = '';
      debouncedSave();
      updatePreview();
    } else if (e.key === 'Backspace' && !textInput.value && skillTags.length) {
      removeSkillTag(skillTags[skillTags.length - 1]);
      debouncedSave();
      updatePreview();
    }
  });

  wrap.addEventListener('click', () => textInput.focus());
}

function addSkillTag(tag) {
  const cleaned = tag.trim();
  if (!cleaned) return;
  if (skillTags.some(s => s.toLowerCase() === cleaned.toLowerCase())) return;
  skillTags.push(cleaned);
  renderSkillTags();
}

function removeSkillTag(tag) {
  skillTags = skillTags.filter(s => s !== tag);
  renderSkillTags();
}

function renderSkillTags() {
  const wrap = $('#skill-tags-wrap');
  const textInput = $('#skill-text-input');
  if (!wrap || !textInput) return;

  $$('.skill-tag-chip', wrap).forEach(c => c.remove());

  skillTags.forEach(tag => {
    const chip = document.createElement('span');
    chip.className = 'skill-tag-chip';
    chip.innerHTML = `${esc(tag)}<button type="button" title="Remove ${esc(tag)}" aria-label="Remove ${esc(tag)}">×</button>`;
    chip.querySelector('button').addEventListener('click', e => {
      e.stopPropagation();
      removeSkillTag(tag);
      debouncedSave();
      updatePreview();
    });
    wrap.insertBefore(chip, textInput);
  });

  $$('.skill-suggestion-btn').forEach(btn => {
    const match = skillTags.some(s => s.toLowerCase() === btn.textContent.toLowerCase());
    btn.style.display = match ? 'none' : '';
  });
}

// ── Collapsible Accordion Sections ───────────────────────────
function initAccordions() {
  $$('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      const sec = header.closest('.form-section');
      sec.classList.toggle('collapsed');
    });
  });
}

// ── Dynamic Repeatable Cards ─────────────────────────────────
function addEntry(type) {
  const tpl  = document.getElementById(`${type}-template`);
  const list = document.getElementById(`${type}-list`);
  if (!tpl || !list) return null;

  const clone = tpl.content.cloneNode(true);
  const card  = clone.querySelector('.repeat-card');

  card.querySelector('.remove-button')?.addEventListener('click', () => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(-4px)';
    card.style.transition = 'all .15s ease';
    setTimeout(() => {
      card.remove();
      updatePreview();
      debouncedSave();
    }, 150);
  });

  card.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('input', () => {
      updatePreview();
      debouncedSave();
    });
  });

  list.appendChild(card);

  // University Autocomplete
  const schoolInput = card.querySelector('[data-field="school"]');
  if (schoolInput) {
    createAutocomplete({
      inputEl: schoolInput,
      fetchFn: fetchUniversities,
      renderItem: item => `<strong>${esc(item.name)}</strong> <small style="opacity:0.7">(${esc(item.country)})</small>`,
      onSelect: (item, el) => {
        el.value = item.name;
        const locInput = card.querySelector('[data-field="edu-location"]');
        if (locInput && !locInput.value && item.country) {
          locInput.value = item.country;
        }
        updatePreview();
        debouncedSave();
      }
    });
  }

  // Location Autocomplete
  const locInput = card.querySelector('[data-field="edu-location"], [data-field="exp-location"]');
  if (locInput) {
    createAutocomplete({
      inputEl: locInput,
      fetchFn: fetchLocations,
      renderItem: item => `📍 ${esc(item.display)}`,
      onSelect: (item, el) => {
        el.value = item.display;
        updatePreview();
        debouncedSave();
      }
    });
  }

  return card;
}

// ── Collect Form Data ────────────────────────────────────────
function collectFormData() {
  const data = {};
  $$('[name]', form).forEach(el => {
    data[el.name] = el.value;
  });

  data.skillTags = [...skillTags];

  data.education = $$('#education-list .repeat-card').map(c => ({
    degree:   $('[data-field="degree"]', c)?.value  || '',
    school:   $('[data-field="school"]', c)?.value  || '',
    dates:    $('[data-field="dates"]', c)?.value   || '',
    location: $('[data-field="edu-location"]', c)?.value || '',
    details:  $('[data-field="details"]', c)?.value || '',
  }));

  data.experience = $$('#experience-list .repeat-card').map(c => ({
    company:  $('[data-field="company"]', c)?.value      || '',
    role:     $('[data-field="exp-role"]', c)?.value     || '',
    dates:    $('[data-field="exp-dates"]', c)?.value    || '',
    location: $('[data-field="exp-location"]', c)?.value || '',
    desc:     $('[data-field="exp-desc"]', c)?.value     || '',
  }));

  data.projects = $$('#project-list .repeat-card').map(c => ({
    name:        $('[data-field="name"]', c)?.value        || '',
    role:        $('[data-field="role"]', c)?.value        || '',
    link:        $('[data-field="link"]', c)?.value        || '',
    description: $('[data-field="description"]', c)?.value || '',
  }));

  if (currentAvatarDataUrl) {
    data.avatarDataUrl = currentAvatarDataUrl;
  }

  return data;
}

// ── Restore Form Data ────────────────────────────────────────
function restoreFormData(data) {
  if (!data || typeof data !== 'object') return;

  Object.entries(data).forEach(([key, val]) => {
    if (['education', 'experience', 'projects', 'skillTags', 'avatarDataUrl'].includes(key)) return;
    const el = form.elements[key];
    if (el) el.value = val || '';
  });

  (data.education || []).forEach(item => {
    const card = addEntry('education');
    if (!card) return;
    if ($('[data-field="degree"]', card))       $('[data-field="degree"]', card).value       = item.degree || '';
    if ($('[data-field="school"]', card))       $('[data-field="school"]', card).value       = item.school || '';
    if ($('[data-field="dates"]', card))        $('[data-field="dates"]', card).value        = item.dates || '';
    if ($('[data-field="edu-location"]', card)) $('[data-field="edu-location"]', card).value = item.location || '';
    if ($('[data-field="details"]', card))      $('[data-field="details"]', card).value      = item.details || '';
  });

  (data.experience || []).forEach(item => {
    const card = addEntry('experience');
    if (!card) return;
    if ($('[data-field="company"]', card))      $('[data-field="company"]', card).value      = item.company || '';
    if ($('[data-field="exp-role"]', card))     $('[data-field="exp-role"]', card).value     = item.role || '';
    if ($('[data-field="exp-dates"]', card))    $('[data-field="exp-dates"]', card).value    = item.dates || '';
    if ($('[data-field="exp-location"]', card)) $('[data-field="exp-location"]', card).value = item.location || '';
    if ($('[data-field="exp-desc"]', card))     $('[data-field="exp-desc"]', card).value     = item.desc || '';
  });

  (data.projects || []).forEach(item => {
    const card = addEntry('project');
    if (!card) return;
    if ($('[data-field="name"]', card))        $('[data-field="name"]', card).value        = item.name || '';
    if ($('[data-field="role"]', card))        $('[data-field="role"]', card).value        = item.role || '';
    if ($('[data-field="link"]', card))        $('[data-field="link"]', card).value        = item.link || '';
    if ($('[data-field="description"]', card)) $('[data-field="description"]', card).value = item.description || '';
  });

  (data.skillTags || []).forEach(s => addSkillTag(s));

  if (data.avatarDataUrl) {
    currentAvatarDataUrl = data.avatarDataUrl;
    if (avatarPreviewImg) avatarPreviewImg.src = data.avatarDataUrl;
    if (resumeAvatarImg)  resumeAvatarImg.src = data.avatarDataUrl;
  }
}

// ── Progress & ATS Score ─────────────────────────────────────
function updateProgress() {
  const fields = [
    $('[name="fullName"]')?.value?.trim(),
    $('[name="title"]')?.value?.trim(),
    $('[name="email"]')?.value?.trim(),
    $('[name="phone"]')?.value?.trim(),
    $('[name="summary"]')?.value?.trim(),
    $$('#education-list .repeat-card').length > 0 ? 'yes' : '',
    skillTags.length > 0 ? 'yes' : '',
    $('[name="location"]')?.value?.trim(),
  ];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);

  if (progressFill) progressFill.style.width = pct + '%';
  if (progressPct)  progressPct.textContent   = pct + '%';
}

const ACTION_VERBS = [
  'developed','built','led','managed','designed','implemented','improved',
  'achieved','created','delivered','collaborated','increased','reduced','optimized','launched'
];
function updateATSScore(data) {
  if (!atsBadge) return;
  const combined = [
    data.summary || '',
    ...(data.experience || []).map(e => e.desc || ''),
    ...(data.projects || []).map(p => p.description || '')
  ].join(' ').toLowerCase();

  const count = ACTION_VERBS.filter(v => combined.includes(v)).length;
  if (count >= 5) {
    atsBadge.textContent = '✅ ATS: Good';
    atsBadge.className = 'ats-badge';
  } else if (count >= 2) {
    atsBadge.textContent = '⚠️ ATS: Fair';
    atsBadge.className = 'ats-badge warn';
  } else {
    atsBadge.textContent = '⚪ ATS: Ready';
    atsBadge.className = 'ats-badge';
  }
}

// ── Char Counters ────────────────────────────────────────────
function initCharCounters() {
  $$('[data-maxchars]').forEach(el => {
    const max = parseInt(el.dataset.maxchars, 10);
    const counter = el.closest('.field')?.querySelector('.char-count');
    if (!counter) return;
    function update() {
      counter.textContent = `${el.value.length} / ${max}`;
      counter.style.color = el.value.length > max - 25 ? 'var(--clr-warn)' : '';
    }
    el.addEventListener('input', update);
    update();
  });
}

// ── Top-level Location Autocomplete ──────────────────────────
function initMainLocationAutocomplete() {
  const locInput = $('[name="location"]');
  if (!locInput) return;
  createAutocomplete({
    inputEl: locInput,
    fetchFn: fetchLocations,
    renderItem: item => `📍 ${esc(item.display)}`,
    onSelect: (item, el) => {
      el.value = item.display;
      updatePreview();
      debouncedSave();
    }
  });
}

// ══════════════════════════════════════════════════════════════
// ████████  LIVE RESUME PREVIEW (FAITHFUL TO CANVA IMAGE 4) ████████
// ══════════════════════════════════════════════════════════════

function updatePreview() {
  const data = collectFormData();
  updateProgress();
  updateATSScore(data);

  // ── 1. Candidate Name (Left Sidebar) ──
  const nameEl = $('#preview-name');
  if (nameEl) {
    if (data.fullName && data.fullName.trim()) {
      const parts = data.fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        nameEl.innerHTML = `${esc(parts[0])}<br>${esc(parts.slice(1).join(' '))}`;
      } else {
        nameEl.textContent = data.fullName.trim();
      }
    } else {
      nameEl.innerHTML = 'JOHN<br>HANERY';
    }
  }

  // ── 2. Title Highlight Bar ("STUDENT") ──
  const badgeEl = $('#preview-title-badge');
  if (badgeEl) {
    badgeEl.textContent = (data.title && data.title.trim())
      ? data.title.trim().toUpperCase()
      : 'STUDENT';
  }

  // ── 3. Profile Photo ──
  if (resumeAvatarImg) {
    if (data.avatarDataUrl) {
      resumeAvatarImg.src = data.avatarDataUrl;
    } else {
      resumeAvatarImg.src = DEFAULT_AVATAR_URL;
    }
  }

  // ── 4. Education in Left Sidebar ──
  const eduEl = $('#preview-education');
  if (eduEl) {
    const validItems = (data.education || []).filter(e => e.degree || e.school);
    if (validItems.length > 0) {
      eduEl.innerHTML = validItems.map(e => `
        <div class="sidebar-list-item">
          <span class="sidebar-bullet">•</span>
          <div class="sidebar-list-body">
            <div class="sidebar-list-title">${esc(e.degree || e.school)}</div>
            ${e.school && e.degree ? `<div class="sidebar-list-sub">${esc(e.school)}</div>` : ''}
            ${e.dates ? `<div class="sidebar-list-date">${esc(e.dates)}</div>` : ''}
          </div>
        </div>
      `).join('');
    } else {
      eduEl.innerHTML = `
        <div class="sidebar-list-item">
          <span class="sidebar-bullet">•</span>
          <div class="sidebar-list-body">
            <div class="sidebar-list-title">ENTER YOUR MAJOR</div>
            <div class="sidebar-list-sub">Name Of Your University</div>
            <div class="sidebar-list-date">2010-2012</div>
          </div>
        </div>
        <div class="sidebar-list-item">
          <span class="sidebar-bullet">•</span>
          <div class="sidebar-list-body">
            <div class="sidebar-list-title">ENTER YOUR MAJOR</div>
            <div class="sidebar-list-sub">Name Of Your University</div>
            <div class="sidebar-list-date">2012-2014</div>
          </div>
        </div>
        <div class="sidebar-list-item">
          <span class="sidebar-bullet">•</span>
          <div class="sidebar-list-body">
            <div class="sidebar-list-title">ENTER YOUR MAJOR</div>
            <div class="sidebar-list-sub">Name Of Your University</div>
            <div class="sidebar-list-date">2012-2014</div>
          </div>
        </div>
      `;
    }
  }

  // ── 5. Experience in Left Sidebar ──
  const expEl = $('#preview-experience');
  const expSec = $('#sidebar-experience-sec');
  if (expEl) {
    const validItems = (data.experience || []).filter(e => e.company || e.role);
    if (validItems.length > 0) {
      expSec.style.display = '';
      expEl.innerHTML = validItems.map(e => `
        <div class="sidebar-list-item">
          <span class="sidebar-bullet">•</span>
          <div class="sidebar-list-body">
            <div class="sidebar-list-title">${esc(e.company || e.role)}</div>
            ${e.role && e.company ? `<div class="sidebar-list-sub">${esc(e.role)}</div>` : ''}
            ${e.dates ? `<div class="sidebar-list-date">${esc(e.dates)}</div>` : ''}
          </div>
        </div>
      `).join('');
    } else {
      expSec.style.display = '';
      expEl.innerHTML = `
        <div class="sidebar-list-item">
          <span class="sidebar-bullet">•</span>
          <div class="sidebar-list-body">
            <div class="sidebar-list-title">ENTER COMPANY NAME</div>
            <div class="sidebar-list-sub">Position</div>
            <div class="sidebar-list-date">2014-2015</div>
          </div>
        </div>
      `;
    }
  }

  // ── 6. Contact Me in Left Sidebar ──
  const contactEl = $('#preview-contact');
  if (contactEl) {
    const phoneSvg = `<svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z"/></svg>`;
    const mailSvg  = `<svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`;
    const pinSvg   = `<svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>`;
    const linkSvg  = `<svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`;

    const items = [
      data.phone    && { icon: phoneSvg, text: data.phone },
      data.email    && { icon: mailSvg,  text: data.email, href: `mailto:${data.email}` },
      data.location && { icon: pinSvg,   text: data.location },
      data.linkedin && { icon: linkSvg,  text: data.linkedin, href: `https://${data.linkedin.replace(/^https?:\/\//, '')}` },
      data.website  && { icon: linkSvg,  text: data.website,  href: `https://${data.website.replace(/^https?:\/\//, '')}` },
    ].filter(Boolean);

    if (items.length > 0) {
      contactEl.innerHTML = items.map(it => `
        <div class="sidebar-contact-item">
          ${it.icon}
          ${it.href ? `<a href="${it.href}" target="_blank" rel="noopener">${esc(it.text)}</a>` : `<span>${esc(it.text)}</span>`}
        </div>
      `).join('');
    } else {
      contactEl.innerHTML = `
        <div class="sidebar-contact-item">
          ${phoneSvg}
          <span>+000 123 456 789</span>
        </div>
        <div class="sidebar-contact-item">
          ${mailSvg}
          <span>hello@reallygreatsite.com</span>
        </div>
        <div class="sidebar-contact-item">
          ${pinSvg}
          <span>123 Anywhere St., Any City</span>
        </div>
      `;
    }
  }

  // ── 7. ABOUT ME in Right Main Panel ──
  const summaryEl = $('#preview-summary');
  if (summaryEl) {
    if (data.summary && data.summary.trim()) {
      summaryEl.textContent = data.summary.trim();
    } else {
      summaryEl.textContent = 'places endless Once stars joined loved adventures new who sharing stars away brought who the brought and day of dog curious endless time discover possibilities treasures brought there upon land day of dog curious endless time discover';
    }
  }

  // ── 8. SKILLS in Right Main Panel ──
  const skillsEl = $('#preview-skills');
  if (skillsEl) {
    if (skillTags.length > 0) {
      skillsEl.innerHTML = skillTags.map(s => `
        <li>
          <span class="main-bullet">•</span>
          <span>${esc(s)}</span>
        </li>
      `).join('');
    } else {
      skillsEl.innerHTML = `
        <li><span class="main-bullet">•</span><span>Microsoft Office.</span></li>
        <li><span class="main-bullet">•</span><span>Graphic Design.</span></li>
        <li><span class="main-bullet">•</span><span>Adobe Creative Suite (Photoshop, Illustrator, InDesign)</span></li>
      `;
    }
  }

  // ── 9. LANGUAGE in Right Main Panel ──
  const langEl = $('#preview-languages');
  if (langEl) {
    const list = (data.languages || '').split(',').map(s => s.trim()).filter(Boolean);
    if (list.length > 0) {
      langEl.innerHTML = list.map(l => `
        <li>
          <span class="main-bullet">•</span>
          <span>${esc(l)}</span>
        </li>
      `).join('');
    } else {
      langEl.innerHTML = `
        <li><span class="main-bullet">•</span><span>Native English</span></li>
        <li><span class="main-bullet">•</span><span>Urdu</span></li>
        <li><span class="main-bullet">•</span><span>Spanish</span></li>
      `;
    }
  }

  // ── 10. PROJECTS in Right Main Panel (optional) ──
  const projSec = $('#main-projects-sec');
  const projEl  = $('#preview-projects');
  if (projSec && projEl) {
    const validProjects = (data.projects || []).filter(p => p.name && p.name.trim());
    if (validProjects.length > 0) {
      projSec.style.display = '';
      projEl.innerHTML = validProjects.map(p => `
        <div class="main-project-item">
          <div class="main-project-header">
            <span class="main-bullet">•</span>
            <span class="main-project-title">${esc(p.name)}</span>
            ${p.role ? `<span class="main-project-role">(${esc(p.role)})</span>` : ''}
          </div>
          ${p.description ? `<p class="main-project-desc">${esc(p.description)}</p>` : ''}
          ${p.link ? `<div class="main-project-link">🔗 ${esc(p.link)}</div>` : ''}
        </div>
      `).join('');
    } else {
      projSec.style.display = 'none';
      projEl.innerHTML = '';
    }
  }
}

// ── Toast Notifications ──────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(14px)';
    t.style.transition = 'all .25s ease';
    setTimeout(() => t.remove(), 260);
  }, 2600);
}

// ── Clear / Reset Resume ─────────────────────────────────────
function clearResume() {
  if (!confirm('Clear all resume data and reset to the default Canva template? This cannot be undone.')) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STYLE_STORAGE_KEY);
  location.reload();
}

// ── Initialization ───────────────────────────────────────────
function init() {
  applyTheme(currentTheme);

  // Theme switchers
  $$('.template-dot').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.theme);
      updatePreview();
    });
  });

  // Add buttons
  $$('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      addEntry(btn.dataset.add);
      updatePreview();
      debouncedSave();
    });
  });

  // Form input listeners
  form.addEventListener('input', () => {
    updatePreview();
    debouncedSave();
  });

  // Action buttons
  printBtn?.addEventListener('click', () => window.print());
  clearBtn?.addEventListener('click', clearResume);

  // Subsystems
  initAccordions();
  initCharCounters();
  initSkillTags();
  initAvatarUpload();
  initMainLocationAutocomplete();
  initIndividualStyleControls();

  // Restore saved data or show default Canva template
  const savedData = loadFromStorage();
  if (savedData && Object.keys(savedData).length > 0) {
    restoreFormData(savedData);
  }

  // Initial preview render
  updatePreview();

  // Fetch inspirational quote
  loadMotivationalQuote();

  showToast('Welcome to Resume Studio 🎉');
}

document.addEventListener('DOMContentLoaded', init);
