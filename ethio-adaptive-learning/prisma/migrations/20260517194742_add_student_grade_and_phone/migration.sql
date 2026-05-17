-- CreateEnum
CREATE TYPE "StudentGrade" AS ENUM ('MIDDLE_SCHOOL', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12', 'ABOVE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "grade" "StudentGrade",
ADD COLUMN     "phoneNumber" TEXT;
