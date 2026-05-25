import fs from "fs/promises"
import path from "path"
import crypto from "crypto"
import { getCollection } from "../lib/ai/clients/chroma"
import { getEmbeddings } from "../lib/ai/embeddings/embedding-service"
import { chunkMarkdown } from "../lib/ai/rag/chunking"

async function ingestTextbook() {
  // 1. Grab the file path from the command line argument
  const inputArg = process.argv[2]

  // 2. Validate that the user actually provided an argument
  if (!inputArg) {
    console.error("❌ Error: No file path provided.")
    console.info("💡 Usage: npm run ingest -- <path-to-file>")
    process.exit(1) // Exit the script with an error code
  }

  // 3. Resolve the path relative to where the command was run
  const filePath = path.resolve(inputArg)
  const fileName = path.basename(filePath)
  
  console.info(`--- Loading File: ${filePath} ---`)
  
  try {
    const fullText = await fs.readFile(filePath, "utf-8")
    console.info(`Successfully loaded file. Character count: ${fullText.length}`)

    const collection = await getCollection("curriculum_chunks")
    
    // Dynamically use the passed filename in the metadata
    const metadata = {
      source: fileName, 
      grade: "12",
      subject: "Mathematics", // You might want to make this dynamic later too!
      type: "textbook_extraction_marker"
    }

    const chunks = chunkMarkdown(fullText, metadata, { maxWords: 200, overlapWords: 30 })
    console.info(`Created ${chunks.length} semantic chunks.`)

    const batchSize = 15 
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const texts = batch.map(c => c.text)
      
      const ids = batch.map(c => {
        const hash = crypto.createHash("sha256").update(c.text).digest("hex")
        // Dynamically name the ID based on the file name to avoid collisions across different books
        return `doc_${fileName}_${hash}` 
      })
      
      console.info(`  Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`)
      
      const embeddings = await getEmbeddings(texts)

      await collection.add({
        ids,
        embeddings,
        metadatas: batch.map(c => c.metadata as typeof metadata),
        documents: texts
      })
    }

    console.info("--- Ingestion Complete! ---")
  } catch (error) {
    console.error("Failed to ingest file:", error)
  }
}

ingestTextbook()