import { danger, markdown, schedule } from 'danger';

// Make schedule testable with Jest. Inspiration: https://git.io/fNh6i
const testableSchedule = (reason: string, action: any) =>
  typeof jest !== 'undefined' ? action : schedule(action);

const questionWords: Set<string> = new Set([
  'how',
  'who',
  'what',
  'where',
  'when',
  'why',
  'will',
  'which'
]);

const documentationWords: Set<string> = new Set([
  'documentation',
  'document',
  'docs',
  'doc',
  'readme',
  'changelog',
  'tutorial'
]);

const endsWith = (character: string, sentence: string): boolean =>
  sentence.slice(-1) === character;

const matchKeyword = (
  keywords: Set<string>,
  sentence: string,
  firstOnly: boolean = false
): boolean => {
  /*
   * We need to turn the title into a parseable array of words. To do this, we:
   * 1. Remove any character that’s not a letter or space
   * 2. Split the sentence on spaces to create an array of words, and
   * 3. Get the first word if `firstOnly` is `true`, or else the whole array
   */
  const words = sentence
    .replace(/\W /g, ' ')
    .split(' ')
    .slice(0, firstOnly ? 1 : Infinity) as string[];

  // Check if any of the words matches our set of keywords.
  return words.some((word: string) => keywords.has(word.toLowerCase()));
};

export const labeler = testableSchedule(
  'Label newly created issue based on keywords',
  async () => {
    const gh = danger.github as any;
    const repo = gh.repository;
    const issue = gh.issue;
    const title = issue.title;
    const currentLabels = danger.github.issue.labels.map(i => i.name);

    let labels: Set<string> = new Set(currentLabels);

    //markdown('This is a test. @jlengstorf is pushing buttons; disregard.');

    if (endsWith('?', title) || matchKeyword(questionWords, title, true)) {
      labels.add('question').add('type: question or discussion');
    }

    if (matchKeyword(documentationWords, title)) {
      labels.add('type: documentation');
    }

    if (labels.size > 0) {
      await danger.github.api.issues.addLabels({
        owner: repo.owner.login,
        repo: repo.name,
        number: issue.number,
        labels: Array.from(labels)
      });
    }
  }
);
