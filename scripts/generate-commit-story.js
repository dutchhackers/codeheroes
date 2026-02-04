#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Get commits from the last N days
 * @param {number} days - Number of days to look back
 * @returns {Array} Array of commit objects
 */
function getCommits(days = 30) {
  const since = `${days} days ago`;
  try {
    const output = execSync(
      `git log --since="${since}" --pretty=format:"%H|%an|%aI|%s" --no-merges`,
      { encoding: 'utf-8' }
    );
    
    if (!output.trim()) {
      console.log('No commits found in the specified time period.');
      return [];
    }
    
    return output
      .trim()
      .split('\n')
      .map(line => {
        const [hash, author, date, message] = line.split('|');
        return {
          hash: hash.substring(0, 7),
          author,
          date: new Date(date),
          message
        };
      })
      .filter(commit => commit.hash && commit.message);
  } catch (error) {
    console.error('Error fetching commits:', error.message);
    return [];
  }
}

/**
 * Group commits by week
 * @param {Array} commits - Array of commit objects
 * @returns {Object} Object with week numbers as keys
 */
function groupCommitsByWeek(commits) {
  const weeks = {};
  
  if (commits.length === 0) {
    return weeks;
  }
  
  // Sort commits by date (oldest first)
  commits.sort((a, b) => a.date - b.date);
  
  const firstCommitDate = commits[0].date;
  
  commits.forEach(commit => {
    const daysDiff = Math.floor((commit.date - firstCommitDate) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(daysDiff / 7) + 1;
    
    if (!weeks[weekNumber]) {
      weeks[weekNumber] = {
        commits: [],
        startDate: null,
        endDate: null
      };
    }
    
    weeks[weekNumber].commits.push(commit);
    
    // Update start and end dates
    if (!weeks[weekNumber].startDate || commit.date < weeks[weekNumber].startDate) {
      weeks[weekNumber].startDate = commit.date;
    }
    if (!weeks[weekNumber].endDate || commit.date > weeks[weekNumber].endDate) {
      weeks[weekNumber].endDate = commit.date;
    }
  });
  
  return weeks;
}

/**
 * Analyze commits and generate a story
 * @param {Array} commits - Array of commits
 * @returns {string} Story text
 */
function generateWeekStory(commits) {
  if (commits.length === 0) {
    return 'No activity this week.';
  }
  
  // Categorize commits
  const categories = {
    features: [],
    fixes: [],
    dependencies: [],
    refactoring: [],
    docs: [],
    tests: [],
    ci: [],
    other: []
  };
  
  const authors = new Set();
  
  commits.forEach(commit => {
    authors.add(commit.author);
    const msg = commit.message.toLowerCase();
    
    if (msg.includes('feat') || msg.includes('add') || msg.includes('implement')) {
      categories.features.push(commit);
    } else if (msg.includes('fix') || msg.includes('bug') || msg.includes('resolve')) {
      categories.fixes.push(commit);
    } else if (msg.includes('deps') || msg.includes('bump') || msg.includes('update') && msg.includes('dependabot')) {
      categories.dependencies.push(commit);
    } else if (msg.includes('refactor') || msg.includes('clean') || msg.includes('improve')) {
      categories.refactoring.push(commit);
    } else if (msg.includes('doc') || msg.includes('readme')) {
      categories.docs.push(commit);
    } else if (msg.includes('test')) {
      categories.tests.push(commit);
    } else if (msg.includes('ci') || msg.includes('workflow') || msg.includes('action')) {
      categories.ci.push(commit);
    } else {
      categories.other.push(commit);
    }
  });
  
  // Generate story paragraphs
  const paragraphs = [];
  
  // First paragraph: overview
  const authorsList = Array.from(authors);
  const authorText = authorsList.length === 1 
    ? authorsList[0] 
    : authorsList.length === 2 
      ? `${authorsList[0]} and ${authorsList[1]}`
      : `${authorsList.slice(0, -1).join(', ')}, and ${authorsList[authorsList.length - 1]}`;
  
  const commitCount = commits.length;
  const mainActivities = [];
  
  if (categories.features.length > 0) mainActivities.push('new features');
  if (categories.fixes.length > 0) mainActivities.push('bug fixes');
  if (categories.dependencies.length > 0) mainActivities.push('dependency updates');
  if (categories.refactoring.length > 0) mainActivities.push('code improvements');
  
  const activitiesText = mainActivities.length > 0 
    ? mainActivities.join(', ').replace(/,([^,]*)$/, ' and$1')
    : 'various updates';
  
  paragraphs.push(
    `This week brought ${commitCount} commit${commitCount > 1 ? 's' : ''} to the codebase, ` +
    `with contributions from ${authorText}. The team focused on ${activitiesText}, ` +
    `making steady progress on the project.`
  );
  
  // Second paragraph: details
  const details = [];
  
  if (categories.features.length > 0) {
    details.push(`${categories.features.length} new feature${categories.features.length > 1 ? 's were' : ' was'} added`);
  }
  if (categories.fixes.length > 0) {
    details.push(`${categories.fixes.length} bug${categories.fixes.length > 1 ? 's were' : ' was'} fixed`);
  }
  if (categories.dependencies.length > 0) {
    details.push(`${categories.dependencies.length} dependenc${categories.dependencies.length > 1 ? 'ies were' : 'y was'} updated`);
  }
  if (categories.refactoring.length > 0) {
    details.push(`${categories.refactoring.length} refactoring improvement${categories.refactoring.length > 1 ? 's were' : ' was'} made`);
  }
  if (categories.docs.length > 0) {
    details.push(`documentation was updated ${categories.docs.length} time${categories.docs.length > 1 ? 's' : ''}`);
  }
  if (categories.tests.length > 0) {
    details.push(`${categories.tests.length} test${categories.tests.length > 1 ? 's were' : ' was'} improved`);
  }
  if (categories.ci.length > 0) {
    details.push(`CI/CD received ${categories.ci.length} update${categories.ci.length > 1 ? 's' : ''}`);
  }
  
  if (details.length > 0) {
    const detailsText = details.join(', ').replace(/,([^,]*)$/, ', and$1');
    paragraphs.push(
      `Looking at the details, ${detailsText}. ` +
      `Each contribution played a vital role in moving the project forward and maintaining code quality.`
    );
  }
  
  return paragraphs.join(' ');
}

/**
 * Generate a title for the monthly story
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {number} totalCommits - Total number of commits
 * @returns {string} Title
 */
function generateTitle(startDate, endDate, totalCommits) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const month = monthNames[endDate.getMonth()];
  const year = endDate.getFullYear();
  
  return `${month} ${year}: A Month of Progress`;
}

/**
 * Generate the complete story markdown
 * @param {Object} weeks - Grouped commits by week
 * @returns {string} Markdown content
 */
function generateStoryMarkdown(weeks) {
  const weekNumbers = Object.keys(weeks).sort((a, b) => a - b);
  
  if (weekNumbers.length === 0) {
    return '# No Activity\n\nNo commits found in the specified time period.';
  }
  
  // Calculate total commits and date range
  let totalCommits = 0;
  let earliestDate = null;
  let latestDate = null;
  
  weekNumbers.forEach(weekNum => {
    const week = weeks[weekNum];
    totalCommits += week.commits.length;
    
    if (!earliestDate || week.startDate < earliestDate) {
      earliestDate = week.startDate;
    }
    if (!latestDate || week.endDate > latestDate) {
      latestDate = week.endDate;
    }
  });
  
  const title = generateTitle(earliestDate, latestDate, totalCommits);
  
  let markdown = `# ${title}\n\n`;
  
  // Add overview
  markdown += `## Overview\n\n`;
  markdown += `This month saw ${totalCommits} commit${totalCommits > 1 ? 's' : ''} `;
  markdown += `across ${weekNumbers.length} week${weekNumbers.length > 1 ? 's' : ''} `;
  markdown += `(${earliestDate.toLocaleDateString()} - ${latestDate.toLocaleDateString()}).\n\n`;
  
  // Add weekly stories
  weekNumbers.forEach(weekNum => {
    const week = weeks[weekNum];
    const weekTitle = `Week ${weekNum}`;
    const dateRange = `${week.startDate.toLocaleDateString()} - ${week.endDate.toLocaleDateString()}`;
    
    markdown += `## ${weekTitle}\n`;
    markdown += `*${dateRange} • ${week.commits.length} commit${week.commits.length > 1 ? 's' : ''}*\n\n`;
    markdown += generateWeekStory(week.commits) + '\n\n';
    
    // Add commit list
    markdown += `### Commits\n`;
    week.commits.forEach(commit => {
      markdown += `- \`${commit.hash}\` ${commit.message} (${commit.author})\n`;
    });
    markdown += '\n';
  });
  
  return markdown;
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Scanning commits from the last 30 days...\n');
  
  const commits = getCommits(30);
  
  if (commits.length === 0) {
    console.log('No commits found. The story file will not be created.');
    return;
  }
  
  console.log(`Found ${commits.length} commit${commits.length > 1 ? 's' : ''}.\n`);
  
  console.log('📊 Grouping commits by week...\n');
  const weeks = groupCommitsByWeek(commits);
  
  console.log('✍️  Generating story...\n');
  const markdown = generateStoryMarkdown(weeks);
  
  // Determine output filename
  const now = new Date();
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  const filename = `${month}-${year}-story.md`;
  const filepath = path.join(process.cwd(), filename);
  
  // Write to file
  fs.writeFileSync(filepath, markdown);
  
  console.log(`✅ Story saved to: ${filename}\n`);
  console.log('Preview:');
  console.log('─'.repeat(60));
  console.log(markdown.split('\n').slice(0, 20).join('\n'));
  if (markdown.split('\n').length > 20) {
    console.log('\n... (truncated)');
  }
  console.log('─'.repeat(60));
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  getCommits,
  groupCommitsByWeek,
  generateWeekStory,
  generateTitle,
  generateStoryMarkdown
};
