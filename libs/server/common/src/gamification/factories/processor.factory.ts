import { ActivityType } from '../../activity/activity.model';
import { BaseActivityProcessor } from '../activities/base/activity-processor.base';
import { PullRequestProcessor } from '../activities/pull-request/pr-processor';
import { PushActivityProcessor } from '../activities/push/push-processor';

export class ProcessorFactory {
  // Map to store processor classes for each activity type
  private static processors = new Map<ActivityType, new () => BaseActivityProcessor>();

  static initialize() {
    // Register all processors
    this.processors.set(ActivityType.CODE_PUSH, PushActivityProcessor);
    this.processors.set(ActivityType.PR_CREATED, PullRequestProcessor);
    this.processors.set(ActivityType.PR_UPDATED, PullRequestProcessor);
    this.processors.set(ActivityType.PR_MERGED, PullRequestProcessor);
  }

  static getProcessor(type: ActivityType): BaseActivityProcessor {
    const ProcessorClass = this.processors.get(type);
    if (!ProcessorClass) {
      throw new Error(`No processor registered for activity type: ${type}`);
    }
    return new ProcessorClass();
  }
}
