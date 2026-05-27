import { importGrade12Math } from "../../scripts/import-grade12-math.mjs"

export async function seedCurriculum(prisma, writerId) {
  console.info("--- Provisioning Courseware ---")
  const result = await importGrade12Math({
    prisma,
    authorId: writerId,
  })
  
  // Synthetic Friction Points
  const firstUnit = await prisma.unit.findFirst()
  if (firstUnit) {
    await prisma.concept.upsert({
      where: { unitId_slug: { unitId: firstUnit.id, slug: "orphaned-concept-test" } },
      update: {},
      create: {
        unitId: firstUnit.id,
        slug: "orphaned-concept-test",
        title: "Orphaned Concept (Testing)",
        status: "PUBLISHED"
      }
    })
    
    await prisma.concept.upsert({
      where: { unitId_slug: { unitId: firstUnit.id, slug: "complex-trig-friction" } },
      update: {},
      create: {
        unitId: firstUnit.id,
        slug: "complex-trig-friction",
        title: "Complex Trigonometric Identities",
        status: "PUBLISHED",
        pT: 0.02,
        pS: 0.35,
        pLo: 0.05
      }
    })
  }

  return result
}

export async function addQuestions(prisma, conceptId, authorId, questions) {
  for (const question of questions) {
    await prisma.question.upsert({
      where: { conceptId_slug: { conceptId, slug: question.slug } },
      update: {
        usage: question.usage,
        difficulty: question.difficulty,
        content: question.content,
        correctAnswer: question.correctAnswer,
        distractors: question.distractors,
        hintText: question.hintText,
        explanation: question.explanation,
        authorId,
        status: "PUBLISHED"
      },
      create: {
        conceptId,
        slug: question.slug,
        usage: question.usage,
        difficulty: question.difficulty,
        content: question.content,
        correctAnswer: question.correctAnswer,
        distractors: question.distractors,
        hintText: question.hintText,
        explanation: question.explanation,
        authorId,
        status: "PUBLISHED"
      }
    })
  }
}

export async function enrichImportedMathContent({ prisma, assetsByPublicId, conceptIdsByReference, writerId }) {
  console.info("--- Enriching Grade 12 Math Lessons With Media Blocks ---")
  const linearConceptId = conceptIdsByReference["functions-and-graphs/linear-functions"]
  const quadraticConceptId = conceptIdsByReference["functions-and-graphs/quadratic-functions"]
  const limitsConceptId = conceptIdsByReference["foundations-of-calculus/limits"]

  if (linearConceptId) {
    const checkpoint = await prisma.question.findFirst({
      where: { conceptId: linearConceptId, usage: "CHECKPOINT", status: "PUBLISHED" },
      select: { id: true }
    })

    await prisma.concept.update({
      where: { id: linearConceptId },
      data: {
        contentBlocks: [
          {
            id: "linear-hero-image",
            type: "image",
            assetId: assetsByPublicId["math-ref-001"].id,
            alt: "Linear function visual guide",
            caption: "Start by matching the visual steepness of a line to its slope."
          },
          {
            id: "linear-intuition",
            type: "paragraph",
            title: "Slope as a rate of change",
            text: "A linear function changes by the same amount every time x increases by 1. In f(x) = mx + b, m controls steepness and direction, while b shows where the graph crosses the y-axis."
          },
          {
            id: "linear-video",
            type: "video",
            url: assetsByPublicId["math-video-001"].url,
            videoId: assetsByPublicId["math-video-001"].videoId,
            caption: "Watch the line change before you try the checkpoint."
          },
          {
            id: "linear-simulation",
            type: "phet",
            assetId: assetsByPublicId["math-sim-001"].id,
            title: "Explore slope and intercept"
          },
          ...(checkpoint ? [{
            id: "linear-check-embed",
            type: "quiz",
            questionId: checkpoint.id
          }] : [])
        ]
      }
    })
  }

  if (quadraticConceptId) {
    await addQuestions(prisma, quadraticConceptId, writerId, [
      {
        slug: "identify-axis-practice",
        usage: "PRACTICE",
        difficulty: "MEDIUM",
        content: "What is the axis of symmetry of `y = (x - 3)^2 + 4`?",
        correctAnswer: "x = 3",
        distractors: ["x = -3", "y = 4", "x = 4"],
        hintText: "In vertex form, the axis of symmetry passes through the x-coordinate of the vertex.",
        explanation: "The vertex is `(3, 4)`, so the vertical axis of symmetry is `x = 3`."
      },
      {
        slug: "quadratic-roots-practice",
        usage: "PRACTICE",
        difficulty: "MEDIUM",
        content: "If `y = (x - 2)(x + 5)`, what are the roots?",
        correctAnswer: "2 and -5",
        distractors: ["-2 and 5", "2 and 5", "-2 and -5"],
        hintText: "Set each factor equal to zero.",
        explanation: "`x - 2 = 0` gives `x = 2`, and `x + 5 = 0` gives `x = -5`."
      }
    ])

    await prisma.concept.update({
      where: { id: quadraticConceptId },
      data: {
        contentBlocks: [
          {
            id: "quadratic-visual",
            type: "image",
            assetId: assetsByPublicId["math-ref-001"].id,
            alt: "Parabola visual reference",
            caption: "A parabola's turning point controls the story of the graph."
          },
          {
            id: "quadratic-focus",
            type: "paragraph",
            title: "Three ways to read a quadratic",
            text: "Standard form helps compare coefficients, factored form reveals roots, and vertex form reveals the turning point. Switch forms based on what the question asks."
          }
        ]
      }
    })
  }

  if (limitsConceptId) {
    await addQuestions(prisma, limitsConceptId, writerId, [
      {
        slug: "limit-linear-practice",
        usage: "PRACTICE",
        difficulty: "EASY",
        content: "Find `\\lim_{x \\to 3} (2x + 1)`.",
        correctAnswer: "7",
        distractors: ["6", "4", "9"],
        hintText: "For a continuous linear function, substitute the target x-value.",
        explanation: "`2(3) + 1 = 7`, so the limit is `7`."
      },
      {
        slug: "limit-checkpoint-polynomial",
        usage: "CHECKPOINT",
        difficulty: "MEDIUM",
        content: "Find `\\lim_{x \\to -1} (x^2 + 3x)`.",
        correctAnswer: "-2",
        distractors: ["2", "4", "0"],
        hintText: "Polynomial limits can be evaluated by direct substitution.",
        explanation: "`(-1)^2 + 3(-1) = 1 - 3 = -2`."
      }
    ])

    await prisma.concept.update({
      where: { id: limitsConceptId },
      data: {
        contentBlocks: [
          {
            id: "limits-intuition",
            type: "paragraph",
            title: "Approaching without necessarily arriving",
            text: "A limit asks where the output is heading as x gets very close to a target value from either side."
          },
          {
            id: "limits-sim",
            type: "phet",
            assetId: assetsByPublicId["math-sim-001"].id,
            title: "Explore change near a target"
          }
        ]
      }
    })
  }
}

export async function seedDemoCourses({ prisma, assetsByPublicId, writerId }) {
  console.info("--- Adding Demo Science Courses ---")
  const coursePacks = [
    {
      slug: "grade-12-physics",
      title: "Grade 12 Physics",
      description: "Motion, forces, energy, and exam-style problem solving with interactive simulations.",
      units: [
        {
          slug: "mechanics",
          title: "Mechanics",
          order: 1,
          concepts: [
            {
              slug: "projectile-motion",
              title: "Projectile Motion",
              description: "Split motion into horizontal and vertical components to predict range, height, and time.",
              image: "physics-motion-001",
              video: "physics-video-001",
              simulation: "physics-sim-001",
              paragraphs: [
                "Projectile motion becomes easier when you treat horizontal motion as constant velocity and vertical motion as accelerated motion.",
                "The same time value connects both directions, so solve the direction with enough information first."
              ],
              questions: [
                {
                  slug: "projectile-horizontal-practice",
                  usage: "PRACTICE",
                  difficulty: "EASY",
                  content: "Ignoring air resistance, what happens to the horizontal velocity of a projectile?",
                  correctAnswer: "It remains constant",
                  distractors: ["It increases steadily", "It becomes zero at the top", "It changes direction"],
                  hintText: "Gravity acts vertically.",
                  explanation: "Without air resistance, no horizontal force acts, so horizontal velocity remains constant."
                },
                {
                  slug: "projectile-acceleration-practice",
                  usage: "PRACTICE",
                  difficulty: "MEDIUM",
                  content: "What is the vertical acceleration of a projectile near Earth's surface?",
                  correctAnswer: "9.8 m/s^2 downward",
                  distractors: ["0 m/s^2", "9.8 m/s^2 upward", "It depends on horizontal speed"],
                  hintText: "Gravity controls vertical acceleration.",
                  explanation: "Near Earth's surface, projectile vertical acceleration is approximately `9.8 m/s^2` downward."
                },
                {
                  slug: "projectile-top-checkpoint",
                  usage: "CHECKPOINT",
                  difficulty: "MEDIUM",
                  content: "At the highest point of a projectile's path, what is the vertical velocity?",
                  correctAnswer: "0",
                  distractors: ["9.8 m/s", "Maximum", "Equal to horizontal velocity"],
                  hintText: "At the top, upward motion changes to downward motion.",
                  explanation: "The vertical velocity is momentarily zero at the highest point."
                },
                {
                  slug: "projectile-time-exam",
                  usage: "EXAM",
                  difficulty: "HARD",
                  content: "A projectile is launched horizontally from a cliff. Which quantity determines the time to hit the ground?",
                  correctAnswer: "Vertical height",
                  distractors: ["Horizontal velocity only", "Mass only", "Color of the object"],
                  hintText: "Time comes from vertical motion under gravity.",
                  explanation: "For horizontal launch, fall time depends on vertical height and gravity."
                }
              ]
            }
          ]
        }
      ]
    },
    {
      slug: "grade-12-chemistry",
      title: "Grade 12 Chemistry",
      description: "Equilibrium, bonding, and molecular reasoning with visuals, simulations, and adaptive practice.",
      units: [
        {
          slug: "reactions-and-bonding",
          title: "Reactions and Bonding",
          order: 1,
          concepts: [
            {
              slug: "chemical-equilibrium",
              title: "Chemical Equilibrium",
              description: "Reason about reversible reactions and predict shifts after concentration, pressure, or temperature changes.",
              image: "chemistry-equilibrium-001",
              video: "chemistry-video-001",
              simulation: "chemistry-sim-001",
              paragraphs: [
                "At equilibrium, forward and reverse reaction rates are equal. Concentrations can stay constant even while particles continue reacting.",
                "Le Chatelier's principle predicts how a system shifts when a stress is applied."
              ],
              questions: [
                {
                  slug: "equilibrium-rate-practice",
                  usage: "PRACTICE",
                  difficulty: "EASY",
                  content: "At chemical equilibrium, what is true about the forward and reverse reaction rates?",
                  correctAnswer: "They are equal",
                  distractors: ["Both are zero", "Forward is faster", "Reverse is faster"],
                  hintText: "Equilibrium is dynamic.",
                  explanation: "At equilibrium, both reactions continue, but their rates are equal."
                },
                {
                  slug: "equilibrium-concentration-practice",
                  usage: "PRACTICE",
                  difficulty: "MEDIUM",
                  content: "If more reactant is added to a system at equilibrium, the system usually shifts toward which side?",
                  correctAnswer: "Products",
                  distractors: ["Reactants", "No reaction", "The catalyst side"],
                  hintText: "The system shifts to reduce the added reactant.",
                  explanation: "Adding reactant commonly shifts equilibrium toward products to consume the added reactant."
                },
                {
                  slug: "equilibrium-pressure-checkpoint",
                  usage: "CHECKPOINT",
                  difficulty: "MEDIUM",
                  content: "Increasing pressure favors the side with what kind of gas mole count?",
                  correctAnswer: "Fewer gas moles",
                  distractors: ["More gas moles", "Equal liquid moles", "Higher temperature"],
                  hintText: "Pressure stress is reduced by occupying less gas volume.",
                  explanation: "Higher pressure favors the side with fewer moles of gas."
                },
                {
                  slug: "equilibrium-catalyst-exam",
                  usage: "EXAM",
                  difficulty: "HARD",
                  content: "What does a catalyst change in an equilibrium system?",
                  correctAnswer: "The time to reach equilibrium",
                  distractors: ["The equilibrium position", "Only product concentration", "Only reactant concentration"],
                  hintText: "A catalyst speeds both forward and reverse reactions.",
                  explanation: "A catalyst helps the system reach equilibrium faster but does not change the equilibrium position."
                }
              ]
            }
          ]
        }
      ]
    }
  ]

  const conceptIds = []

  for (const coursePack of coursePacks) {
    const course = await prisma.course.upsert({
      where: { slug: coursePack.slug },
      update: {
        title: coursePack.title,
        description: coursePack.description,
        archivedAt: null,
        status: "PUBLISHED",
        authorId: writerId
      },
      create: {
        slug: coursePack.slug,
        title: coursePack.title,
        description: coursePack.description,
        status: "PUBLISHED",
        authorId: writerId
      }
    })

    for (const unitPack of coursePack.units) {
      const unit = await prisma.unit.upsert({
        where: { courseId_slug: { courseId: course.id, slug: unitPack.slug } },
        update: {
          title: unitPack.title,
          order: unitPack.order,
          status: "PUBLISHED"
        },
        create: {
          courseId: course.id,
          slug: unitPack.slug,
          title: unitPack.title,
          order: unitPack.order,
          status: "PUBLISHED"
        }
      })

      for (const conceptPack of unitPack.concepts) {
        const concept = await prisma.concept.upsert({
          where: { unitId_slug: { unitId: unit.id, slug: conceptPack.slug } },
          update: {
            title: conceptPack.title,
            description: conceptPack.description,
            contentBody: conceptPack.paragraphs.join("\n\n"),
            unlockThreshold: 0.86,
            pLo: 0.12,
            pT: 0.12,
            pG: 0.22,
            pS: 0.12,
            decayLambda: 0.012,
            status: "PUBLISHED"
          },
          create: {
            unitId: unit.id,
            slug: conceptPack.slug,
            title: conceptPack.title,
            description: conceptPack.description,
            contentBody: conceptPack.paragraphs.join("\n\n"),
            unlockThreshold: 0.86,
            pLo: 0.12,
            pT: 0.12,
            pG: 0.22,
            pS: 0.12,
            decayLambda: 0.012,
            status: "PUBLISHED"
          }
        })

        conceptIds.push(concept.id)
        await addQuestions(prisma, concept.id, writerId, conceptPack.questions)

        const checkpoint = await prisma.question.findFirst({
          where: { conceptId: concept.id, usage: "CHECKPOINT", status: "PUBLISHED" },
          select: { id: true }
        })
        const videoAsset = assetsByPublicId[conceptPack.video]

        await prisma.concept.update({
          where: { id: concept.id },
          data: {
            contentBlocks: [
              {
                id: `${conceptPack.slug}-image`,
                type: "image",
                assetId: assetsByPublicId[conceptPack.image].id,
                alt: conceptPack.title,
                caption: assetsByPublicId[conceptPack.image].caption
              },
              ...conceptPack.paragraphs.map((text, index) => ({
                id: `${conceptPack.slug}-paragraph-${index + 1}`,
                type: "paragraph",
                title: index === 0 ? "Core idea" : "Problem-solving move",
                text
              })),
              {
                id: `${conceptPack.slug}-video`,
                type: "video",
                url: videoAsset.url,
                videoId: videoAsset.videoId,
                caption: videoAsset.caption
              },
              {
                id: `${conceptPack.slug}-simulation`,
                type: "phet",
                assetId: assetsByPublicId[conceptPack.simulation].id,
                title: assetsByPublicId[conceptPack.simulation].title
              },
              ...(checkpoint ? [{
                id: `${conceptPack.slug}-checkpoint-preview`,
                type: "quiz",
                questionId: checkpoint.id
              }] : [])
            ]
          }
        })
      }
    }
  }

  return { conceptIds }
}
