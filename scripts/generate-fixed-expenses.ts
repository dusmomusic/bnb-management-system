import { PrismaClient, RecurrenceType } from '@prisma/client';
import { addMonths, addYears, format, isSameMonth, isSameYear } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Script per la generazione automatica delle spese fisse mensili/annuali
 * Viene eseguito il 1° di ogni mese tramite Netlify Scheduled Function
 */
async function generateFixedExpenses() {
  console.log(`Generating fixed expenses for ${format(new Date(), 'yyyy-MM-dd')}`);
  
  const today = new Date();
  const fixedExpenses = await prisma.fixedExpense.findMany({
    where: {
      OR: [
        { endDate: null },
        { endDate: { gte: today } }
      ]
    },
    include: {
      property: true,
      unit: true
    }
  });

  console.log(`Found ${fixedExpenses.length} active fixed expenses`);
  let generatedCount = 0;

  for (const expense of fixedExpenses) {
    try {
      // Calcola la prossima data in base alla ricorrenza
      const nextDate = expense.recurrence === RecurrenceType.MONTHLY
        ? addMonths(expense.startDate, getMonthsDifference(expense.startDate, today))
        : addYears(expense.startDate, getYearsDifference(expense.startDate, today));

      // Verifica se è necessario generare la spesa per questo mese/anno
      const shouldGenerate = expense.recurrence === RecurrenceType.MONTHLY
        ? isSameMonth(nextDate, today) && nextDate.getDate() <= today.getDate()
        : isSameYear(nextDate, today) && 
          nextDate.getMonth() === today.getMonth() && 
          nextDate.getDate() <= today.getDate();

      if (shouldGenerate) {
        // Verifica se esiste già una spesa variabile per questa spesa fissa nel periodo corrente
        const existingExpense = await prisma.variableExpense.findFirst({
          where: {
            propertyId: expense.propertyId,
            unitId: expense.unitId,
            description: `[Auto] ${expense.description}`,
            date: {
              gte: new Date(today.getFullYear(), today.getMonth(), 1),
              lt: new Date(today.getFullYear(), today.getMonth() + 1, 0)
            }
          }
        });

        if (!existingExpense) {
          // Crea una nuova spesa variabile
          await prisma.variableExpense.create({
            data: {
              propertyId: expense.propertyId,
              unitId: expense.unitId,
              date: today,
              description: `[Auto] ${expense.description}`,
              amount: expense.amount,
              category: expense.recurrence === RecurrenceType.MONTHLY ? 'Spese Mensili' : 'Spese Annuali'
            }
          });

          generatedCount++;
          console.log(`Generated expense: ${expense.description} for ${expense.property.name}${expense.unit ? ' - ' + expense.unit.name : ''}`);
        }
      }
    } catch (error) {
      console.error(`Error processing expense ${expense.id}:`, error);
    }
  }

  console.log(`Generated ${generatedCount} new expenses`);
}

// Calcola la differenza in mesi tra due date
function getMonthsDifference(startDate: Date, currentDate: Date): number {
  return (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
         currentDate.getMonth() - startDate.getMonth();
}

// Calcola la differenza in anni tra due date
function getYearsDifference(startDate: Date, currentDate: Date): number {
  return currentDate.getFullYear() - startDate.getFullYear();
}

// Esegui lo script
generateFixedExpenses()
  .catch((e) => {
    console.error('Error generating fixed expenses:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 