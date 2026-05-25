import { prisma } from "@/lib/prisma"
import fs from "fs/promises"
import { extractText } from "unpdf"
import { getCollection } from "../clients/chroma"
import { getEmbeddings } from "../embeddings/embedding-service"
import { chunkCurriculumNode, chunkMarkdown } from "./chunking"

/**
 * Syncs all published curriculum content from Prisma into ChromaDB.
 */
export async function syncCurriculumToVectorStore() {
  const collection = await getCollection("curriculum_chunks")
  
  // 1. Fetch published concepts with their chunks
  const concepts = await prisma.concept.findMany({
    where: { status: "PUBLISHED" },
    include: {
      chunks: { where: { status: "PUBLISHED" }, orderBy: { order: "asc" } },
      unit: { select: { title: true, course: { select: { title: true } } } }
    }
  })

  console.info(`Starting ingestion for ${concepts.length} concepts...`)

  for (const concept of concepts) {
    for (const chunk of concept.chunks) {
      const metadata = {
        conceptId: concept.id,
        chunkId: chunk.id,
        conceptSlug: concept.slug,
        unitTitle: concept.unit.title,
        courseTitle: concept.unit.course.title,
        type: "concept_chunk"
      }

      const subChunks = chunkCurriculumNode(concept.title, chunk.bodyMd, metadata)
      const texts = subChunks.map(sc => sc.text)
      const ids = subChunks.map((_, i) => `${chunk.id}_${i}`)
      const embeddings = await getEmbeddings(texts)

      await collection.add({
        ids,
        embeddings,
        metadatas: subChunks.map(sc => sc.metadata as never),
        documents: texts
      })
    }

    if (concept.description) {
      const metadata = {
        conceptId: concept.id,
        conceptSlug: concept.slug,
        type: "concept_description"
      }
      const conceptChunks = chunkCurriculumNode(concept.title, concept.description, metadata)
      const texts = conceptChunks.map(sc => sc.text)
      const ids = conceptChunks.map((_, i) => `${concept.id}_desc_${i}`)
      const embeddings = await getEmbeddings(texts)

      await collection.add({
        ids,
        embeddings,
        metadatas: conceptChunks.map(sc => sc.metadata as never),
        documents: texts
      })
    }
  }

  console.info("Ingestion complete!")
}

/**
 * Ingests a curriculum PDF (like a textbook) into ChromaDB.
 */
export async function ingestTextbookPdf(filePath: string) {
  const collection = await getCollection("curriculum_chunks")
  
  const dataBuffer = await fs.readFile(filePath)
  const data = await extractText(new Uint8Array(dataBuffer), { mergePages: true })

  const metadata = {
    source: filePath.split("/").pop(),
    type: "textbook_extraction",
    grade: "12"
  }

  const chunks = chunkMarkdown(data.text, metadata, { maxWords: 200, overlapWords: 30 })
  
  console.info(`Ingesting ${chunks.length} chunks from PDF...`)

  for (let i = 0; i < chunks.length; i += 25) {
    const batch = chunks.slice(i, i + 25)
    const texts = batch.map(c => c.text)
    const ids = batch.map((_, idx) => `pdf_ext_${metadata.source}_${i + idx}`)
    const embeddings = await getEmbeddings(texts)

    await collection.add({
      ids,
      embeddings,
      metadatas: batch.map(c => c.metadata as never),
      documents: texts
    })
  }

  return { chunkCount: chunks.length }
}
