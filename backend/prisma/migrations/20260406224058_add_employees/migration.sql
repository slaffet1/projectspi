-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "businessId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "isHeadOfFamily" BOOLEAN NOT NULL DEFAULT false,
    "childrenCount" INTEGER NOT NULL DEFAULT 0,
    "baseSalary" DOUBLE PRECISION NOT NULL,
    "salaryType" TEXT NOT NULL DEFAULT 'BRUT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessesId" INTEGER,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payslip" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "salaireBrut" DOUBLE PRECISION NOT NULL,
    "retenueCnss" DOUBLE PRECISION NOT NULL,
    "salaireImposable" DOUBLE PRECISION NOT NULL,
    "retenueIrpp" DOUBLE PRECISION NOT NULL,
    "retenueCss" DOUBLE PRECISION NOT NULL,
    "salaireNet" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
