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

The administrator and course writer interface, known as **EthioPrep Studio**, is designed as a professional content production suite. It prioritizes data visibility, rapid orchestration, and a premium "Mission Control" aesthetic.

### 5.1. Studio Portal (The Launchpad)
The top-level entry for staff, providing a high-level overview of system status and modular navigation.
*   **Hero / System Pulse**: Features a real-time heartbeat indicator showing system operational status and a personalized greeting.
*   **Modular Navigation**: Utilizes high-fidelity `ModuleCard` components for broad navigation to the platform's core subsystems:
    *   **Curriculum**: The gateway to the Studio and curriculum orchestration.
    *   **Intelligence**: Real-time pedagogical health and adaptive engine diagnostics.
    *   **Asset Library**: Centralized repository for all instructional media.
    *   **Governance**: Oversight for compliance, audit trails, and security.
*   **Quick Actions**: A dedicated grid for bypassing deep navigation to perform common tasks (e.g., "Create New Course", "Write Assessment").

### 5.2. Studio & Curriculum Orchestration
The primary workspace for developing and maintaining the Grade 12 curriculum graph.
*   **Studio Dashboard (Production Pipeline)**:
    *   **Publishing Pulse**: Advanced data visualizations showing concept maturity, content density, and draft velocity.
    *   **Course Project Cards**: Detailed tracking for each subject, showing publication percentages and author activity.
*   **Curriculum Explorer**:
    *   **Interactive Tree**: A nested, visual representation of the Course → Unit → Concept hierarchy.
    *   **Direct Actions**: Integrated buttons for managing nodes (Add/Remove) directly from the map.
*   **Concept Builder (WYSIWYG Editor)**:
    *   **Modular Canvas**: A drag-and-drop workspace for building lessons with interactive blocks (LaTeX, Simulations, Media).
    *   **Responsive Multi-Preview**: Instantly toggle between Desktop, Tablet, and Mobile views to ensure content fidelity.
    *   **Block Inspector**: Contextual property panels for fine-tuning adaptive BKT parameters and pedagogical metadata.

### 5.3. Intelligence & Quality Engine
A data-driven module for analyzing learning effectiveness and curriculum integrity.
*   **Global Pulse**: High-level signals for active learners, average mastery trends, and curriculum integrity scores.
*   **Actionable Workspaces**:
    *   **Question Analytics**: Deep-dive into EHSLCE question success rates and discrimination indexes.
    *   **Calibration Lab**: Technical interface for fine-tuning BKT priors based on live student performance data.
    *   **Automated Auditing**: Identifies "Orphan Nodes" and "Struggle Points" where students are consistently failing.

### 5.4. Resource & Asset Management
A unified hub for managing instructional assets and reusable content snippets.
*   **Unified Browser**: A high-performance grid for filtering and searching through images, video embeds, and text modules.
*   **Bulk Operations**: A floating action bar for performing massive publication or deletion tasks across the library.
*   **Resource Inspector**: A specialized sidebar for editing asset metadata and viewing usage cross-references.

### 5.5. Platform & Infrastructure Governance
Tools for managing the platform's technical foundation.
*   **User & Role Management**: Advanced RBAC (Role-Based Access Control) interface for managing staff permissions and student accounts.
*   **API & Security**: Control center for managing system secrets, security policies, and third-party integrations.
*   **Regional Configuration**: Manages Grade 12 curriculum standards and regional localization settings.

---

## 6. Design Systems and Patterns

The platform utilizes several advanced frontend patterns to maintain its premium feel:
*   **Glassmorphism**: Semi-transparent, blurred layers (using `backdrop-blur`) to create depth and focus.
*   **Atomic Components**: Consistent use of reusable primitives (`MasteryBar`, `StatusBadge`, `ActionLink`) across both Student and Admin domains.
*   **Fluid Motion**: Leveraging **Framer Motion** for spring-based physics, staggered list entries, and micro-interactions that provide tactile feedback.
*   **Mount-First Lifecycle**: Prevents hydration mismatches in complex interactive components by stabilizing the React tree before rendering dynamic elements.

