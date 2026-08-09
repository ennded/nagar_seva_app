export function formatComplaintId(sequenceNumber: number): string {
  return `NS-${String(sequenceNumber).padStart(5, '0')}`;
}
