import { Config } from '../lib/config';
import { buildRepository, buildSender, generateNodeId, generateNumber, generateSha, getCurrentTimestamp } from './common';

export interface ReviewCommentOptions {
  prNumber?: number;
  body?: string;
  path?: string;
  line?: number;
  withSuggestion?: boolean;
}

export function buildReviewCommentPayload(config: Config, options: ReviewCommentOptions = {}) {
  const prNumber = options.prNumber || generateNumber(1, 999);
  const timestamp = getCurrentTimestamp();
  const commentId = generateNumber(100000000, 999999999);
  const prId = generateNumber(100000000, 999999999);
  const reviewId = generateNumber(100000000, 999999999);
  const commitSha = generateSha();
  const path = options.path || 'src/example.ts';
  const line = options.line || generateNumber(1, 100);

  // Generate body with optional suggestion
  let body = options.body || 'This is a review comment on the code change.';
  if (options.withSuggestion && !body.includes('```suggestion')) {
    body += `\n\n\`\`\`suggestion\nconst improvedCode = true;\n\`\`\``;
  }

  const comment = {
    id: commentId,
    node_id: generateNodeId('PRRC'),
    user: buildSender(config),
    body: body,
    created_at: timestamp,
    updated_at: timestamp,
    html_url: `https://github.com/${config.testRepository.fullName}/pull/${prNumber}#discussion_r${commentId}`,
    pull_request_review_id: reviewId,
    diff_hunk: `@@ -${line},6 +${line},7 @@\n const example = true;\n+const newLine = true;`,
    path: path,
    position: generateNumber(1, 10),
    original_position: generateNumber(1, 10),
    commit_id: commitSha,
    original_commit_id: commitSha,
    line: line,
    original_line: line,
    side: 'RIGHT',
    start_line: null,
    original_start_line: null,
    start_side: null,
    in_reply_to_id: undefined, // Set this to test reply comments
  };

  const pull_request = {
    id: prId,
    node_id: generateNodeId('PR'),
    number: prNumber,
    title: `Pull Request #${prNumber}`,
    state: 'open' as const,
    html_url: `https://github.com/${config.testRepository.fullName}/pull/${prNumber}`,
    user: buildSender(config),
  };

  return {
    action: 'created' as const,
    comment: comment,
    pull_request: pull_request,
    repository: buildRepository(config),
    sender: buildSender(config),
  };
}
