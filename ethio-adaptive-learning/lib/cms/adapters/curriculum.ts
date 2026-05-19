import type { CmsContentTypeKey } from "@/lib/cms/types"
import {
  archiveCourse,
  createCourse,
  deleteCourse,
  getCmsAuthors,
  getCurriculumHierarchyCmsData,
  restoreCourse,
  updateCourse,
} from "@/lib/curriculum/course"
import {
  conceptCmsInputToCreateInput,
  type ConceptCmsInput,
} from "@/lib/cms/definitions/concept"
import type { CourseCmsInput } from "@/lib/cms/definitions/course"
import type { QuestionCmsInput } from "@/lib/cms/definitions/question"
import type { UnitCmsInput } from "@/lib/cms/definitions/unit"
import type { ChunkCmsInput } from "@/lib/cms/definitions/chunk"
import type { WorkedExampleCmsInput } from "@/lib/cms/definitions/worked-example"
import {
  createConcept,
  createConceptChunk,
  createWorkedExample,
  deleteConcept,
  deleteConceptChunk,
  deleteWorkedExample,
  updateConceptChunk,
  updateWorkedExample,
} from "@/lib/curriculum/concept"
import {
  getConceptEditorCmsData,
  saveConceptEditor,
} from "@/lib/curriculum/concept-editor"
import {
  createQuestion,
  deleteQuestion,
  formatDistractorsForTextarea,
  getQuestionDifficultyOptions,
  getQuestionUsageOptions,
  saveQuestion,
  updateQuestion,
} from "@/lib/curriculum/question"
import {
  getQuestionBankCmsData,
  getQuestionEditorCmsData,
} from "@/lib/curriculum/question-bank"
import {
  createUnit,
  deleteUnit,
  updateUnit,
} from "@/lib/curriculum/unit"

export {
  archiveCourse,
  createCourse,
  createConcept,
  createConceptChunk,
  createQuestion,
  createUnit,
  createWorkedExample,
  deleteConcept,
  deleteConceptChunk,
  deleteCourse,
  deleteQuestion,
  deleteUnit,
  deleteWorkedExample,
  formatDistractorsForTextarea,
  getCmsAuthors,
  getConceptEditorCmsData,
  getCurriculumHierarchyCmsData,
  getQuestionBankCmsData,
  getQuestionDifficultyOptions,
  getQuestionDifficultyOptions as getDifficultyOptions,
  getQuestionEditorCmsData,
  getQuestionUsageOptions,
  restoreCourse,
  saveConceptEditor,
  saveQuestion,
  updateConceptChunk,
  updateCourse,
  updateQuestion,
  updateUnit,
  updateWorkedExample,
}

export async function createCurriculumCmsItem(type: CmsContentTypeKey, input: unknown) {
  switch (type) {
    case "course": {
      const courseInput = input as CourseCmsInput
      const course = await createCourse(courseInput)

      if (courseInput.archived === "archived") {
        await archiveCourse(course.id)
      }

      return {
        id: course.id,
      }
    }
    case "unit": {
      const unit = await createUnit(input as UnitCmsInput)
      return {
        id: unit.id,
      }
    }
    case "concept": {
      const conceptInput = input as ConceptCmsInput
      const concept = await createConcept(conceptCmsInputToCreateInput(conceptInput))

      if (
        conceptInput.prerequisiteConceptIds.length ||
        conceptInput.chunks.length ||
        conceptInput.workedExamples.length
      ) {
        await saveConceptEditor({
          ...conceptInput,
          conceptId: concept.id,
        })
      }

      return {
        id: concept.id,
      }
    }
    case "question": {
      const question = await createQuestion(input as QuestionCmsInput)
      return {
        id: question.id,
      }
    }
    case "chunk": {
      const chunk = await createConceptChunk(input as ChunkCmsInput)
      return {
        id: chunk.id,
      }
    }
    case "worked-example": {
      const example = await createWorkedExample(input as WorkedExampleCmsInput)
      return {
        id: example.id,
      }
    }
  }
}

export async function updateCurriculumCmsItem(type: CmsContentTypeKey, id: string, input: unknown) {
  switch (type) {
    case "course": {
      const courseInput = input as CourseCmsInput
      await updateCourse(id, courseInput)

      if (courseInput.archived === "archived") {
        await archiveCourse(id)
      } else {
        await restoreCourse(id)
      }

      return {
        id,
      }
    }
    case "unit": {
      await updateUnit(id, input as UnitCmsInput)
      return {
        id,
      }
    }
    case "concept": {
      await saveConceptEditor({
        ...(input as ConceptCmsInput),
        conceptId: id,
      })
      return {
        id,
      }
    }
    case "question": {
      await updateQuestion(id, input as QuestionCmsInput)
      return {
        id,
      }
    }
    case "chunk": {
      await updateConceptChunk(id, input as ChunkCmsInput)
      return {
        id,
      }
    }
    case "worked-example": {
      await updateWorkedExample(id, input as WorkedExampleCmsInput)
      return {
        id,
      }
    }
  }
}

export async function deleteCurriculumCmsItem(type: CmsContentTypeKey, id: string) {
  switch (type) {
    case "course":
      await deleteCourse(id)
      return
    case "unit":
      await deleteUnit(id)
      return
    case "concept":
      await deleteConcept(id)
      return
    case "question":
      await deleteQuestion(id)
      return
    case "chunk":
      await deleteConceptChunk(id)
      return
    case "worked-example":
      await deleteWorkedExample(id)
      return
  }
}
