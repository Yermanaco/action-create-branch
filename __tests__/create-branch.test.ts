import { createBranch } from '../src/create-branch'
import { readFileSync } from 'fs';
import { context } from '@actions/github';

describe('Create a branch based on the input', () => {
  process.env.GITHUB_TOKEN = 'token'

  let branch = 'release-v1';
  let sha = 'ffac537e6cbbf934b08745a378932722df287a53';
  let contextMock = JSON.parse(readFileSync('__tests__/context.json', 'utf8'));
  let githubMock = jest.fn();
  let octokitMock = {
    rest: {
      git: {
        createRef: jest.fn(),
        updateRef: jest.fn(),
        getRef: jest.fn()
      },
      repos: {
        getBranch: jest.fn()
      }
    }
    
  };

  beforeEach(() => {
    jest.resetAllMocks();
    githubMock.mockImplementation(() => octokitMock);
  });

  it('gets a branch', async () => {
    octokitMock.rest.git.getRef.mockRejectedValue(new HttpError())
    octokitMock.rest.git.createRef.mockResolvedValue({ data: { ref: `refs/heads/${branch}` } });
    process.env.GITHUB_REPOSITORY = 'peterjgrainger/test-action-changelog-reminder'
    await createBranch(githubMock, context, branch)
    expect(octokitMock.rest.git.getRef).toHaveBeenCalledWith({
      ref: `heads/${branch}`,
      repo: 'test-action-changelog-reminder',
      owner: 'peterjgrainger'
    })
  });

  it('Creates a new branch if not already there', async () => {
    octokitMock.rest.git.getRef.mockRejectedValue(new HttpError())
    octokitMock.rest.git.createRef.mockResolvedValue({ data: { ref: 'refs/heads/release-v1' } });
    await createBranch(githubMock, contextMock, branch)
    expect(octokitMock.rest.git.createRef).toHaveBeenCalledWith(expect.objectContaining({
      ref: 'refs/heads/release-v1',
      sha: 'ebb4992dc72451c1c6c99e1cce9d741ec0b5b7d7'
    }))
  });

  it('Creates a new branch from a given commit SHA', async () => {
    octokitMock.rest.git.getRef.mockRejectedValue(new HttpError())
    octokitMock.rest.git.createRef.mockResolvedValue({ data: { ref: 'refs/heads/release-v1' } });
    await createBranch(githubMock, contextMock, branch, sha)
    expect(octokitMock.rest.git.createRef).toHaveBeenCalledWith(expect.objectContaining({
      ref: 'refs/heads/release-v1',
      sha: 'ffac537e6cbbf934b08745a378932722df287a53'
    }))
  })

  it('Replaces refs/heads in branch name', async () => {
    octokitMock.rest.git.getRef.mockRejectedValue(new HttpError())
    octokitMock.rest.git.createRef.mockResolvedValue({ data: { ref: 'refs/heads/release-v1' } });
    await createBranch(githubMock, contextMock, `refs/heads/${branch}`)
    expect(octokitMock.rest.git.createRef).toHaveBeenCalledWith(expect.objectContaining({
      ref: 'refs/heads/release-v1',
      sha: 'ebb4992dc72451c1c6c99e1cce9d741ec0b5b7d7'
    }))
  });

  it('Updates existing branch via fast-forward', async () => {
    // getRef succeeds (ref exists)
    octokitMock.rest.git.getRef.mockResolvedValue({ data: { ref: 'refs/heads/release-v1', object: { sha: contextMock.sha } } });
    octokitMock.rest.git.updateRef.mockResolvedValue({ data: { ref: 'refs/heads/release-v1' } });

    const result = await createBranch(githubMock, contextMock, branch, undefined);

    expect(octokitMock.rest.git.updateRef).toHaveBeenCalledWith(expect.objectContaining({
      ref: 'heads/release-v1',
      sha: contextMock.sha
    }));

    expect(result).toBe(true);
  });

  it('Fails if github token isn\'t defined', async () => {
    delete process.env.GITHUB_TOKEN
    expect.assertions(1);
    try {
      await createBranch(githubMock, contextMock, branch)
    } catch (error) {
      expect(error).toEqual(new ReferenceError('No token defined in the environment variables'))
    }
  });
});

class HttpError extends Error {
  name = 'HttpError'
  status = 404
}
