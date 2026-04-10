# Cuckoo Calculator Card

A sleek, dark-glass calculator card for Home Assistant. Supports writing results to Home Assistant entities, scientific mode, memory pill buttons, keyboard input, and a full visual configuration editor. Optimised for iPhone Dashboards.

![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2024.1+-blue)
![HACS](https://img.shields.io/badge/HACS-Custom-orange)
![License](https://img.shields.io/badge/license-MIT-green)

[![Open your Home Assistant instance and add this repository to HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jamesmcginnis&repository=cuckoo-calculator-card&category=plugin)

---

## 📸 Screenshots

### Calculator
![Calculator](preview1.png)
*Dark glass calculator with colour-coded operator buttons and frosted memory pills*

### Scientific Mode
![Scientific Mode](preview2.png)
*Scientific function row with sin, cos, tan, log, ln, √ and more*

### Visual Configuration Editor
![Configuration Editor](preview3.png)
*Full visual editor — colour pickers, entity selector and toggles — no YAML required*

---

## ✨ Features

### Core
- 🖤 **Dark glass design** — frosted card with rounded keys, large display and colour-coded operator buttons
- 🔢 **Full arithmetic** — add, subtract, multiply, divide, percentage, sign toggle and decimal input
- 📺 **Live expression display** — shows the current expression above the main number as you build it
- 🔄 **AC / C toggle** — automatically switches between All Clear and Clear Entry
- ✨ **Active operator highlight** — the selected operator inverts to white-on-accent while waiting for the next operand
- 📱 **Mobile optimised** — touch-friendly layout designed for phone dashboards

### Memory
- 🧠 **Memory pill buttons** — mc, mr, m+, m− and ms displayed as frosted-glass pills that sit flush with the card aesthetic
- 💡 Memory pills highlight automatically when a value is stored

### Scientific Mode
- 🧪 **Scientific functions** — sin, cos, tan, log, ln, √, x², 1/x, π and xʸ
- 🔬 Toggled on or off from the visual editor — hidden by default for a clean look

### Home Assistant Integration
- ✏️ **Writes results to HA entities** — optionally push the `=` result to any `input_number` or `number` entity
- 🔗 Supports the `input_number.set_value` and `number.set_value` services

### Input
- ⌨️ **Keyboard support** — type numbers and operators directly; Backspace deletes; Escape clears; Enter evaluates
- 👆 **Swipe down to clear** — swipe down on the display to trigger All Clear on touch screens
- 📳 **Haptic feedback** — vibrates on button press on supported mobile devices (can be disabled)

### Configuration
- ⚙️ **Full visual editor** — colour pickers, entity selector and toggles — no YAML required
- 🎨 **Deep colour control** — accent, background, display text and button text; native colour picker tiles with hex input on every field
- 🌓 **Background opacity** — set the card background to fully transparent, fully opaque, or anything in between using the opacity slider in the editor

---

## 🚀 Installation

### HACS (Recommended)

[![Open your Home Assistant instance and add this repository to HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jamesmcginnis&repository=cuckoo-calculator-card&category=plugin)

1. Open **HACS** in your Home Assistant instance
2. Click **Frontend**
3. Click the ⋮ menu → **Custom repositories**
4. Paste this repository URL and set the category to **Dashboard**
5. Click **Download**
6. Restart Home Assistant

### Manual Installation

1. Download `cuckoo-calculator-card.js`
2. Copy it into your `config/www/` folder
3. Add the resource in your Lovelace configuration:

```yaml
lovelace:
  resources:
    - url: /local/cuckoo-calculator-card.js
      type: module
```

4. Restart Home Assistant

---

## ⚙️ Configuration

### Quick Start

1. Edit your dashboard and click **Add Card**
2. Search for **Cuckoo Calculator**
3. Use the **visual editor** to configure colours and an optional result entity
4. Hit **Save** — done!

### YAML Example

```yaml
type: custom:cuckoo-calculator-card
```

### Full YAML Options

```yaml
type: custom:cuckoo-calculator-card
title: Kitchen Calculator       # Optional label shown above the display
result_entity: input_number.my_value  # Optional HA entity to write results to
write_result: true              # Update entity every time = is pressed
scientific: false               # Show the scientific function row
haptic: true                    # Haptic feedback on button press (mobile only)
accent_color: "#FF9F0A"         # Operator button colour
card_bg: "#1c1c1e"              # Card background colour
card_bg_opacity: 100            # Background opacity 0–100
display_text_color: "#ffffff"   # Display number text colour
button_text_color: "#ffffff"    # Number button label colour
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | `''` | Optional label shown above the display; shown automatically when set |
| `result_entity` | string | `''` | `input_number` or `number` entity to write results to |
| `write_result` | boolean | `true` | Update the entity every time = is pressed |
| `scientific` | boolean | `false` | Show the scientific function row |
| `haptic` | boolean | `true` | Haptic feedback on button press (mobile) |
| `accent_color` | string | `#FF9F0A` | Operator button colour |
| `card_bg` | string | `#1c1c1e` | Card background colour |
| `card_bg_opacity` | number | `100` | Background opacity 0–100 |
| `display_text_color` | string | `#ffffff` | Display number text colour |
| `button_text_color` | string | `#ffffff` | Number button label colour |

> **Note:** `show_title` has been removed. The title is now shown automatically whenever the `title` field is non-empty.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `0`–`9` | Input digit |
| `.` | Decimal point |
| `+` `-` `*` `/` | Operators |
| `Enter` or `=` | Evaluate |
| `Backspace` | Delete last digit |
| `Escape` | All Clear |
| `%` | Percent |

---

## ✏️ Writing Results to Home Assistant

When `result_entity` is set, pressing `=` will call the appropriate HA service to update the entity with the calculated result.

| Domain | Service called |
|--------|---------------|
| `input_number` | `input_number.set_value` |
| `number` | `number.set_value` |

The entity name and a sync icon are shown as a small badge above the display when a result entity is configured.

---

## 🧠 Memory Pills

The five memory buttons — mc, mr, m+, m− and ms — are displayed as frosted-glass pill buttons that sit between the display and the main keypad. They are visually subdued at rest and brighten on press. The **mc** and **mr** pills highlight to indicate that memory holds a value.

| Button | Function |
|--------|----------|
| mc | Clear memory |
| mr | Recall memory to display |
| m+ | Add display value to memory |
| m− | Subtract display value from memory |
| ms | Store display value to memory |

---

## 🧪 Scientific Mode

Enable **Scientific Mode** in the visual editor (or set `scientific: true` in YAML) to show an additional row of functions above the memory pills.

| Button | Function |
|--------|----------|
| sin | Sine (degrees) |
| cos | Cosine (degrees) |
| tan | Tangent (degrees) |
| √ | Square root |
| x² | Square |
| log | Base-10 logarithm |
| ln | Natural logarithm |
| xʸ | Power (enters operator mode) |
| π | Inserts π |
| 1/x | Reciprocal |

---

## 🔧 Troubleshooting

**Card doesn't appear after installation**
- Add the resource to Lovelace (see Installation above) and hard-refresh: Ctrl+Shift+R / Cmd+Shift+R

**Result entity not updating**
- Ensure `write_result: true` and that the entity domain is `input_number` or `number`
- Check that the entity exists and is not unavailable in Home Assistant

**Keyboard input not working**
- Click anywhere on the card first to focus it, then type

**Haptic feedback not working**
- Haptic feedback requires a browser and device that support the `navigator.vibrate` API — most Android browsers support this; iOS Safari does not

**Scientific mode not showing**
- Enable it in the visual editor under **Options → Scientific Mode**, or set `scientific: true` in your YAML config

---

## 🙏 Credits & Acknowledgements

### Crow Media Player Card
Built to match the visual style and editor patterns of [Crow Media Player Card](https://github.com/jamesmcginnis/crow-media-player-card) — same author, same aesthetic.

### Special Thanks
- The [Home Assistant](https://www.home-assistant.io) team
- The HA community for inspiration and feedback
- All users who test, report issues and suggest improvements
- My Loving Wife for her endless support ❤️

---

## 📄 License

MIT License — free to use, modify and distribute.

---

## 🐦 Why "CUCKOO"?

- **C**lean dark-glass design
- **U**niversal arithmetic support
- **C**ustomisable colours and layout
- **K**eyboard and touch input
- **O**ptional HA entity integration
- **O**ptimised for phone dashboards

---

## ⭐ Support

If this card is useful to you, please **star the repository** and share it with the community!

For bugs or feature requests, use the [GitHub Issues](../../issues) page.
