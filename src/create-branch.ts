import { Context } from '@actions/github/lib/context';
import * as core from '@actions/core';

export async function createBranch(getOctokit: any, context: Context, branch: string, sha?: string) {
  const toolkit = getOctokit(githubToken());
  // Sometimes branch might come in with refs/heads already
  branch = branch.replace('refs/heads/', '');
  const ref = `refs/heads/${branch}`;
  const refPath = `heads/${branch}`;
  const targetSha = sha || context.sha;
  
  core.debug(`Target ref: ${ref} (createRef), refPath: ${refPath} (getRef/updateRef), target SHA: ${targetSha}`);
  // Check if branch already exists using git refs API (heads/<branch>)
  try {
    const refData = await toolkit.rest.git.getRef({
      ref: refPath,
      ...context.repo,
    });

    core.debug(`Found ref via getRef: ${JSON.stringify(refData.data)}`);

    // If ref exists, update it to target SHA
    const resp = await toolkit.rest.git.updateRef({
      ref: refPath,
      sha: targetSha,
      ...context.repo,
    });

    core.debug(`updateRef response: ${JSON.stringify(resp.data)}`);
    return isValidRefResponse(resp, ref);
  } catch (error: any) {
    // If the ref was not found, create it. Other errors bubble up.
    if (error.name === 'HttpError' && error.status === 404) {
      core.debug(`Ref not found via getRef, creating new branch`);
      const resp = await toolkit.rest.git.createRef({
        ref,
        sha: targetSha,
        ...context.repo,
      });

      core.debug(`createRef response: ${JSON.stringify(resp.data)}`);
      return isValidRefResponse(resp, ref);
    }

    core.debug(`Unexpected error while checking/creating ref: ${error.name} ${error.status} ${error.message}`);
    throw error;
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
