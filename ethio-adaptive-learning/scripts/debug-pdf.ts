import { createRequire } from "module"
const require = createRequire(import.meta.url)
const pdfLib = require("pdf-parse")

console.log("Type of pdfLib:", typeof pdfLib)
console.log("Is pdfLib a function?", typeof pdfLib === "function")
console.log("Keys of pdfLib:", Object.keys(pdfLib))

if (pdfLib.default) {
  console.log("Type of pdfLib.default:", typeof pdfLib.default)
}
