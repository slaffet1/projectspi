/*
  Warnings:

  - You are about to drop the column `businessesId` on the `Employee` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "businessesId",
ADD COLUMN     "absenteeism" INTEGER,
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "attritionProbability" DOUBLE PRECISION,
ADD COLUMN     "attritionRisk" TEXT,
ADD COLUMN     "averageHoursPerWeek" DOUBLE PRECISION,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "distanceFromHome" DOUBLE PRECISION,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "jobInvolvement" INTEGER,
ADD COLUMN     "jobLevel" INTEGER,
ADD COLUMN     "jobRole" TEXT,
ADD COLUMN     "jobSatisfaction" INTEGER,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "overtime" BOOLEAN,
ADD COLUMN     "performanceRating" INTEGER,
ADD COLUMN     "projectCount" INTEGER,
ADD COLUMN     "workLifeBalance" INTEGER,
ADD COLUMN     "yearsAtCompany" INTEGER,
ADD COLUMN     "yearsInCurrentRole" INTEGER,
ADD COLUMN     "yearsSinceLastPromotion" INTEGER;
