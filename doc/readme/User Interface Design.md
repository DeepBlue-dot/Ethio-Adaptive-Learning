# User Interface Design Documentation

The Ethio-Adaptive-Learning platform features a high-fidelity, responsive User Interface (UI) designed to facilitate a focused and productive learning experience for Grade 12 students. The design philosophy balances modern web aesthetics (Glassmorphism, MD3-inspired layouts) with strict instructional utility.

## 1. Design Philosophy

The UI is built on three core pillars:
*   **Instructional Clarity**: Minimizing cognitive load by using consistent color-coding for learning states (e.g., Green for Mastered, Amber for Review Needed).
*   **Adaptive Feedback**: Real-time visualization of knowledge growth through progress bars and mastery probability indicators.
*   **Studio Aesthetic**: A professional, "mission-control" feel for both students and administrators, emphasizing that learning is a data-driven journey.

---

## 2. Student Interface Design

The student section is designed to be the "Learning Engine," guiding users from discovery to mastery through a structured yet adaptive path.

### 2.1. Layout and Navigation
The student experience utilizes a **Rail-and-Shell** layout pattern:
*   **Sidebar (The Rail)**: A persistent left-hand navigation (`StudentSidebar`) providing quick access to the Dashboard, Curriculum, Reviews, Analytics, and Account. It collapses on smaller screens into a mobile-friendly menu.
*   **Header**: A sticky top bar displaying current navigation context, streak status, and the user profile menu.
*   **Main Shell**: A responsive container (`WorkspaceShell`) that hosts the primary content, utilizing a wide viewport for dashboards and a focused column for learning content.

### 2.2. Core Student Modules

#### 2.2.1. Student Dashboard (Today's Hub)
The central entry point for every learner.
*   **Mastery Snapshot**: A hero section displaying Level, Total XP, and Daily Streak, alongside an "Overall Progress" card with a high-fidelity circular or linear `MasteryBar`.
*   **Next Best Actions**: A dynamic list of recommended concepts. This uses the **BKT Engine** to prioritize:
    1.  Concepts that need review (due to memory decay).
    2.  Concepts currently in progress.
    3.  Newly unlocked "Fringe" concepts.
*   **Learning Mix**: A visualization of the student's distribution across learning states (Locked, Available, Mastered).

#### 2.2.2. Curriculum Explorer
A hierarchical, map-based view of the entire Grade 12 curriculum.
*   **Hierarchy**: Organized by **Course → Unit → Concept**.
*   **Discovery Cards**: Each concept is represented by a `ConceptExploreCard` showing its thumbnail, mastery level, and content density (number of blocks, questions, and media assets).
*   **Locking Mechanism**: Clear visual distinction between "Unlocked" and "Locked" nodes, with tooltips explaining unmet prerequisites.

#### 2.2.3. Concept Learning Workspace
The most critical page for instruction.
*   **Pathway Recommendation**: Uses AI to suggest either the **Learn Path** (guided reading + practice) or the **Challenge Path** (direct exam) based on current mastery.
*   **Prerequisite Mapping**: A dedicated section showing the status of foundational concepts, ensuring students understand the "why" behind the curriculum sequence.
*   **Analytics Snapshot**: Concept-specific performance data, including average time per question and checkpoint pass rates.

#### 2.2.4. Learning Analytics (Mastery Signal)
A data-heavy dashboard for deep self-reflection.
*   **Performance Metrics**: Visualizes average practice accuracy and pacing (time per question).
*   **Course Progress**: Detailed breakdown of mastery percentages across different subjects (e.g., Math vs. Physics).
*   **Topic Health**: Identifies "Strongest Concepts" and "Concepts to Watch" (where the student struggles most), allowing for targeted study.

---

## 3. Reusable UI Components

The system uses a set of high-fidelity components to ensure consistency across all platform modules:
*   **`ConceptCard`**: The standard unit of navigation; displays title, progress, and type badges (Video, Sim, LaTeX).
*   **`MasteryBar`**: A custom progress component that handles gradients and percentage labels, used for both student progress and administrative analytics.
*   **`StatusBadge`**: A color-coded chip representing the `MasteryStatus` enum (LOCKED, FRINGE, IN_PROGRESS, MASTERED, REVIEW_NEEDED).
*   **`SummaryMetric`**: Large-format cards for "Hero" stats like Level, XP, and active student counts.

## 4. Visual Identity

The platform’s visual identity is designed to be modern, professional, and accessible.
*   **Colors**: A sophisticated palette using `Primary` (Indigo/Blue) for action elements, `Surface` (Glassmorphic White/Grey) for containers, and high-contrast `On-Surface` text for readability.
*   **Typography**: Employs **Black/Extrabold** display headings for clear hierarchy and **Medium/Regular** weights for instructional body copy.
*   **Interactivity**: Leverages **Framer Motion** for spring-based transitions, hover-scale effects on cards, and staggered list entries to make the platform feel "alive" and responsive.

---

## 5. Administrative and Content Authoring UI

The administrator and course writer interface, known as **EthioPrep Studio**, is designed as a professional content production suite. It prioritizes data visibility and efficient curriculum orchestration.

### 5.1. Studio Portal (The Control Center)
The top-level entry for staff, providing a high-level overview of system health.
*   **Module Navigation**: Uses high-fidelity `ModuleCard` components for broad navigation to Curriculum, Intelligence, Assets, and Governance.
*   **System Status**: A real-time heartbeat indicator showing the status of the adaptive engine and server infrastructure.
*   **Quick Actions**: A dedicated grid for common tasks (e.g., "Write Assessment", "Upload Media") to bypass deep navigation.

### 5.2. Curriculum Explorer
A dedicated tool for managing the platform's knowledge graph.
*   **Visual Tree Hierarchy**: An interactive, nested list of Courses, Units, and Concepts.
*   **Direct CRUD Access**: Integrated buttons within the tree to add or remove nodes at any level (Course, Unit, or Concept).
*   **Status Synchronization**: Real-time badges showing the publication state (Draft vs. Live) of every node in the graph.

### 5.3. Studio Dashboard (Production Pipeline)
The workspace for active course development.
*   **Publishing Pulse**: Visualizes concept maturity, content density, and draft velocity across all courses.
*   **Project Cards**: High-density cards for each course showing its completion percentage, last activity, and primary author.
*   **Control Center**: A specialized panel for each course providing direct access to the Concept Builder and Review Queue.

### 5.4. Concept Builder (The Authoring Engine)
A state-of-the-art, block-based visual editor.
*   **Concept Canvas**: A "What-You-See-Is-What-You-Get" (WYSIWYG) editing area where authors can drag and drop instructional modules.
*   **Module Library**: A sliding shelf providing access to various content types:
    *   **Text/Markdown**: For instructional narrative.
    *   **LaTeX**: For mathematical formulas and equations.
    *   **Interactive Simulations**: Integration with PhET labs.
    *   **Media Assets**: Image and YouTube video embeds.
*   **Block Inspector**: A context-aware sidebar that appears when a module is selected, allowing for precise control over adaptive parameters, hierarchy levels, and styling.
*   **Responsive Previews**: A one-click toggle to simulate how content will appear on Mobile, Tablet, and Desktop devices.

---

## 6. Implementation of Design Patterns

The UI utilizes several advanced frontend patterns:
*   **Glassmorphism**: Extensive use of semi-transparent surfaces with backdrop-blur effects to create a layered, "Mission Control" aesthetic.
*   **Optimistic UI**: Server Actions are paired with local state updates to provide instant feedback during content authoring and mastery updates.
*   **Hydration Safety**: A `Mount-First` rendering pattern is used in complex Studio components to ensure stable transitions between server-side pre-rendering and client-side interactivity.
*   **Spring Animations**: All UI interactions (opening sidebars, dragging blocks, updating progress) use spring physics for a premium, tactile feel.

