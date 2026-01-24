import { Config } from '../lib/config';
import { buildRepository, buildSender, generateNodeId, generateNumber, getCurrentTimestamp } from './common';

export interface DiscussionOptions {
  title?: string;
  body?: string;
  categoryName?: string;
  isAnswerable?: boolean;
}

export interface DiscussionCommentOptions {
  discussionNumber?: number;
  body?: string;
}

export function buildDiscussionPayload(config: Config, options: DiscussionOptions = {}) {
  const timestamp = getCurrentTimestamp();
  const discussionId = generateNumber(100000000, 999999999);
  const discussionNumber = generateNumber(1, 999);
  const categoryId = generateNumber(1000, 9999);

  const title = options.title || `Discussion #${discussionNumber}`;
  const body = options.body || 'This is a discussion for asking questions and sharing ideas.';
  const categoryName = options.categoryName || 'Q&A';
  const isAnswerable = options.isAnswerable ?? true;

  const discussion = {
    id: discussionId,
    node_id: generateNodeId('D'),
    number: discussionNumber,
    title: title,
    body: body,
    state: 'open' as const,
    category: {
      id: categoryId,
      node_id: generateNodeId('DC'),
      name: categoryName,
      slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
      description: `${categoryName} category`,
      is_answerable: isAnswerable,
    },
    user: buildSender(config),
    created_at: timestamp,
    updated_at: timestamp,
    html_url: `https://github.com/${config.testRepository.fullName}/discussions/${discussionNumber}`,
    answer_html_url: null,
    answer_chosen_at: null,
    answer_chosen_by: null,
  };

  return {
    action: 'created' as const,
    discussion: discussion,
    repository: buildRepository(config),
    sender: buildSender(config),
  };
}

export function buildDiscussionCommentPayload(config: Config, options: DiscussionCommentOptions = {}) {
  const timestamp = getCurrentTimestamp();
  const commentId = generateNumber(100000000, 999999999);
  const discussionId = generateNumber(100000000, 999999999);
  const discussionNumber = options.discussionNumber || generateNumber(1, 999);
  const categoryId = generateNumber(1000, 9999);

  const body = options.body || 'This is a helpful answer to the discussion.';

  const comment = {
    id: commentId,
    node_id: generateNodeId('DC'),
    body: body,
    user: buildSender(config),
    created_at: timestamp,
    updated_at: timestamp,
    html_url: `https://github.com/${config.testRepository.fullName}/discussions/${discussionNumber}#discussioncomment-${commentId}`,
    parent_id: null,
  };

  const discussion = {
    id: discussionId,
    node_id: generateNodeId('D'),
    number: discussionNumber,
    title: `Discussion #${discussionNumber}`,
    state: 'open' as const,
    category: {
      id: categoryId,
      node_id: generateNodeId('DCA'),
      name: 'Q&A',
      slug: 'q-a',
      description: 'Q&A category',
      is_answerable: true,
    },
    html_url: `https://github.com/${config.testRepository.fullName}/discussions/${discussionNumber}`,
  };

  return {
    action: 'created' as const,
    comment: comment,
    discussion: discussion,
    repository: buildRepository(config),
    sender: buildSender(config),
  };
}
