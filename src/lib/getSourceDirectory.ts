import assert from 'node:assert';
import { isEmpty, isString } from 'lodash';
import {
  DirectoryChoice,
  DirectoryChoiceOrString,
} from '../options/ConfigOptions';
import { ValidConfigOptions } from '../options/options';
import { BackportError } from './BackportError';
import { promptForDirectories } from './prompts';

export async function getSourceDirectory({
  options,
}: {
  options: ValidConfigOptions;
  sourceBranch: string;
}) {
  // target directories already specified (in contrast to letting the user choose from a list)
  if (options.sourceDirectory !== undefined) {
    return options.sourceDirectory;
  }

  // require target branches to be specified when when in non-interactive mode
  if (!options.interactive) {
    throw new BackportError({ code: 'no-directories-exception' });
  }

  const sourceDirectoryChoices: DirectoryChoice[] = getSourceDirectoryChoices({
    options,
  });

  const result = await promptForDirectories({
    choices: sourceDirectoryChoices,
    isMultipleChoice: false,
    isTarget: false,
  });
  assert(result.length === 1);
  return result[0];
}

export function getSourceDirectoryChoices({
  options,
}: {
  options: ValidConfigOptions;
}) {
  const sourceDirectoryChoices = getSourceDirectoryChoicesAsObject(
    options.sourceDirectoryChoices,
  );

  if (isEmpty(sourceDirectoryChoices)) {
    throw new BackportError('Missing source directory choices');
  }

  return sourceDirectoryChoices;
}

function getSourceDirectoryChoicesAsObject(
  sourceDirectoryChoices?: DirectoryChoiceOrString[],
): DirectoryChoice[] {
  if (!sourceDirectoryChoices) {
    return [];
  }

  return sourceDirectoryChoices.map((choice) => {
    if (isString(choice)) {
      return {
        name: choice,
        checked: false,
      };
    }

    return choice;
  });
}
