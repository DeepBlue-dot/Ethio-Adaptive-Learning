# Platform Architecture: Subsystem Decomposition

To ensure modularity, scalability, and maintainability, the platform architecture is decomposed into a collection of specialized functional subsystems. Each subsystem encapsulates a specific domain of functionality and communicates with other subsystems through clearly defined interfaces.

This modular design enables the adaptive learning platform to be implemented as a set of loosely coupled components, allowing individual subsystems to be developed, tested, and maintained independently while contributing to the overall adaptive intelligence of the platform.

The system is divided into the following functional subsystems:

---

## 1. Identity and Profile Subsystem
The Identity and Profile Subsystem manages the lifecycle of user accounts and maintains persistent learner identities across sessions. It ensures secure access to the platform and stores global user attributes required for personalization and progress tracking.

### Responsibilities
* User registration and login authentication
* Secure password storage using hashing mechanisms
* Session management using JWT (JSON Web Tokens)
* Storage of learner profile data and global learning state
* Maintenance of motivational metrics used for gamification

### Stored Profile Attributes
The subsystem maintains several learner-level attributes including:
* Total experience points (XP)
* Current learning level
* Daily learning streak
* Overall progress through the curriculum

These attributes support both personalization and the platform’s gamification system.

### Key Components
* **Authentication Service** – handles login, session validation, and token generation
* **User Profile Manager** – stores learner metadata and global learning statistics

---

## 2. Knowledge Structure Subsystem (KST Engine)
The Knowledge Structure Subsystem provides the curriculum intelligence of the platform. It models the Grade 12 Mathematics curriculum as a Directed Acyclic Graph (DAG) in which:
* **Nodes** represent mathematical concepts
* **Edges** represent prerequisite relationships between concepts

This structure ensures that learning progression follows the logical dependencies of the curriculum.

### Responsibilities
* Maintaining the hierarchical structure of curriculum concepts
* Determining which concepts are currently available for a learner
* Enforcing prerequisite-based learning progression

### Formula
Let $C_T$ be the target concept and $P$ be the set of all immediate prerequisite concepts. Let $	heta$ represent the required mastery threshold (e.g., 0.90). 

The target concept is unlocked if and only if the minimum mastery probability among all prerequisites is greater than or equal to the threshold:

$$\min_{p \in P} (Mastery_p) \ge 	heta$$

---

## 3. Concept Mastery Subsystem (BKT Engine)
The Concept Mastery Subsystem provides the probabilistic learning intelligence of the platform. It uses Bayesian Knowledge Tracing (BKT) to estimate the latent knowledge state of each learner for every micro-concept.

### Responsibilities
* Estimating student mastery probabilities
* Updating mastery states based on assessment outcomes
* Maintaining probabilistic learning parameters per concept

Standard BKT updates the probability of a student knowing a concept in a two-step process after every assessment response. The four standard parameters are initial knowledge ($P(L_0)$), probability of learning/transit ($P(T)$), probability of guessing ($P(G)$), and probability of slipping ($P(S)$).

### Step 2A: The Evidence Update
First, update the current mastery estimate based on whether the student's response was Correct or Incorrect.

**If the response was Correct:**
$$P(L_n | Correct) = \frac{P(L_{n-1}) \cdot (1 - P(S))}{P(L_{n-1}) \cdot (1 - P(S)) + (1 - P(L_{n-1})) \cdot P(G)}$$

**If the response was Incorrect:**
$$P(L_n | Incorrect) = \frac{P(L_{n-1}) \cdot P(S)}{P(L_{n-1}) \cdot P(S) + (1 - P(L_{n-1})) \cdot (1 - P(G))}$$

### Step 2B: The Transit Update
Next, account for the probability that the student learned the concept simply by going through the exercise (the transit probability). This calculates the prior probability for the next interaction:

$$P(L_{n+1}) = P(L_n | Evidence) + (1 - P(L_n | Evidence)) \cdot P(T)$$

---

## 4. Retention and Review Subsystem (Memory Engine)
The Retention Subsystem models the temporal stability of knowledge and schedules concept reviews using principles derived from the Ebbinghaus Forgetting Curve and spaced repetition theory.

### Responsibilities
* Estimating knowledge retention over time
* Scheduling review sessions before mastery decays significantly
* Reinforcing long-term memory through spaced practice

### Formula
Let $M_0$ be the mastery probability immediately after the last successful interaction, $t$ be the elapsed time since that interaction, and $d$ be the decay rate specific to the learner or the concept difficulty.

The time-adjusted mastery probability is:
$$M(t) = M_0 \cdot e^{-d \cdot t}$$

**Review Trigger Condition:**
The Retention Engine flags a concept as "Review Needed" when this decayed mastery falls below the acceptable retention threshold $\theta_{retention}$:
$$M(t) < \theta_{retention}$$

*(The decay rate $d$ can be statically defined per difficulty tier, or dynamically optimized per student using historical spaced repetition data)*

---

## 5. Assessment and Adaptive Delivery Subsystem
The Assessment and Adaptive Delivery Subsystem orchestrates the interaction between the learner and the platform’s question bank. It delivers questions, manages assessment modes, and implements micro-level adaptivity.

### Responsibilities
* Selecting questions appropriate to the learner’s mastery level
* Delivering adaptive practice and concept exams
* Collecting learner responses and forwarding them to the BKT subsystem

### Difficulty Tiering
Questions are categorized into three difficulty tiers based on estimated mastery probability.

| Mastery Probability | Difficulty Tier |
| :--- | :--- |
| $P(L) < 0.40$ (Low) | Tier 1 – Easy |
| $0.40 \le P(L) < 0.80$ (Medium) | Tier 2 – Medium |
| $P(L) \ge 0.80$ (High) | Tier 3 – Hard |

This tiered structure maintains the learner within their Zone of Proximal Development, ensuring that problems are neither trivial nor excessively difficult.

---

## 6. AI Socratic Tutoring Subsystem
The AI Tutoring Subsystem extends the platform beyond assessment by providing interactive conceptual guidance.

### Responsibilities
* Generating conceptual hints
* Supporting guided problem solving
* Encouraging reasoning through Socratic questioning

### Mechanism
The subsystem uses Retrieval-Augmented Generation (RAG) to produce context-aware tutoring responses. When a learner encounters difficulty, the system retrieves:
1. Relevant curriculum material
2. Concept explanations
3. Historical interaction data

This information is used to generate guided responses that encourage conceptual understanding rather than simply providing answers. To preserve educational value, the system intentionally avoids revealing final numerical solutions.

---

## 7. Gamification and Motivation Subsystem
To maintain learner engagement, the platform includes a Gamification Subsystem that rewards consistent learning behavior.

### Responsibilities
* Awarding experience points (XP) for completed activities
* Managing learner levels and achievement badges
* Tracking daily learning streaks

These motivational elements encourage sustained engagement with the learning platform.

---

## 8. Learning Analytics Subsystem
The Learning Analytics Subsystem collects and analyzes interaction data generated during the learning process.

### Responsibilities
* Recording learner interactions with content and assessments
* Monitoring concept mastery progression
* Providing analytics for instructors and system improvement

### Example Metrics
* Average attempts required to master a concept
* Time spent studying instructional materials
* Concept-level mastery rates
* Review success frequency

These insights enable data-driven improvements to the adaptive algorithms.

---

## 9. Content Management Subsystem (CMS)
The Content Management Subsystem (CMS) enables administrators and educators to create, organize, and maintain the instructional content used by the adaptive learning platform. It provides tools for managing curriculum concepts, instructional materials, question banks, and prerequisite relationships without requiring direct modification of the underlying database.

This subsystem ensures that the learning platform remains flexible, maintainable, and adaptable to curriculum updates.

### Responsibilities
The CMS subsystem performs several key functions:
* Creating and editing curriculum concepts
* Managing prerequisite relationships between concepts
* Uploading and editing instructional learning materials
* Creating and organizing assessment questions
* Assigning difficulty tiers to questions
* Managing worked examples and solution explanations

---

## Subsystem Interplay
The modular architecture ensures a coordinated operational flow across subsystems:

1. **Identity and Profile** authenticates the learner and loads their profile.
2. **Knowledge Structure** determines which concepts are currently accessible.
3. **Assessment and Adaptive Delivery** presents questions and exams.
4. **Concept Mastery (BKT)** updates mastery probabilities based on learner responses.
5. **Retention** monitors knowledge decay and schedules reviews.
6. **AI Tutoring** provides conceptual guidance when learners encounter difficulty.
7. **Gamification** rewards progress and maintains engagement.
8. **Learning Analytics** records interactions and generates system insights.

This modular decomposition allows each adaptive component to evolve independently while maintaining overall system coherence, scalability, and maintainability.