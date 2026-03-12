# Top Mark Report Strategy for Report on One Lecture — Movement Augmentation

## Introduction
- **Deliverable constraints (non‑negotiable):**
  - Individual assignment; **<1001 words**, with **figures and references excluded from the word count**.
  - Must **summarise or extend** the topics from **one** of the six lectures (weeks 1–2).
  - Required report structure:
    - **Context/background**
    - **Description of concepts and ideas**
    - **Applications**
    - **Limitations and future work**
  - Marked on: **clarity**, **accuracy**, and **critical analysis** of the idea.
- **Recommended topic selection (based on the provided lecture slides):**
  - Use *Principles of movement augmentation* as the chosen lecture and frame the report around:
    - A **taxonomy** of augmentation (sensory vs motor; subtypes), and
    - A **design lens**: what each class demands in hardware + interfaces + feedback and what limits adoption.
- **Word-budget (keeps you under 1001 without rushing):**
  - Context/background: ~150–200
  - Concepts/ideas: ~350–450
  - Applications: ~200–250
  - Limitations + future work: ~200–250
  - Micro-conclusion sentences can live at the end of each section; no need for a long standalone conclusion.

## Methodology
- **1) Lock the thesis early (to avoid “slide summary” writing).**
  - One sentence that *extends* the lecture: e.g., “Augmentation is best treated as a system-level coupling of actuation, command interface, and feedback; mismatches in any of the three create user burden that dominates performance.”
- **2) Extract the lecture’s “must-include” technical facts (for accuracy).**
  - Definition: augmentation extends a person’s movement abilities; **not** prosthetics/rehab substitution; **not** bounded to natural appearance; should ideally integrate into daily activities.
  - **Types of sensory augmentation:** signal / range / channel.
  - **Types of motor augmentation:** power / workspace / precision / DoF.
  - **Components of augmentation systems:** actuator, feedback device, command interface (+ software integration).
  - Known constraints called out in the lecture: human sensing is finite; sensing resolution varies across the body; augmentation is not free; interference occurs.
- **3) Add minimal external literature to convert “description” into “analysis”.**
  - Target **2–4 papers** *only*; use them to support:
    - one quantified performance claim (e.g., metabolic reduction, error reduction), and
    - one human-factors/control claim (e.g., learning burden, stability, interference, safety).
  - Keep the literature use “surgical”: every citation should either (i) back a factual claim or (ii) motivate a limitation/future work.
- **4) Use one figure to boost clarity (and save words).**
  - Suggested figure options (pick one):
    - A **taxonomy diagram**: sensory vs motor → subtypes → example technologies.
    - A **system block diagram**: command interface → controller → actuator; feedback → user; highlight where delays/noise/interference enter.
  - Captions should be “standalone” (reader can understand the point without the main text).
- **5) Build critical analysis explicitly (don’t hope the marker infers it).**
  - For each augmentation class you mention, force at least one sentence each on:
    - **Benefit mechanism** (what is being extended, and how),
    - **Requirements** (sensing/actuation/interface/feedback),
    - **Failure modes/risks** (human burden, interference, safety, misalignment),
    - **Boundary conditions** (who it helps, when it fails).
- **6) Tight editing pass for clarity under the word cap.**
  - Use short paragraphs, consistent terminology, and a “topic sentence” per paragraph.
  - Prefer **tables/figures** for comparisons (not counted in the word limit) and reserve text for interpretation.

## Analysis
- **A. Context/background (what “top marks” looks like)**
  - Establish why augmentation matters *beyond* rehab: productivity, safety, accessibility, new capabilities.
  - Clearly separate **augmentation** from prosthetics and rehabilitation (definition-level accuracy).
  - State the report’s scope: *you will cover the taxonomy and then deep-dive one representative example for analysis*.

- **B. Description of concepts and ideas (clarity + accuracy)**
  - Present the lecture’s taxonomy as a structured framework:
    - **Sensory augmentation**
      - *Signal augmentation*: alters signal characteristics (amplitude/frequency content) before the body receives it; examples: telescope, hearing aid, night-vision.
      - *Range augmentation*: extends sensing range via additional sensors; examples: “third eye” concept; remote vision.
      - *Channel augmentation*: adds new sensed channels; examples: compass/GPS-like directional cues; physiological monitors.
    - **Motor augmentation**
      - *Power augmentation*: increases user force/speed; examples: levers, bicycles, exoskeletons/exosuits.
      - *Workspace augmentation*: extends spatial reach; examples: rake, telerobotics.
      - *Precision augmentation*: increases accuracy; examples: tremor cancellation, stabilisation devices, active noise cancellation as an analogy.
      - *DoF augmentation*: increases effective degrees of freedom; examples: supernumerary fingers/thumbs/arms.
  - Tie to the “components of augmentation” triad:
    - **Actuator** (how motion/forces are generated),
    - **Command interface** (how intent becomes commands),
    - **Feedback device** (how the user gets state/intent alignment),
    - plus the **software** that links them.

- **C. Applications (move past listing)**
  - Use **2–3 applications only**, but analyse them deeply:
    - One sensory (e.g., “third eye” obstacle avoidance or oxygen monitoring),
    - One motor (e.g., exosuit for gait support),
    - Optional: one DoF example (e.g., third thumb) if you can connect it to interface/learning burden.
  - For each application, include:
    - **Use-case + user** (who benefits),
    - **Requirements** (hardware + interface + feedback),
    - **What success looks like** (a metric: error rate, load reduction, time, endurance, safety proxy),
    - **Integration reality check** (comfort, don/doff, cognition, calibration, power/weight).

- **D. Limitations and future work (where critical analysis is most visible)**
  - Anchor limitations in the lecture and extend thoughtfully:
    - **Human sensing is finite** → augmentation competes for attention; future work: adaptive feedback scheduling, perceptual encoding, multimodal cue design.
    - **Interference is inevitable** → future work: robust sensor fusion, context awareness, user-adaptive filtering.
    - **Augmentation is not free** (energy, weight, discomfort, learning time) → future work: soft actuation, lightweight materials, shared autonomy, self-calibration.
    - **Sensing resolution varies across the body** → future work: place feedback where perception is highest; personalise mapping.
  - Add one “engineering realism” paragraph:
    - safety and failure handling, misalignment between inferred intent and user intent, latency/stability trade-offs, and deployment constraints.

## Conclusions
- **Finish with 4–6 sentences** that:
  - Restate the thesis,
  - Summarise the taxonomy (1–2 sentences),
  - Name the dominant bottleneck(s) (typically interface + user burden + interference),
  - Give **2–3 concrete future directions** tied to those bottlenecks.
- Avoid introducing new facts here; conclusions should be synthesis, not new content.

## Checklist
- **Requirements compliance**
  - [ ] ≤ 1000 words for main text (**figures + references excluded**); word count checked in your editor.
  - [ ] Report is clearly tied to **one** lecture (weeks 1–2) and either **summarises or extends** it.
  - [ ] Headings follow the required structure:
    - [ ] Context/background
    - [ ] Concepts/ideas
    - [ ] Applications
    - [ ] Limitations + future work
- **Rubric: Clarity**
  - [ ] Definitions appear early; terms used consistently (augmentation vs prosthetics vs rehabilitation).
  - [ ] Each paragraph has one main point; topic sentences used.
  - [ ] One figure or table improves readability and reduces text load; caption is standalone.
- **Rubric: Accuracy**
  - [ ] Every factual claim that is not “lecture-level” is supported by a citation.
  - [ ] No over-claiming (results and limitations are stated with appropriate conditions).
  - [ ] Technical descriptions match lecture taxonomy and component definitions.
- **Rubric: Critical analysis**
  - [ ] Not just a list of devices: each example includes requirements, trade-offs, and failure modes.
  - [ ] Limitations are specific (human burden, interference, cost/weight/energy, intent mismatch).
  - [ ] Future work is actionable and logically tied to stated limitations.
- **Final quality gates**
  - [ ] First read-through: can a peer summarise your thesis in one sentence?
  - [ ] Second read-through: remove redundancy; replace long explanations with a diagram/table where possible.
  - [ ] Spell/grammar check and consistent referencing style.

