export class TimeUtils {
  static calculateTimeBetween(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.floor((endDate.getTime() - startDate.getTime()) / 1000); // Convert to seconds
  }
}
