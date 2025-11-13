import { Context } from '@actions/github/lib/context';

export async function createBranch(getOctokit: any, context: Context, branch: string, sha?: string) {
  const toolkit = getOctokit(githubToken());
  // Sometimes branch might come in with refs/heads already
  branch = branch.replace('refs/heads/', '');
  const ref = `refs/heads/${branch}`;

  // Check if branch already exists
  try {
    await toolkit.rest.repos.getBranch({
      ...context.repo,
      branch,
    });

    // Branch exists, update it with the new SHA
    const resp = await toolkit.rest.git.updateRef({
      ref,
      sha: sha || context.sha,
      ...context.repo,
    });

    return isValidRefResponse(resp, ref);
  } catch (error: any) {
    if (error.name === 'HttpError' && error.status === 404) {
      // Branch doesn't exist, create it
      const resp = await toolkit.rest.git.createRef({
        ref,
        sha: sha || context.sha,
        ...context.repo,
      });

      return isValidRefResponse(resp, ref);
    } else {
      throw Error(error);
    }
  }
}

function isValidRefResponse(resp: any, expectedRef: string): boolean {
  return resp?.data?.ref === expectedRef;
}

function githubToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw ReferenceError('No token defined in the environment variables');
  return token;
}
