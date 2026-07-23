(() => {
  const viewport = document.querySelector(".viewport");
  const lab = document.querySelector(".lab");
  const lightSurface = document.querySelector("[data-light-surface]");
  const direction = {
    titanium: {
      letter: "A",
      name: "Obsidian Titanium",
      copy: "Quiet technical luxury: bead-blasted graphite, cool satin titanium and restrained cyan energy.",
      chassis: "Bead-blasted graphite",
      control: "Satin titanium",
      accent: "Cold cyan emission",
      code: "A / OT–01",
    },
    nickel: {
      letter: "B",
      name: "Black Nickel",
      copy: "Denser tactile luxury: black nickel, warmer machined highlights and deeper mechanical contact.",
      chassis: "Warm black nickel",
      control: "Machined dark nickel",
      accent: "Selective cyan emission",
      code: "B / BN–01",
    },
  };

  const knobs = new Map();
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const decimalPlaces = number => `${number}`.includes(".") ? `${number}`.split(".")[1].length : 0;

  function fitLab() {
    const scale = Math.min(window.innerWidth / 1180, window.innerHeight / 680, 1);
    document.documentElement.style.setProperty("--fit", `${Math.max(.25, scale)}`);
  }

  function formatValue(id, value) {
    if (id === "tune") {
      const rounded = Math.round(value);
      const prefix = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
      return `${prefix}${Math.abs(rounded)} <small>ct</small>`;
    }
    return `${value.toFixed(1)} <small>ms</small>`;
  }

  function setKnobValue(knob, requested) {
    const id = knob.dataset.knob;
    const state = knobs.get(id);
    const stepped = Math.round(requested / state.step) * state.step;
    const value = clamp(Number(stepped.toFixed(decimalPlaces(state.step))), state.min, state.max);
    const normalized = (value - state.min) / (state.max - state.min);
    const turn = -135 + normalized * 270;
    state.value = value;
    knob.style.setProperty("--turn", `${turn}deg`);
    knob.setAttribute("aria-valuenow", `${value}`);
    document.querySelector(`[data-output="${id}"]`).innerHTML = formatValue(id, value);
  }

  function adjustKnob(knob, delta, fine = false) {
    const state = knobs.get(knob.dataset.knob);
    const factor = fine ? .1 : 1;
    setKnobValue(knob, state.value + delta * factor);
  }

  document.querySelectorAll("[data-knob]").forEach(knob => {
    const state = {
      min: Number(knob.dataset.min),
      max: Number(knob.dataset.max),
      step: Number(knob.dataset.step),
      defaultValue: Number(knob.dataset.default),
      value: Number(knob.dataset.default),
    };
    knobs.set(knob.dataset.knob, state);
    setKnobValue(knob, state.value);

    knob.addEventListener("pointerdown", event => {
      if (event.button !== 0) return;
      event.preventDefault();
      knob.focus({ preventScroll: true });
      knob.setPointerCapture(event.pointerId);
      knob.classList.add("dragging");
      const startY = event.clientY;
      const startValue = state.value;
      const span = state.max - state.min;

      const move = moveEvent => {
        const sensitivity = moveEvent.shiftKey ? 1250 : 260;
        setKnobValue(knob, startValue + (startY - moveEvent.clientY) * span / sensitivity);
      };
      const finish = () => {
        knob.classList.remove("dragging");
        knob.removeEventListener("pointermove", move);
        knob.removeEventListener("pointerup", finish);
        knob.removeEventListener("pointercancel", finish);
      };

      knob.addEventListener("pointermove", move);
      knob.addEventListener("pointerup", finish);
      knob.addEventListener("pointercancel", finish);
    });

    knob.addEventListener("wheel", event => {
      event.preventDefault();
      adjustKnob(knob, event.deltaY < 0 ? state.step : -state.step, event.shiftKey);
    }, { passive: false });

    knob.addEventListener("keydown", event => {
      const large = (state.max - state.min) / 10;
      if (event.key === "ArrowUp" || event.key === "ArrowRight") adjustKnob(knob, state.step, event.shiftKey);
      else if (event.key === "ArrowDown" || event.key === "ArrowLeft") adjustKnob(knob, -state.step, event.shiftKey);
      else if (event.key === "PageUp") adjustKnob(knob, large, event.shiftKey);
      else if (event.key === "PageDown") adjustKnob(knob, -large, event.shiftKey);
      else if (event.key === "Home") setKnobValue(knob, state.min);
      else if (event.key === "End") setKnobValue(knob, state.max);
      else return;
      event.preventDefault();
    });

    knob.addEventListener("dblclick", () => setKnobValue(knob, state.defaultValue));
  });

  function selectTheme(theme) {
    const content = direction[theme];
    viewport.dataset.theme = theme;
    document.querySelectorAll("[data-theme-select]").forEach(button => {
      const selected = button.dataset.themeSelect === theme;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", `${selected}`);
    });
    document.querySelector("[data-direction-letter]").textContent = content.letter;
    document.querySelector("[data-direction-name]").textContent = content.name;
    document.querySelector("[data-direction-copy]").textContent = content.copy;
    document.querySelector("[data-recipe-chassis]").textContent = content.chassis;
    document.querySelector("[data-recipe-control]").textContent = content.control;
    document.querySelector("[data-recipe-accent]").textContent = content.accent;
    document.querySelector("[data-direction-code]").textContent = content.code;
  }

  document.querySelectorAll("[data-theme-select]").forEach(button => {
    button.addEventListener("click", () => selectTheme(button.dataset.themeSelect));
  });

  const lightButton = document.querySelector("[data-light-toggle]");
  lightButton.addEventListener("click", () => {
    const studio = viewport.dataset.light !== "flat";
    viewport.dataset.light = studio ? "flat" : "studio";
    lightButton.setAttribute("aria-pressed", `${!studio}`);
    lightButton.querySelector("b").textContent = studio ? "FLAT" : "STUDIO";
  });

  const latch = document.querySelector("[data-latch]");
  latch.addEventListener("click", () => {
    const active = latch.getAttribute("aria-pressed") !== "true";
    latch.setAttribute("aria-pressed", `${active}`);
    latch.querySelector("[data-latch-state]").textContent = active ? "ON" : "OFF";
  });

  const toggle = document.querySelector("[data-toggle]");
  toggle.addEventListener("click", () => {
    const active = toggle.getAttribute("aria-pressed") !== "true";
    toggle.setAttribute("aria-pressed", `${active}`);
    toggle.querySelector("[data-toggle-state]").textContent = active ? "ON" : "OFF";
  });

  document.querySelector("[data-reset]").addEventListener("click", () => {
    document.querySelectorAll("[data-knob]").forEach(knob => {
      setKnobValue(knob, knobs.get(knob.dataset.knob).defaultValue);
    });
    latch.setAttribute("aria-pressed", "false");
    latch.querySelector("[data-latch-state]").textContent = "OFF";
    toggle.setAttribute("aria-pressed", "true");
    toggle.querySelector("[data-toggle-state]").textContent = "ON";
    viewport.dataset.light = "studio";
    lightButton.setAttribute("aria-pressed", "true");
    lightButton.querySelector("b").textContent = "STUDIO";
  });

  lightSurface.addEventListener("pointermove", event => {
    if (viewport.dataset.light !== "studio" || event.target.closest("[data-knob]")?.classList.contains("dragging")) return;
    const bounds = lightSurface.getBoundingClientRect();
    const x = clamp((event.clientX - bounds.left) / bounds.width * 100, 12, 88);
    const y = clamp((event.clientY - bounds.top) / bounds.height * 100, 6, 72);
    viewport.style.setProperty("--light-x", `${x}%`);
    viewport.style.setProperty("--light-y", `${y}%`);
  });

  const resizeObserver = new ResizeObserver(fitLab);
  resizeObserver.observe(document.documentElement);
  window.addEventListener("resize", fitLab);
  fitLab();
  selectTheme("titanium");
  lab.dataset.ready = "true";
})();
