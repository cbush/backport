import Handlebars from 'handlebars';
import { Commit } from '../../entrypoint.api';
import { ValidConfigOptions } from '../../options/options';
import { getShortSha } from '../github/commitFormatters';
import { logger } from '../logger';

function isValidGitBranchName(name: string): boolean {
  return (
    name.length > 0 &&
    !name.startsWith('-') &&
    !name.endsWith('/') &&
    !name.includes('..') &&
    !name.includes('@{') &&
    !name.includes('\\') &&
    !/[~^:\s?*[\]]/.test(name)
  );
}

/*
 * Returns the name of the backport branch without remote name
 *
 * Examples:
 * For a single PR: `backport/7.x/pr-1234`
 * For a single commit: `backport/7.x/commit-abcdef`
 * For multiple: `backport/7.x/pr-1234_commit-abcdef`
 */
export function getBackportBranchName({
  options,
  targetBranch,
  commits,
}: {
  options: ValidConfigOptions;
  targetBranch: string;
  commits: Commit[];
}) {
  const refValues = commits
    .map((commit) =>
      commit.sourcePullRequest
        ? `pr-${commit.sourcePullRequest.number}`
        : `commit-${getShortSha(commit.sourceCommit.sha)}`,
    )
    .join('_')
    .slice(0, 200);

  const defaultBackportBranchName = 'backport/{{targetBranch}}/{{refValues}}';

  const backportBranchNameTemplate =
    options.backportBranchName ?? defaultBackportBranchName;

  const safeSourcePullRequest = {
    ...commits[0].sourcePullRequest,
    title: commits[0].sourcePullRequest?.title ?? 'untitled',
  };

  // Render the template with guaranteed values
  const interpolatedName = Handlebars.compile(backportBranchNameTemplate)({
    sourcePullRequest: safeSourcePullRequest,
    targetBranch,
    refValues,
  });

  // Validate and sanitize
  if (!isValidGitBranchName(interpolatedName)) {
    logger.warn(
      `Invalid branch name "${interpolatedName}". Falling back to safe default.`,
    );

    const fallback = `backport/${safeSourcePullRequest.title}-${targetBranch}`
      .replace(/[^\w.-]+/g, '-') // sanitize
      .toLowerCase();

    return fallback.slice(0, 200);
  }

  return interpolatedName.slice(0, 200);
}
