import prisma from '../utils/db';

export async function generateApplicationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `IND${year}`;

  // Get the last application number for this year
  const lastApplication = await prisma.application.findFirst({
    where: {
      applicationNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      applicationNumber: 'desc',
    },
  });

  let sequence = 1;
  if (lastApplication) {
    const lastSequence = parseInt(
      lastApplication.applicationNumber.replace(prefix, '')
    );
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(6, '0')}`;
}

