/**
 * Cuckoo Calculator Card
 * A Home Assistant card that looks and works like the Apple iPhone Calculator app.
 * Supports input_number, counter, and number entities.
 *
 * Repository: https://github.com/jamesmcginnis/cuckoo-calculator-card
 */

class CuckooCalculatorCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._displayValue = '0';
    this._previousValue = null;
    this._operator = null;
    this._waitingForOperand = false;
    this._justEvaluated = false;
    this._memory = 0;
  }

  static getConfigElement() {
    return document.createElement('cuckoo-calculator-card-editor');
  }

  static getStubConfig() {
    return {
      title: '',
      result_entity: '',
      accent_color: '#FF9F0A',
      button_text_color: '#ffffff',
      display_text_color: '#ffffff',
      card_bg: '#1c1c1e',
      card_bg_opacity: 100,
      show_title: false,
      write_result: true,
      haptic: true,
      scientific: false,
    };
  }

  setConfig(config) {
    this._config = {
      title: '',
      result_entity: '',
      accent_color: '#FF9F0A',
      button_text_color: '#ffffff',
      display_text_color: '#ffffff',
      card_bg: '#1c1c1e',
      card_bg_opacity: 100,
      show_title: false,
      write_result: true,
      haptic: true,
      scientific: false,
      ...config,
    };
    if (this.shadowRoot && this.shadowRoot.innerHTML) {
      this._applyColors();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.shadowRoot.innerHTML) {
      this._render();
      this._setupListeners();
    }
    this._applyColors();
  }

  connectedCallback() {
    document.addEventListener('keydown', this._onKeyDown.bind(this));
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onKeyDown.bind(this));
  }

  _onKeyDown(e) {
    const key = e.key;
    if ('0123456789'.includes(key)) { this._inputDigit(key); return; }
    if (key === '.') { this._inputDecimal(); return; }
    if (key === '+') { this._handleOperator('+'); return; }
    if (key === '-') { this._handleOperator('−'); return; }
    if (key === '*') { this._handleOperator('×'); return; }
    if (key === '/') { e.preventDefault(); this._handleOperator('÷'); return; }
    if (key === 'Enter' || key === '=') { this._evaluate(); return; }
    if (key === 'Backspace') { this._backspace(); return; }
    if (key === 'Escape') { this._allClear(); return; }
    if (key === '%') { this._percent(); return; }
  }

  _render() {
    const cfg = this._config;
    const accent = cfg.accent_color || '#FF9F0A';
    const bg = cfg.card_bg || '#1c1c1e';

    this.shadowRoot.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        :host { display: block; --accent: ${accent}; --btn-text: ${cfg.button_text_color || '#fff'}; --display-text: ${cfg.display_text_color || '#fff'}; }

        ha-card {
          background: var(--calc-bg, ${bg}) !important;
          border-radius: 24px !important;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
          border: 1px solid rgba(255,255,255,0.10) !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
          user-select: none;
          -webkit-user-select: none;
        }

        .calc-title {
          display: ${cfg.title ? 'block' : 'none'};
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          text-align: center;
          padding: 14px 20px 0;
        }

        /* ── Display ── */
        .display {
          padding: ${cfg.title ? '8px' : '16px'} 24px 8px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          min-height: 120px;
          justify-content: flex-end;
          gap: 2px;
        }
        .display-expression {
          font-size: 18px;
          color: rgba(255,255,255,0.38);
          font-weight: 300;
          min-height: 22px;
          word-break: break-all;
          text-align: right;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .display-value {
          font-size: 72px;
          font-weight: 300;
          color: var(--display-text);
          line-height: 1;
          letter-spacing: -3px;
          word-break: break-all;
          text-align: right;
          max-width: 100%;
          transition: font-size 0.08s ease;
        }
        .display-value.shrink-1 { font-size: 56px; letter-spacing: -2px; }
        .display-value.shrink-2 { font-size: 44px; letter-spacing: -1px; }
        .display-value.shrink-3 { font-size: 34px; letter-spacing: 0; }

        /* ── Entity badge ── */
        .entity-badge {
          display: ${cfg.result_entity ? 'flex' : 'none'};
          align-items: center;
          gap: 5px;
          margin-bottom: 4px;
          color: rgba(255,255,255,0.3);
          font-size: 11px;
          font-weight: 500;
        }
        .entity-badge svg { width: 10px; height: 10px; fill: rgba(255,255,255,0.3); }

        /* ── Button grid ── */
        .btn-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          padding: 8px 16px 20px;
        }

        /* Base button */
        .btn {
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
          font-size: 32px;
          font-weight: 400;
          aspect-ratio: 1;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: filter 0.08s ease, transform 0.08s ease;
          position: relative;
          overflow: hidden;
          -webkit-touch-callout: none;
          touch-action: manipulation;
        }

        /* Ripple */
        .btn::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(255,255,255,0);
          transition: background 0.15s ease;
        }
        .btn.pressed::after { background: rgba(255,255,255,0.22); }
        .btn.pressed { transform: scale(0.93); }

        /* Function buttons (top row) — dark grey */
        .btn-func {
          background: #a5a5a5;
          color: #1c1c1e;
          font-size: 32px;
          font-weight: 500;
        }
        .btn-func.dark-mode {
          background: #333335;
          color: #fff;
        }

        /* Operator buttons — accent colour */
        .btn-op {
          background: var(--accent);
          color: #fff;
          font-size: 38px;
          font-weight: 300;
        }
        .btn-op.active-op {
          background: #fff;
          color: var(--accent);
        }

        /* Number buttons — dark grey */
        .btn-num {
          background: #333335;
          color: #fff;
        }

        /* Zero spans 2 columns */
        .btn-zero {
          border-radius: 40px;
          aspect-ratio: unset;
          grid-column: span 2;
          justify-content: flex-start;
          padding-left: 28px;
          font-size: 32px;
        }

        /* Scientific row (hidden by default) */
        .sci-row {
          display: ${cfg.scientific ? 'grid' : 'none'};
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          padding: 0 16px 4px;
        }
        .btn-sci {
          background: #1d1d1f;
          color: rgba(255,255,255,0.75);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          aspect-ratio: unset;
          padding: 8px 4px;
          font-size: 14px;
          font-weight: 500;
          width: 100%;
        }

        /* Memory row — pill style */
        .memory-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 4px 16px 6px;
        }
        .btn-mem {
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.5);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 20px;
          aspect-ratio: unset;
          padding: 5px 0;
          font-size: 12px;
          font-weight: 600;
          flex: 1;
          letter-spacing: 0.02em;
          transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease, transform 0.08s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
        }
        .btn-mem:active { background: rgba(255,255,255,0.16); color: #fff; border-color: rgba(255,255,255,0.25); transform: scale(0.95); }
        .btn-mem.mem-has-value { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.11); border-color: rgba(255,255,255,0.18); }

        /* Divider */
        .divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 0 16px 8px;
        }
      </style>

      <ha-card>
        <div class="calc-title" id="calcTitle">${cfg.title || ''}</div>

        <div class="display">
          <div class="entity-badge" id="entityBadge">
            <svg viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4M11,7V12.42L14.29,15.71L15.71,14.29L13,11.58V7H11Z"/></svg>
            <span id="entityName">${cfg.result_entity || ''}</span>
          </div>
          <div class="display-expression" id="expression"></div>
          <div class="display-value" id="displayValue">0</div>
        </div>

        <!-- Scientific + memory block (hidden unless scientific enabled) -->
        <div id="sciBlock" style="display:${cfg.scientific ? 'block' : 'none'}">
          <div class="sci-row" id="sciRow">
            <button class="btn btn-sci" data-sci="sin">sin</button>
            <button class="btn btn-sci" data-sci="cos">cos</button>
            <button class="btn btn-sci" data-sci="tan">tan</button>
            <button class="btn btn-sci" data-sci="sqrt">√</button>
            <button class="btn btn-sci" data-sci="sq">x²</button>
            <button class="btn btn-sci" data-sci="log">log</button>
            <button class="btn btn-sci" data-sci="ln">ln</button>
            <button class="btn btn-sci" data-sci="pow">xʸ</button>
            <button class="btn btn-sci" data-sci="pi">π</button>
            <button class="btn btn-sci" data-sci="inv">1/x</button>
          </div>
          <div class="memory-row">
            <button class="btn btn-mem" id="memClear" title="Memory Clear">mc</button>
            <button class="btn btn-mem" id="memRecall" title="Memory Recall">mr</button>
            <button class="btn btn-mem" id="memAdd" title="Memory Add">m+</button>
            <button class="btn btn-mem" id="memSub" title="Memory Subtract">m−</button>
            <button class="btn btn-mem" id="memStore" title="Memory Store">ms</button>
          </div>
          <div class="divider"></div>
        </div>

        <!-- Main button grid -->
        <div class="btn-grid" id="btnGrid">
          <!-- Row 1: AC / +/- / % / ÷ -->
          <button class="btn btn-func" id="btnAC">AC</button>
          <button class="btn btn-func" data-func="sign">⁺∕₋</button>
          <button class="btn btn-func" data-func="percent">%</button>
          <button class="btn btn-op" data-op="÷">÷</button>

          <!-- Row 2: 7 8 9 × -->
          <button class="btn btn-num" data-digit="7">7</button>
          <button class="btn btn-num" data-digit="8">8</button>
          <button class="btn btn-num" data-digit="9">9</button>
          <button class="btn btn-op" data-op="×">×</button>

          <!-- Row 3: 4 5 6 − -->
          <button class="btn btn-num" data-digit="4">4</button>
          <button class="btn btn-num" data-digit="5">5</button>
          <button class="btn btn-num" data-digit="6">6</button>
          <button class="btn btn-op" data-op="−">−</button>

          <!-- Row 4: 1 2 3 + -->
          <button class="btn btn-num" data-digit="1">1</button>
          <button class="btn btn-num" data-digit="2">2</button>
          <button class="btn btn-num" data-digit="3">3</button>
          <button class="btn btn-op" data-op="+">+</button>

          <!-- Row 5: 0 . = -->
          <button class="btn btn-num btn-zero" data-digit="0">0</button>
          <button class="btn btn-num" id="btnDecimal">.</button>
          <button class="btn btn-op" id="btnEquals">=</button>
        </div>
      </ha-card>
    `;

    this._updateDisplay();
  }

  _setupListeners() {
    const root = this.shadowRoot;

    // Digit buttons
    root.querySelectorAll('[data-digit]').forEach(btn => {
      btn.addEventListener('pointerdown', () => this._pressEffect(btn));
      btn.addEventListener('click', () => this._inputDigit(btn.dataset.digit));
    });

    // Operator buttons
    root.querySelectorAll('[data-op]').forEach(btn => {
      btn.addEventListener('pointerdown', () => this._pressEffect(btn));
      btn.addEventListener('click', () => this._handleOperator(btn.dataset.op));
    });

    // Function buttons
    root.getElementById('btnAC').addEventListener('pointerdown', e => this._pressEffect(e.currentTarget));
    root.getElementById('btnAC').addEventListener('click', () => this._allClear());

    root.querySelector('[data-func="sign"]').addEventListener('pointerdown', e => this._pressEffect(e.currentTarget));
    root.querySelector('[data-func="sign"]').addEventListener('click', () => this._toggleSign());

    root.querySelector('[data-func="percent"]').addEventListener('pointerdown', e => this._pressEffect(e.currentTarget));
    root.querySelector('[data-func="percent"]').addEventListener('click', () => this._percent());

    root.getElementById('btnDecimal').addEventListener('pointerdown', e => this._pressEffect(e.currentTarget));
    root.getElementById('btnDecimal').addEventListener('click', () => this._inputDecimal());

    root.getElementById('btnEquals').addEventListener('pointerdown', e => this._pressEffect(e.currentTarget));
    root.getElementById('btnEquals').addEventListener('click', () => this._evaluate());

    // Memory buttons
    root.getElementById('memClear').addEventListener('click', () => { this._memory = 0; this._updateMemBtn(); });
    root.getElementById('memRecall').addEventListener('click', () => { this._displayValue = String(this._memory); this._waitingForOperand = false; this._updateDisplay(); });
    root.getElementById('memAdd').addEventListener('click', () => { this._memory += parseFloat(this._displayValue) || 0; this._updateMemBtn(); });
    root.getElementById('memSub').addEventListener('click', () => { this._memory -= parseFloat(this._displayValue) || 0; this._updateMemBtn(); });
    root.getElementById('memStore').addEventListener('click', () => { this._memory = parseFloat(this._displayValue) || 0; this._updateMemBtn(); });

    // Scientific buttons
    root.querySelectorAll('[data-sci]').forEach(btn => {
      btn.addEventListener('pointerdown', () => this._pressEffect(btn));
      btn.addEventListener('click', () => this._handleSci(btn.dataset.sci));
    });

    // Swipe down on display to clear
    const display = root.querySelector('.display');
    let startY = 0;
    display.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
    display.addEventListener('touchend', e => {
      const dy = e.changedTouches[0].clientY - startY;
      if (dy > 50) this._allClear();
    }, { passive: true });
  }

  _pressEffect(btn) {
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 150);
    if (this._config?.haptic && navigator.vibrate) navigator.vibrate(10);
  }

  // ── Calculator logic ──────────────────────────────────────────────

  _inputDigit(digit) {
    if (this._waitingForOperand) {
      this._displayValue = digit;
      this._waitingForOperand = false;
    } else {
      if (this._displayValue === '0') {
        this._displayValue = digit;
      } else if (this._displayValue.length < 12) {
        this._displayValue += digit;
      }
    }
    this._justEvaluated = false;
    this._updateACButton();
    this._updateDisplay();
  }

  _inputDecimal() {
    if (this._waitingForOperand) {
      this._displayValue = '0.';
      this._waitingForOperand = false;
      this._updateDisplay();
      return;
    }
    if (!this._displayValue.includes('.')) {
      this._displayValue += '.';
      this._updateDisplay();
    }
    this._justEvaluated = false;
  }

  _backspace() {
    if (this._waitingForOperand || this._displayValue.length <= 1) {
      this._displayValue = '0';
    } else {
      this._displayValue = this._displayValue.slice(0, -1);
      if (this._displayValue === '-') this._displayValue = '0';
    }
    this._updateACButton();
    this._updateDisplay();
  }

  _allClear() {
    this._displayValue = '0';
    this._previousValue = null;
    this._operator = null;
    this._waitingForOperand = false;
    this._justEvaluated = false;
    this._updateDisplay();
    this._updateExpression('');
    this._updateACButton();
    this._clearActiveOp();
  }

  _toggleSign() {
    const val = parseFloat(this._displayValue);
    if (isNaN(val) || val === 0) return;
    this._displayValue = String(-val);
    this._updateDisplay();
  }

  _percent() {
    const val = parseFloat(this._displayValue);
    if (isNaN(val)) return;
    if (this._previousValue !== null && this._operator) {
      this._displayValue = String((this._previousValue * val) / 100);
    } else {
      this._displayValue = String(val / 100);
    }
    this._updateDisplay();
  }

  _handleOperator(op) {
    const current = parseFloat(this._displayValue);
    if (this._previousValue !== null && !this._waitingForOperand && !this._justEvaluated) {
      const result = this._compute(this._previousValue, current, this._operator);
      this._displayValue = this._formatResult(result);
      this._previousValue = result;
    } else {
      this._previousValue = current;
    }
    this._operator = op;
    this._waitingForOperand = true;
    this._justEvaluated = false;
    this._updateDisplay();
    this._updateExpression(`${this._formatResult(this._previousValue)} ${op}`);
    this._highlightOp(op);
  }

  _evaluate() {
    if (this._operator === null || this._previousValue === null) return;
    const current = parseFloat(this._displayValue);
    const result = this._compute(this._previousValue, current, this._operator);
    const expr = `${this._formatResult(this._previousValue)} ${this._operator} ${this._formatResult(current)} =`;
    this._displayValue = this._formatResult(result);
    this._previousValue = null;
    this._operator = null;
    this._waitingForOperand = true;
    this._justEvaluated = true;
    this._updateDisplay();
    this._updateExpression(expr);
    this._clearActiveOp();
    this._updateACButton();

    // Write result to HA entity
    if (this._config?.write_result && this._config?.result_entity && this._hass) {
      this._writeEntityValue(result);
    }
  }

  _compute(a, b, op) {
    switch (op) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : NaN;
      default: return b;
    }
  }

  _handleSci(fn) {
    const val = parseFloat(this._displayValue);
    let result;
    switch (fn) {
      case 'sin':  result = Math.sin(val * Math.PI / 180); break;
      case 'cos':  result = Math.cos(val * Math.PI / 180); break;
      case 'tan':  result = Math.tan(val * Math.PI / 180); break;
      case 'sqrt': result = Math.sqrt(val); break;
      case 'sq':   result = val * val; break;
      case 'log':  result = Math.log10(val); break;
      case 'ln':   result = Math.log(val); break;
      case 'pow':  this._handleOperator('^'); return;
      case 'pi':   this._displayValue = String(Math.PI); this._updateDisplay(); return;
      case 'inv':  result = 1 / val; break;
      default: return;
    }
    this._displayValue = this._formatResult(result);
    this._waitingForOperand = true;
    this._updateDisplay();
  }

  _writeEntityValue(value) {
    const entityId = this._config.result_entity;
    if (!entityId || !this._hass) return;
    const state = this._hass.states[entityId];
    if (!state) return;
    const domain = entityId.split('.')[0];

    try {
      if (domain === 'input_number') {
        this._hass.callService('input_number', 'set_value', { entity_id: entityId, value: value });
      } else if (domain === 'counter') {
        // counters only support increment/decrement/reset — just reset + set not ideal, skip
      } else if (domain === 'number') {
        this._hass.callService('number', 'set_value', { entity_id: entityId, value: value });
      }
    } catch (_) {}
  }

  _formatResult(val) {
    if (isNaN(val)) return 'Error';
    if (!isFinite(val)) return val > 0 ? '∞' : '-∞';
    // Avoid floating point mess — limit to 10 significant digits
    const s = parseFloat(val.toPrecision(10));
    // Use exponential if very large/small
    if (Math.abs(s) >= 1e13 || (Math.abs(s) < 1e-7 && s !== 0)) {
      return s.toExponential(4);
    }
    return String(s);
  }

  // ── Display ───────────────────────────────────────────────────────

  _updateDisplay() {
    const el = this.shadowRoot?.getElementById('displayValue');
    if (!el) return;

    const formatted = this._formatDisplayValue(this._displayValue);
    el.textContent = formatted;

    // Auto-shrink font size for long numbers
    el.className = 'display-value';
    const len = formatted.length;
    if (len > 12) el.classList.add('shrink-3');
    else if (len > 9) el.classList.add('shrink-2');
    else if (len > 6) el.classList.add('shrink-1');
  }

  _formatDisplayValue(val) {
    if (val === 'Error' || val === '∞' || val === '-∞') return val;
    if (val.includes('e') || val.includes('E')) return val;
    if (val.endsWith('.')) return val;
    const n = parseFloat(val);
    if (isNaN(n)) return val;
    // Show grouping only if integer part
    const [intPart, decPart] = val.split('.');
    const formatted = parseInt(intPart, 10).toLocaleString('en');
    return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
  }

  _updateExpression(expr) {
    const el = this.shadowRoot?.getElementById('expression');
    if (el) el.textContent = expr;
  }

  _updateACButton() {
    const btn = this.shadowRoot?.getElementById('btnAC');
    if (!btn) return;
    btn.textContent = (this._displayValue !== '0' && !this._waitingForOperand) ? 'C' : 'AC';
  }

  _highlightOp(op) {
    this._clearActiveOp();
    this.shadowRoot?.querySelectorAll('[data-op]').forEach(btn => {
      if (btn.dataset.op === op) btn.classList.add('active-op');
    });
  }

  _clearActiveOp() {
    this.shadowRoot?.querySelectorAll('[data-op]').forEach(btn => btn.classList.remove('active-op'));
  }

  _updateMemBtn() {
    const btns = this.shadowRoot?.querySelectorAll('#memRecall, #memClear');
    btns?.forEach(b => b.classList.toggle('mem-has-value', this._memory !== 0));
  }

  _applyColors() {
    const cfg = this._config;
    if (!cfg) return;
    const root = this.shadowRoot;
    const card = root?.querySelector('ha-card');
    if (!card) return;

    card.style.setProperty('--accent', cfg.accent_color || '#FF9F0A');
    root.host.style.setProperty('--accent', cfg.accent_color || '#FF9F0A');

    const bg = cfg.card_bg || '#1c1c1e';
    const opacity = (cfg.card_bg_opacity ?? 100) / 100;
    // Parse hex to rgba with opacity
    const r = parseInt(bg.slice(1,3), 16) || 28;
    const g = parseInt(bg.slice(3,5), 16) || 28;
    const b = parseInt(bg.slice(5,7), 16) || 30;
    card.style.background = `rgba(${r},${g},${b},${opacity}) !important`;

    // Update CSS vars
    const host = root.host;
    host.style.setProperty('--calc-bg', `rgba(${r},${g},${b},${opacity})`);

    const displayEl = root?.getElementById('displayValue');
    if (displayEl) displayEl.style.color = cfg.display_text_color || '#fff';

    const titleEl = root?.getElementById('calcTitle');
    if (titleEl) {
      titleEl.textContent = cfg.title || '';
      titleEl.style.display = cfg.title ? 'block' : 'none';
    }

    const entityBadge = root?.getElementById('entityBadge');
    const entityName = root?.getElementById('entityName');
    if (entityBadge) entityBadge.style.display = cfg.result_entity ? 'flex' : 'none';
    if (entityName) {
      const entityId = cfg.result_entity;
      const friendlyName = (entityId && this._hass?.states[entityId]?.attributes?.friendly_name) || entityId || '';
      entityName.textContent = friendlyName;
    }

    const sciBlock = root?.getElementById('sciBlock');
    if (sciBlock) sciBlock.style.display = cfg.scientific ? 'block' : 'none';

    // Num btn colors
    root?.querySelectorAll('.btn-num').forEach(b => {
      b.style.color = cfg.button_text_color || '#fff';
    });
    root?.querySelectorAll('.btn-op').forEach(b => {
      b.style.color = cfg.button_text_color || '#fff';
    });
  }

  getCardSize() { return 5; }
}

// ── Visual Editor ─────────────────────────────────────────────────────────────

class CuckooCalculatorCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._initialized = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._initialized) this._render();
  }

  setConfig(config) {
    this._config = config;
    if (!this._initialized && this._hass) this._render();
  }

  _updateConfig(key, value) {
    if (!this._config) return;
    const newConfig = { ...this._config, [key]: value };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: newConfig }, bubbles: true, composed: true }));
  }

  _render() {
    if (!this._hass || !this._config) return;
    this._initialized = true;
    const cfg = this._config;

    // Gather number/input_number entities from HA
    const numEntities = Object.keys(this._hass.states)
      .filter(e => e.startsWith('input_number.') || e.startsWith('number.'))
      .sort();

    this.shadowRoot.innerHTML = `
      <style>
        .container { display: flex; flex-direction: column; gap: 20px; padding: 12px; color: var(--primary-text-color); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 6px; }
        .card-block { background: var(--card-background-color); border: 1px solid rgba(128,128,128,0.18); border-radius: 12px; overflow: hidden; }

        /* Toggle rows */
        .toggle-list { display: flex; flex-direction: column; }
        .toggle-item { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; border-bottom: 1px solid rgba(128,128,128,0.1); min-height: 52px; }
        .toggle-item:last-child { border-bottom: none; }
        .toggle-label { font-size: 14px; font-weight: 500; flex: 1; padding-right: 12px; }
        .toggle-hint { font-size: 11px; color: #888; margin-top: 2px; }

        /* iOS toggle switch */
        .toggle-switch { position: relative; width: 51px; height: 31px; flex-shrink: 0; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
        .toggle-track {
          position: absolute; inset: 0; border-radius: 31px;
          background: rgba(120,120,128,0.32); cursor: pointer;
          transition: background 0.25s ease;
        }
        .toggle-track::after {
          content: ''; position: absolute;
          width: 27px; height: 27px; border-radius: 50%;
          background: #fff; top: 2px; left: 2px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: transform 0.25s ease;
        }
        .toggle-switch input:checked + .toggle-track { background: #34C759; }
        .toggle-switch input:checked + .toggle-track::after { transform: translateX(20px); }

        /* Select */
        .select-row { padding: 12px 16px; display: flex; flex-direction: column; gap: 6px; }
        .select-row .hint { font-size: 11px; color: #888; }
        select {
          width: 100%; background: var(--card-background-color); color: var(--primary-text-color);
          border: 1px solid rgba(128,128,128,0.2); border-radius: 8px;
          padding: 10px 12px; font-size: 14px; cursor: pointer; -webkit-appearance: none; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px;
        }

        /* Text input */
        .input-row { padding: 10px 16px; display: flex; flex-direction: column; gap: 4px; }
        .input-row label { font-size: 12px; font-weight: 600; color: rgba(128,128,128,0.8); }
        input[type="text"] {
          width: 100%; box-sizing: border-box; background: var(--card-background-color);
          color: var(--primary-text-color); border: 1px solid rgba(128,128,128,0.2);
          border-radius: 8px; padding: 10px 12px; font-size: 14px; font-family: inherit; outline: none;
        }

        /* Colour grid (leopard style — matches crow card) */
        .colour-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .colour-card {
          border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
          border-radius: 10px; overflow: hidden; cursor: pointer;
          transition: box-shadow 0.15s, border-color 0.15s; position: relative;
        }
        .colour-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.12); border-color: var(--primary-color, #FF9F0A); }
        .colour-swatch { height: 44px; width: 100%; display: block; position: relative; }
        .colour-swatch input[type="color"] { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; border: none; padding: 0; }
        .colour-swatch-preview { position: absolute; inset: 0; pointer-events: none; }
        .colour-swatch::before {
          content: ''; position: absolute; inset: 0;
          background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%);
          background-size: 8px 8px; background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
          opacity: 0.3; pointer-events: none;
        }
        .colour-info { padding: 6px 8px 7px; background: var(--card-background-color, #fff); }
        .colour-label { font-size: 11px; font-weight: 700; color: var(--primary-text-color); letter-spacing: 0.02em; margin-bottom: 1px; }
        .colour-desc { font-size: 10px; color: var(--secondary-text-color, #6b7280); margin-bottom: 4px; line-height: 1.3; }
        .colour-hex-row { display: flex; align-items: center; gap: 4px; }
        .colour-dot { width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.15); flex-shrink: 0; }
        .colour-hex { flex: 1; font-size: 11px; font-family: monospace; border: none; background: none; color: var(--secondary-text-color, #6b7280); padding: 0; width: 0; min-width: 0; }
        .colour-hex:focus { outline: none; color: var(--primary-text-color); }
        .colour-edit-icon { opacity: 0; transition: opacity 0.15s; color: var(--secondary-text-color); font-size: 14px; line-height: 1; }
        .colour-card:hover .colour-edit-icon { opacity: 1; }

        /* Opacity slider */
        .opacity-row { display: flex; align-items: center; gap: 10px; padding: 10px 16px; }
        .opacity-row label { font-size: 13px; font-weight: 500; flex: 1; }
        .opacity-row input[type="range"] { flex: 2; accent-color: #FF9F0A; }
        .opacity-val { font-size: 12px; color: #888; width: 32px; text-align: right; font-variant-numeric: tabular-nums; }
      </style>

      <div class="container">

        <!-- Card title -->
        <div>
          <div class="section-title">Card Label</div>
          <div class="card-block">
            <div class="input-row">
              <label>Title (optional)</label>
              <input type="text" id="titleInput" placeholder="e.g. Kitchen Calculator" value="${cfg.title || ''}">
            </div>
          </div>
        </div>

        <!-- Result entity -->
        <div>
          <div class="section-title">Result Entity</div>
          <div class="card-block">
            <div class="select-row">
              <div class="hint">Optionally write the calculator result to a Home Assistant entity</div>
              <select id="resultEntity">
                <option value="">— None (standalone calculator) —</option>
                ${numEntities.map(e => {
                  const name = this._hass.states[e]?.attributes?.friendly_name || e;
                  return `<option value="${e}" ${cfg.result_entity === e ? 'selected' : ''}>${name} (${e})</option>`;
                }).join('')}
              </select>
            </div>
            <div class="toggle-list">
              <div class="toggle-item">
                <div>
                  <div class="toggle-label">Write Result on =</div>
                  <div class="toggle-hint">Update entity every time = is pressed</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" id="writeResult" ${cfg.write_result !== false ? 'checked' : ''}><span class="toggle-track"></span></label>
              </div>
            </div>
          </div>
        </div>

        <!-- Options -->
        <div>
          <div class="section-title">Options</div>
          <div class="card-block">
            <div class="toggle-list">
              <div class="toggle-item">
                <div>
                  <div class="toggle-label">Scientific Mode</div>
                  <div class="toggle-hint">Show sin, cos, log, √ and more</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" id="scientific" ${cfg.scientific ? 'checked' : ''}><span class="toggle-track"></span></label>
              </div>
              <div class="toggle-item">
                <div>
                  <div class="toggle-label">Haptic Feedback</div>
                  <div class="toggle-hint">Vibrate on button press (mobile only)</div>
                </div>
                <label class="toggle-switch"><input type="checkbox" id="haptic" ${cfg.haptic !== false ? 'checked' : ''}><span class="toggle-track"></span></label>
              </div>
            </div>
          </div>
        </div>

        <!-- Colours -->
        <div>
          <div class="section-title">Colours</div>
          <div class="card-block" style="padding:10px;">
            <div class="colour-grid" id="colourGrid"></div>
            <div class="opacity-row" style="border-top:1px solid rgba(128,128,128,0.1);margin-top:8px;padding-top:10px;">
              <label>Background Opacity</label>
              <input type="range" id="bgOpacity" min="0" max="100" step="1" value="${cfg.card_bg_opacity ?? 100}">
              <span class="opacity-val" id="opacityVal">${cfg.card_bg_opacity ?? 100}%</span>
            </div>
          </div>
        </div>

      </div>
    `;

    // ── Build colour cards ──────────────────────────────────────────
    const COLOUR_FIELDS = [
      { key: 'accent_color',        label: 'Accent',          desc: 'Operator buttons & highlights',     default: '#FF9F0A' },
      { key: 'card_bg',             label: 'Card Background', desc: 'Main card background colour',       default: '#1c1c1e' },
      { key: 'display_text_color',  label: 'Display Text',    desc: 'Number display text colour',        default: '#ffffff' },
      { key: 'button_text_color',   label: 'Button Text',     desc: 'Label colour on number buttons',    default: '#ffffff' },
    ];
    const grid = this.shadowRoot.getElementById('colourGrid');
    for (const field of COLOUR_FIELDS) {
      const savedVal  = cfg[field.key] || '';
      const swatchVal = savedVal || field.default;
      const card = document.createElement('div');
      card.className   = 'colour-card';
      card.dataset.key = field.key;
      card.innerHTML = `
        <label class="colour-swatch">
          <div class="colour-swatch-preview" style="background:${swatchVal}"></div>
          <input type="color" value="${/^#[0-9a-fA-F]{6}$/.test(swatchVal) ? swatchVal : swatchVal.slice(0,7)}">
        </label>
        <div class="colour-info">
          <div class="colour-label">${field.label}</div>
          <div class="colour-desc">${field.desc}</div>
          <div class="colour-hex-row">
            <div class="colour-dot" style="background:${swatchVal}"></div>
            <input class="colour-hex" type="text" value="${savedVal}" maxlength="7" placeholder="${field.default}" spellcheck="false">
            <span class="colour-edit-icon">✎</span>
          </div>
        </div>`;
      const picker  = card.querySelector('input[type=color]');
      const hexIn   = card.querySelector('.colour-hex');
      const preview = card.querySelector('.colour-swatch-preview');
      const dot     = card.querySelector('.colour-dot');
      const apply = (val) => {
        preview.style.background = val;
        dot.style.background     = val;
        if (/^#[0-9a-fA-F]{6}$/.test(val)) picker.value = val;
        hexIn.value = val;
        this._updateConfig(field.key, val);
      };
      picker.addEventListener('input',  () => apply(picker.value));
      picker.addEventListener('change', () => apply(picker.value));
      hexIn.addEventListener('input', () => {
        const v = hexIn.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(v)) apply(v);
      });
      hexIn.addEventListener('blur', () => {
        const cur = cfg[field.key] || field.default;
        if (!/^#[0-9a-fA-F]{6}$/.test(hexIn.value.trim())) hexIn.value = cur;
      });
      hexIn.addEventListener('keydown', e => { if (e.key === 'Enter') hexIn.blur(); });
      grid.appendChild(card);
    }

    // ── Wire up other controls ─────────────────────────────────────
    const root = this.shadowRoot;
    root.getElementById('titleInput').addEventListener('input', e => this._updateConfig('title', e.target.value));
    root.getElementById('resultEntity').addEventListener('change', e => this._updateConfig('result_entity', e.target.value));
    root.getElementById('writeResult').addEventListener('change', e => this._updateConfig('write_result', e.target.checked));
    root.getElementById('scientific').addEventListener('change', e => this._updateConfig('scientific', e.target.checked));
    root.getElementById('haptic').addEventListener('change', e => this._updateConfig('haptic', e.target.checked));
    const opSlider = root.getElementById('bgOpacity');
    const opVal    = root.getElementById('opacityVal');
    opSlider.addEventListener('input', e => {
      opVal.textContent = e.target.value + '%';
      this._updateConfig('card_bg_opacity', parseInt(e.target.value));
    });
  }
}

// ── Registration ──────────────────────────────────────────────────────────────

if (!customElements.get('cuckoo-calculator-card')) {
  customElements.define('cuckoo-calculator-card', CuckooCalculatorCard);
}
if (!customElements.get('cuckoo-calculator-card-editor')) {
  customElements.define('cuckoo-calculator-card-editor', CuckooCalculatorCardEditor);
}

window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === 'cuckoo-calculator-card')) {
  window.customCards.push({
    type: 'cuckoo-calculator-card',
    name: 'Cuckoo Calculator Card',
    preview: true,
    description: 'A beautiful Apple-style calculator card for Home Assistant.',
  });
}
