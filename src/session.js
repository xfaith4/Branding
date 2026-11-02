import { CRITERIA, SIGNALS } from './defaults.js';

const STORAGE_KEY = 'naming-lab:session:v1';

export function parseSession(text) {
  const data = JSON.parse(text);
  const fail = () => { throw new Error('Invalid Naming Lab session. Import a JSON file exported by this app.'); };
  const string = (value, max) => typeof value === 'string' && value.length <= max;
  const number = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
  if (!data || data.version !== 1 || !Array.isArray(data.ideas) || data.ideas.length > 200 || !string(data.objective, 5000) || !data.weights) fail();
  const ids = new Set();
  const ideas = data.ideas.map(idea => {
    if (!idea || !string(idea.id, 100) || !idea.id || ids.has(idea.id) ||
      !string(idea.name, 120) || !idea.name.trim() || !string(idea.category, 80) ||
      !string(idea.description, 2000) || !string(idea.notes, 5000) ||
      typeof idea.selected !== 'boolean' || !idea.grades) fail();
    ids.add(idea.id);
    const grades = {};
    for (const { key } of CRITERIA) {
      if (!number(idea.grades[key], 1, 10)) fail();
      grades[key] = idea.grades[key];
    }
    return { id: idea.id, name: idea.name, category: idea.category, description: idea.description, notes: idea.notes, selected: idea.selected, grades };
  });
  const weights = {};
  for (const { key } of SIGNALS) {
    if (!number(data.weights[key], 0, 2.5)) fail();
    weights[key] = data.weights[key];
  }
  return { version: 1, ideas, weights, objective: data.objective };
}

export function loadSession() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return { session: saved ? parseSession(saved) : null, message: saved ? 'Saved board restored.' : 'Start with the sample ideas or add your own.' };
  } catch {
    return { session: null, message: 'Saved data could not be loaded. Use JSON exports to keep a backup.' };
  }
}

export function saveSession(session) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); return null; }
  catch { return 'Browser storage is unavailable or full. Export your session before closing this page.'; }
}

export function download(filename, contents, type) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
