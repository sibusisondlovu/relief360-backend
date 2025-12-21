import { getDb } from '../utils/mongo';
import { Application } from '../models/types';

export async function generateApplicationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `IND${year}`;

  // Get the last application number for this year
  const lastApplication = await getDb().collection<Application>('applications').findOne(
    { applicationNumber: { $regex: `^${prefix}` } },
    { sort: { applicationNumber: -1 } }
  );

  let sequence = 1;
  if (lastApplication) {
    const lastSequence = parseInt(
      lastApplication.applicationNumber.replace(prefix, '')
    );
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(6, '0')}`;
}

