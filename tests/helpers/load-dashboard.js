const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createFakeCanvasContext() {
  return {
    clearRect() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    fill() {},
    stroke() {},
    fillRect() {},
    setLineDash() {},
    createLinearGradient() {
      return { addColorStop() {} };
    }
  };
}

class FakeStyle {
  setProperty(name, value) {
    this[name] = value;
  }
}

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(...tokens) {
    tokens.forEach(token => this.values.add(token));
  }

  remove(...tokens) {
    tokens.forEach(token => this.values.delete(token));
  }

  toggle(token, force) {
    if (force === undefined) {
      if (this.values.has(token)) {
        this.values.delete(token);
        return false;
      }
      this.values.add(token);
      return true;
    }

    if (force) {
      this.values.add(token);
    } else {
      this.values.delete(token);
    }
    return !!force;
  }

  contains(token) {
    return this.values.has(token);
  }
}

class FakeElement {
  constructor(ownerDocument, tagName = 'div', id = '') {
    this.ownerDocument = ownerDocument;
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.children = [];
    this.parentElement = null;
    this.style = new FakeStyle();
    this.classList = new FakeClassList();
    this.className = '';
    this.textContent = '';
    this.value = '';
    this._innerHTML = '';
    this._listeners = new Map();
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    if (child.id) {
      this.ownerDocument._elements.set(child.id, child);
    }
    return child;
  }

  setAttribute(name, value) {
    if (name === 'class') {
      this.className = value;
      return;
    }
    this[name] = value;
  }

  addEventListener(type, handler) {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, []);
    }
    this._listeners.get(type).push(handler);
  }

  dispatch(type, event = {}) {
    const handlers = this._listeners.get(type) || [];
    handlers.forEach(handler => handler(event));
  }

  querySelector(selector) {
    if (selector === '.motor-dot') {
      this._motorDot ||= new FakeElement(this.ownerDocument);
      return this._motorDot;
    }
    if (selector === '.motor-wobble') {
      this._motorWobble ||= new FakeElement(this.ownerDocument);
      return this._motorWobble;
    }
    return null;
  }

  querySelectorAll(selector) {
    if (selector === '.zone-card') {
      return this.children.filter(child => child.className.split(/\s+/).includes('zone-card'));
    }
    if (selector === '.zone-card.expanded') {
      return this.children.filter(child => {
        const classes = new Set(child.className.split(/\s+/).filter(Boolean));
        return classes.has('zone-card') && classes.has('expanded');
      });
    }
    if (selector === '.motor-ring') {
      this._motorRings ||= [new FakeElement(this.ownerDocument), new FakeElement(this.ownerDocument)];
      return this._motorRings;
    }
    return [];
  }

  getBoundingClientRect() {
    if (this.id === 'cushionContainer') {
      return { left: 0, top: 0, width: 520, height: 416 };
    }
    if (this.tagName === 'CANVAS') {
      return { left: 0, top: 0, width: 160, height: 48 };
    }
    return { left: 0, top: 0, width: 160, height: 48 };
  }

  getContext() {
    return createFakeCanvasContext();
  }

  set innerHTML(value) {
    this._innerHTML = value;

    const idPattern = /id="([^"]+)"/g;
    let match;
    while ((match = idPattern.exec(value))) {
      const id = match[1];
      if (!this.ownerDocument._elements.has(id)) {
        const tagName = id === 'timelineCanvas' || id.startsWith('sparkline') ? 'canvas' : 'div';
        this.appendChild(new FakeElement(this.ownerDocument, tagName, id));
      }
    }
  }

  get innerHTML() {
    return this._innerHTML;
  }
}

class FakeDocument {
  constructor() {
    this._elements = new Map();
    this.head = new FakeElement(this, 'head', 'head');
    this.body = new FakeElement(this, 'body', 'body');
  }

  createElement(tagName) {
    return new FakeElement(this, tagName);
  }

  getElementById(id) {
    if (!this._elements.has(id)) {
      const tagName = id === 'timelineCanvas' || id.startsWith('sparkline') ? 'canvas' : 'div';
      const element = new FakeElement(this, tagName, id);
      if (id === 'timelineCanvas') {
        element.parentElement = new FakeElement(this, 'div', 'timelineCanvasWrap');
      }
      this._elements.set(id, element);
    }
    return this._elements.get(id);
  }

  querySelector(selector) {
    if (selector === '.status-label') {
      return this.getElementById('statusLabel');
    }
    return new FakeElement(this);
  }

  querySelectorAll(selector) {
    if (selector === '.motor-group-svg') {
      return Array.from({ length: 8 }, (_, index) => this.getElementById(`motor-group-${index}`));
    }
    if (selector === '.zone-card.expanded') {
      return this.getElementById('zoneSidebar').querySelectorAll(selector);
    }
    return [];
  }
}

function createDocument() {
  const document = new FakeDocument();
  const staticIds = [
    'sessionTimer',
    'thresholdSlider',
    'thresholdVal',
    'statAvg',
    'statPeak',
    'statAlerts',
    'statMotors',
    'demoBtn',
    'timelineDrawer',
    'timelineToggle',
    'timelineCanvas',
    'zoneTooltip',
    'cushionContainer',
    'connectionOverlay',
    'zoneSidebar',
    'connectBtn',
    'motorLayoutGrid',
    'postureLabel',
    'postureBarFill',
    'posturePct',
    'postureSecondary',
    'postureSilhouette',
    'motorReason',
    'statusLabel'
  ];

  staticIds.forEach(id => document.getElementById(id));
  for (let i = 0; i < 8; i++) {
    document.getElementById(`zone${i}`);
  }

  return document;
}

function loadDashboard() {
  const htmlPath = path.resolve(__dirname, '..', '..', 'dashboard-test.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const scriptMatch = html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/i);

  if (!scriptMatch) {
    throw new Error('Unable to locate dashboard script');
  }

  const exportsSnippet = `
if (typeof globalThis !== 'undefined') {
  globalThis.__SENSEGRID_TEST_HOOKS__ = {
    ZONE_NAMES,
    MOTOR_ROUTING,
    POSTURE_PROTOTYPES,
    POSTURE_PERSIST_TICKS,
    createLiveFsrTransformState,
    parseSerialFrame,
    remapRawFsrFrame,
    normalizeLiveFsrFrame,
    spreadLiveFsrFrame,
    transformLiveFsrFrame,
    runLiveFsrSelfTests,
    createPostureState,
    predictPosture,
    updatePostureSmoothed,
    pressureToColor,
    SerialDataSource,
    FakeSessionDataSource,
    onData,
    state
  };
}
})();`;

  const instrumentedScript = scriptMatch[1].replace(/\}\)\(\);\s*$/, exportsSnippet);
  const document = createDocument();
  const context = {
    console,
    document,
    navigator: {
      serial: {
        async requestPort() {
          return {
            readable: {
              pipeTo() {
                return Promise.resolve();
              }
            },
            async open() {},
            async close() {}
          };
        }
      }
    },
    TextDecoderStream: class {
      constructor() {
        this.writable = {};
        this.readable = {
          getReader() {
            return {
              async read() {
                return { done: true, value: '' };
              },
              async cancel() {}
            };
          }
        };
      }
    },
    requestAnimationFrame() {
      return 1;
    },
    setInterval,
    clearInterval,
    performance: { now: () => 0 },
    setTimeout,
    clearTimeout,
    URLSearchParams,
    location: { search: '' },
    Math,
    Date,
    Float32Array,
    Uint8Array,
    Array,
    Object,
    Number,
    String,
    Boolean,
    JSON,
    Promise
  };

  context.window = context;
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(instrumentedScript, context);

  return {
    context,
    document,
    hooks: context.__SENSEGRID_TEST_HOOKS__
  };
}

module.exports = {
  loadDashboard
};
