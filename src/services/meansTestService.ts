import { Application, HouseholdMember } from '../models/types';

interface MeansTestResult {
  score: number;
  status: 'PASSED' | 'FAILED' | 'PENDING';
  details: {
    totalIncome: number;
    totalExpenses: number;
    disposableIncome: number;
    perCapitaIncome: number;
    threshold: number;
  };
}

export function calculateMeansTest(
  application: Application & { householdMembers: HouseholdMember[] }
): MeansTestResult {
  // Calculate total household income
  const applicantIncome = application.monthlyIncome;
  const membersIncome = application.householdMembers.reduce(
    (sum, member) => sum + (member.monthlyIncome || 0),
    0
  );
  const totalIncome = applicantIncome + membersIncome;

  // Calculate total expenses
  const totalExpenses = application.monthlyExpenses;

  // Calculate disposable income
  const disposableIncome = totalIncome - totalExpenses;

  // Calculate per capita income
  const perCapitaIncome = totalIncome / application.householdSize;

  // Thresholds (adjust based on policy)
  const incomeThreshold = 3500; // R3,500 per month per household
  const perCapitaThreshold = 1000; // R1,000 per capita
  const disposableIncomeThreshold = 500; // R500 disposable income

  // Calculate score (lower is better)
  let score = 0;
  if (totalIncome > incomeThreshold) score += 3;
  if (perCapitaIncome > perCapitaThreshold) score += 2;
  if (disposableIncome > disposableIncomeThreshold) score += 2;

  // Determine status
  let status: 'PASSED' | 'FAILED' | 'PENDING' = 'PENDING';
  if (score <= 2 && totalIncome <= incomeThreshold && disposableIncome <= disposableIncomeThreshold) {
    status = 'PASSED';
  } else if (score >= 5) {
    status = 'FAILED';
  }

  return {
    score,
    status,
    details: {
      totalIncome: Number(totalIncome),
      totalExpenses: Number(totalExpenses),
      disposableIncome: Number(disposableIncome),
      perCapitaIncome: Number(perCapitaIncome),
      threshold: incomeThreshold,
    },
  };
}

