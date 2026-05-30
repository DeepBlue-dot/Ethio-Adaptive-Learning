export async function seedAssets(prisma, writerId) {
  console.info("--- Provisioning Media Assets ---")
  const assetSeeds = [
    {
      publicId: "math-ref-001",
      kind: "IMAGE",
      title: "Function Transformation Map",
      alt: "Students studying a graphing surface with linear and quadratic patterns",
      caption: "Use the graph shape to connect equation features with visual behavior.",
      url: "https://res.cloudinary.com/demo/image/upload/w_1200,h_675,c_fill,g_auto,f_auto,q_auto/sample.jpg",
      width: 1200,
      height: 675,
      bytes: 250000,
    },
    {
      publicId: "math-sim-001",
      kind: "PHET_SIMULATION",
      title: "Graphing Lines Simulation",
      caption: "Move slope and intercept controls to see the line respond instantly.",
      url: "https://phet.colorado.edu/sims/html/graphing-slope-intercept/latest/graphing-slope-intercept_en.html",
    },
    {
      publicId: "math-sim-quadratic",
      kind: "PHET_SIMULATION",
      title: "Quadratic Intercepts Explorer",
      caption: "See how the coefficients a, b, and c stretch and shift the parabola.",
      url: "https://phet.colorado.edu/sims/html/graphing-quadratics/latest/graphing-quadratics_en.html",
    },
    {
      publicId: "math-sim-derivative",
      kind: "PHET_SIMULATION",
      title: "Calculus Grapher",
      caption: "Draw a function and see its derivative and integral graphed in real-time.",
      url: "https://phet.colorado.edu/sims/html/calculus-grapher/latest/calculus-grapher_en.html",
    },
    {
      publicId: "math-video-001",
      kind: "YOUTUBE_EMBED",
      title: "Slope and Intercept Mini Lesson",
      caption: "A short visual refresher before adaptive practice.",
      url: "https://www.youtube.com/watch?v=IL3UCuXrUzE",
      videoId: "IL3UCuXrUzE",
      thumbnailUrl: "https://img.youtube.com/vi/IL3UCuXrUzE/hqdefault.jpg",
    },
    {
      publicId: "math-video-quadratic",
      kind: "YOUTUBE_EMBED",
      title: "Visualizing the Quadratic Formula",
      caption: "Understand where the roots come from before you solve.",
      url: "https://www.youtube.com/watch?v=ZBaU5AdlxVw",
      videoId: "ZBaU5AdlxVw",
      thumbnailUrl: "https://img.youtube.com/vi/ZBaU5AdlxVw/hqdefault.jpg",
    },
    {
      publicId: "math-video-stats",
      kind: "YOUTUBE_EMBED",
      title: "Standard Deviation Intuition",
      caption: "Why do we divide by n-1? A quick conceptual guide.",
      url: "https://www.youtube.com/watch?v=Sc6zM02rZps",
      videoId: "Sc6zM02rZps",
      thumbnailUrl: "https://img.youtube.com/vi/Sc6zM02rZps/hqdefault.jpg",
    },
    {
      publicId: "physics-motion-001",
      kind: "IMAGE",
      title: "Motion Graphs",
      alt: "A road scene used to reason about motion and velocity",
      caption: "Position-time and velocity-time graphs describe the same journey from different angles.",
      url: "https://res.cloudinary.com/demo/image/upload/w_1200,h_675,c_fill,g_auto,f_auto,q_auto/samples/landscapes/architecture-signs.jpg",
      width: 1200,
      height: 675,
      bytes: 260000,
    },
    {
      publicId: "physics-sim-001",
      kind: "PHET_SIMULATION",
      title: "Projectile Motion Simulation",
      caption: "Change angle and speed to test how a projectile travels.",
      url: "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_en.html",
    },
    {
      publicId: "physics-video-001",
      kind: "YOUTUBE_EMBED",
      title: "Projectile Motion Visual Walkthrough",
      caption: "Separate horizontal and vertical motion before solving.",
      url: "https://www.youtube.com/watch?v=aY8z2qO44WA",
      videoId: "aY8z2qO44WA",
      thumbnailUrl: "https://img.youtube.com/vi/aY8z2qO44WA/hqdefault.jpg",
    },
    {
      publicId: "chemistry-equilibrium-001",
      kind: "IMAGE",
      title: "Chemical Equilibrium",
      alt: "Laboratory glassware representing reversible reactions",
      caption: "Equilibrium is a dynamic balance, not a stopped reaction.",
      url: "https://res.cloudinary.com/demo/image/upload/w_1200,h_675,c_fill,g_auto,f_auto,q_auto/samples/food/fish-vegetables.jpg",
      width: 1200,
      height: 675,
      bytes: 245000,
    },
    {
      publicId: "chemistry-sim-001",
      kind: "PHET_SIMULATION",
      title: "Molecule Shapes Simulation",
      caption: "Build molecules and inspect how geometry changes around a central atom.",
      url: "https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes_en.html",
    },
    {
      publicId: "chemistry-video-001",
      kind: "YOUTUBE_EMBED",
      title: "Le Chatelier Principle Overview",
      caption: "See how a system responds when equilibrium is disturbed.",
      url: "https://www.youtube.com/watch?v=ANi709MYnWg",
      videoId: "ANi709MYnWg",
      thumbnailUrl: "https://img.youtube.com/vi/ANi709MYnWg/hqdefault.jpg",
    },
    {
      publicId: "math-sim-vector",
      kind: "PHET_SIMULATION",
      title: "Vector Addition Simulation",
      caption: "Drag vectors to see how they add up and how the resultant changes.",
      url: "https://phet.colorado.edu/sims/html/vector-addition/latest/vector-addition_en.html",
    },
  ]
  const assets = await Promise.all(
    assetSeeds.map((asset) =>
      prisma.mediaAsset.upsert({
        where: { publicId: asset.publicId },
        update: {
          ...asset,
          status: "PUBLISHED",
          createdById: writerId,
        },
        create: {
          ...asset,
          status: "PUBLISHED",
          createdById: writerId,
        }
      })
    )
  )
  
  await prisma.contentSnippet.upsert({
    where: { slug: "prerequisite-alert" },
    update: {
      title: "Why you need this foundation",
      contentBlocks: [
        {
          id: "prereq-alert-para",
          type: "paragraph",
          text: "Mathematical concepts build on each other. Mastery of the previous concept ensures you have the mental tools to solve these more complex problems without frustration."
        }
      ],
      status: "PUBLISHED",
      authorId: writerId
    },
    create: {
      slug: "prerequisite-alert",
      title: "Why you need this foundation",
      contentBlocks: [
        {
          id: "prereq-alert-para",
          type: "paragraph",
          text: "Mathematical concepts build on each other. Mastery of the previous concept ensures you have the mental tools to solve these more complex problems without frustration."
        }
      ],
      status: "PUBLISHED",
      authorId: writerId
    }
  })

  await prisma.contentSnippet.upsert({
    where: { slug: "mastery-congratulations" },
    update: {
      title: "Mastery Achieved!",
      contentBlocks: [
        {
          id: "mastery-cong-para",
          type: "paragraph",
          text: "Excellent work! You have demonstrated high confidence in this concept. You are now ready to tackle advanced applications or move to the next topic in the sequence."
        }
      ],
      status: "PUBLISHED",
      authorId: writerId
    },
    create: {
      slug: "mastery-congratulations",
      title: "Mastery Achieved!",
      contentBlocks: [
        {
          id: "mastery-cong-para",
          type: "paragraph",
          text: "Excellent work! You have demonstrated high confidence in this concept. You are now ready to tackle advanced applications or move to the next topic in the sequence."
        }
      ],
      status: "PUBLISHED",
      authorId: writerId
    }
  })

  const snippet = await prisma.contentSnippet.upsert({
    where: { slug: "mastery-formula" },
    update: {
      contentBlocks: [
        {
          id: "mastery-formula-intro",
          type: "paragraph",
          title: "Why EthioPrep adapts",
          text: "Every response updates the learner model. Correct answers raise confidence, missed answers reveal what to revisit, and checkpoints decide when the exam path opens."
        }
      ],
      status: "PUBLISHED",
      authorId: writerId
    },
    create: {
      slug: "mastery-formula",
      title: "The BKT Formula",
      contentBlocks: [
        {
          id: "mastery-formula-intro",
          type: "paragraph",
          title: "Why EthioPrep adapts",
          text: "Every response updates the learner model. Correct answers raise confidence, missed answers reveal what to revisit, and checkpoints decide when the exam path opens."
        }
      ],
      status: "PUBLISHED",
      authorId: writerId
    }
  })

  return { assetsByPublicId: Object.fromEntries(assets.map((asset) => [asset.publicId, asset])), snippet }
}
