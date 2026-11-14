const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// A small DOM/storage harness exercises the unchanged application script.
function session(initial = {}) {
  const storage = new Map(Object.entries(initial));
  const nodes = new Map();
  function node() {
    const value = { textContent: '', disabled: false, hidden: false, value: '',
      children: [], handlers: {},
      append(...items) { this.children.push(...items); },
      appendChild(item) { this.children.push(item); },
      addEventListener(name, handler) { this.handlers[name] = handler; } };
    Object.defineProperty(value, 'innerHTML', { set() { this.children = []; } });
    return value;
  }
  const context = vm.createContext({
    document: {
      getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
      createElement: node,
    },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key),
    },
    window: { confirm: () => true },
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8'), context);
  return {
    nodes, storage, context,
    run: expression => vm.runInContext(expression, context),
    click: id => nodes.get(id).handlers.click(),
    changeLimit(value) { nodes.get('limitInput').handlers.change({ target: { value } }); },
  };
}

test('initial state disables saving and defaults to population size 34', () => {
  const app = session();
  assert.equal(app.nodes.get('limitInput').value, '34');
  assert.equal(app.nodes.get('resultValue').textContent, '--');
  assert.equal(app.nodes.get('saveButton').disabled, true);
});

test('draw boundaries stay in the inclusive population range', () => {
  const app = session();
  app.changeLimit('34');
  app.run('Math.random = () => 0');
  app.click('drawButton');
  assert.equal(app.nodes.get('resultValue').textContent, '1');
  app.run('Math.random = () => 1 - Number.EPSILON');
  app.click('drawButton');
  assert.equal(app.nodes.get('resultValue').textContent, '34');
  app.changeLimit('1');
  app.click('drawButton');
  assert.equal(app.nodes.get('resultValue').textContent, '1');
});

test('saving a sample leaves it eligible on the next draw', () => {
  const app = session();
  app.run('Math.random = () => 0.5');
  app.click('drawButton');
  app.click('saveButton');
  app.click('drawButton');
  assert.equal(app.nodes.get('resultValue').textContent, '18');
  assert.equal(app.nodes.get('drawCount').textContent, '2');
  assert.equal(app.nodes.get('savedCount').textContent, '1');
  assert.equal(app.run('state.drawHistory[0].number === state.drawHistory[1].number'), true);
});

test('reload restores the population size, last draw and saved samples', () => {
  const app = session();
  app.changeLimit('10');
  app.run('Math.random = () => 0.5');
  app.click('drawButton');
  app.click('saveButton');
  const restored = session(Object.fromEntries(app.storage));
  assert.equal(restored.nodes.get('limitInput').value, '10');
  assert.equal(restored.nodes.get('resultValue').textContent, '6');
  assert.equal(restored.nodes.get('savedCount').textContent, '1');
  assert.equal(restored.nodes.get('drawCount').textContent, '1');
});

test('changing the population clears the latest result and disables saving', () => {
  const app = session();
  app.click('drawButton');
  app.changeLimit('2');
  assert.equal(app.nodes.get('resultValue').textContent, '--');
  assert.equal(app.nodes.get('saveButton').disabled, true);
  assert.equal(app.storage.has('sampling-counter-latest-number'), false);
});

test('only 12 recent entries render while the full draw history is retained', () => {
  const app = session();
  for (let i = 0; i < 20; i++) app.click('drawButton');
  assert.equal(app.nodes.get('historyList').children.length, 12);
  assert.equal(app.nodes.get('drawCount').textContent, '20');
  assert.equal(JSON.parse(app.storage.get('sampling-counter-draw-history')).length, 20);
});

test('clear confirmations can be cancelled and lists clear independently', () => {
  const app = session();
  app.click('drawButton');
  app.click('saveButton');
  app.run('window.confirm = () => false');
  app.click('clearSavedButton');
  assert.equal(app.nodes.get('savedCount').textContent, '1');
  app.run('window.confirm = () => true');
  app.click('clearHistoryButton');
  assert.equal(app.nodes.get('drawCount').textContent, '0');
  assert.equal(app.nodes.get('savedCount').textContent, '1');
  app.click('clearSavedButton');
  assert.equal(app.nodes.get('savedCount').textContent, '0');
});

test('malformed stored list JSON falls back to an empty session', () => {
  const app = session({ 'sampling-counter-saved-samples': '{bad', 'sampling-counter-draw-history': 'null' });
  assert.equal(app.nodes.get('savedCount').textContent, '0');
  assert.equal(app.nodes.get('drawCount').textContent, '0');
});
