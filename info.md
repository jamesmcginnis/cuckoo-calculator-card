# Cuckoo Calculator Card

A beautiful, Apple-inspired calculator card for Home Assistant that looks and works just like the iPhone Calculator app. Supports writing results to Home Assistant entities, scientific mode, memory functions, keyboard input, and a full visual configuration editor. Optimised for iPhone Dashboards.

![Calculator](preview1.png)

![Scientific Mode](preview2.png)

![Visual Editor](preview3.png)

## Key Features

- **Apple-inspired Design** — dark glass card with colour-coded operator buttons, large rounded keys, auto-shrinking display font and a frosted-glass aesthetic matching the iOS Calculator app
- **Full Arithmetic** — add, subtract, multiply, divide, percentage, sign toggle and decimal input
- **Scientific Mode** — sin, cos, tan, log, ln, √, x², 1/x, π and xʸ; toggled on or off from the visual editor
- **Memory Functions** — mc, mr, m+, m− and ms; memory buttons highlight when a value is stored
- **Writes Results to HA Entities** — optionally push the calculator result to any `input_number` or `number` entity every time = is pressed
- **Keyboard Support** — type numbers and operators from a full keyboard; Backspace deletes; Escape clears; Enter evaluates
- **Haptic Feedback** — vibrates on button press on supported mobile devices (can be disabled)
- **Swipe Down to Clear** — swipe down on the display to trigger All Clear on touch screens
- **Live Expression Display** — shows the current expression above the main number as you build it
- **AC / C Toggle** — automatically switches between All Clear and Clear Entry, exactly like iOS
- **Active Operator Highlight** — the selected operator inverts to white-on-accent while waiting for the next operand
- **Visual Editor** — full WYSIWYG editor with colour pickers, entity selector and toggles — no YAML required

## Quick Start

```yaml
type: custom:cuckoo-calculator-card
```

## Credits

Built to match the visual style and editor patterns of [Crow Media Player Card](https://github.com/jamesmcginnis/crow-media-player-card).
