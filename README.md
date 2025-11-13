# Create Branch GitHub Action

This action creates a new branch with the same commit reference as the branch it is being run on, or your chosen reference when specified.

## Inputs

### `branch`

**Optional** The name of the branch to create. Default `"release-candidate"`. If your branch contains forward slashes (`/`) use the full branch reference. Instead of `/long/branch/name` use `refs/heads/long/branch/name`. It's an issue with the GitHub API https://gist.github.com/jasonrudolph/10727108

If the branch already exists, the action will attempt to update the branch reference to point at the provided `sha` (or the current event `sha`) via a fast‑forward update. The action does not force-push or rewrite history; if the update is not a fast‑forward the API will reject the update.

### `sha`

**Optional** The SHA-1 value for the branch reference.

## Outputs

### `created` 

Boolean value representing whether the action successfully created or updated the branch reference. `true` means the branch reference was created or updated to point at the requested SHA; `false` indicates the operation failed.

## Example usage

```
uses: peterjgrainger/action-create-branch@v2.2.0
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
with:
  branch: 'release-notes'
  sha: '${{ github.event.pull_request.head.sha }}'
```
