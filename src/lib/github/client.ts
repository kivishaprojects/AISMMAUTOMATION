import "server-only";

const API = "https://api.github.com";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/** Verifies the token can actually see the repo before we try anything else. */
export async function verifyRepoAccess(owner: string, repo: string, token: string): Promise<void> {
  const res = await fetch(`${API}/repos/${owner}/${repo}`, { headers: headers(token) });
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? "Repo not found, or this token doesn't have access to it."
        : `GitHub access check failed: ${await res.text()}`
    );
  }
}

async function getDefaultBranchSha(owner: string, repo: string, token: string): Promise<{ branch: string; sha: string }> {
  const repoRes = await fetch(`${API}/repos/${owner}/${repo}`, { headers: headers(token) });
  if (!repoRes.ok) throw new Error(`Could not read repo info: ${await repoRes.text()}`);
  const repoData = await repoRes.json();
  const branch = repoData.default_branch;

  const refRes = await fetch(`${API}/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers: headers(token) });
  if (!refRes.ok) throw new Error(`Could not read default branch: ${await refRes.text()}`);
  const refData = await refRes.json();
  return { branch, sha: refData.object.sha };
}

async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  ref: string,
  token: string
): Promise<{ content: string; sha: string }> {
  const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}?ref=${ref}`, { headers: headers(token) });
  if (!res.ok) {
    throw new Error(`Could not read ${path} from the repo: ${await res.text()}`);
  }
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

export type FileEdit = {
  path: string;
  find: string;
  replace: string;
};

export type FileCreate = {
  path: string;
  content: string;
};

/**
 * Creates a branch, applies simple find/replace edits and/or creates new
 * files, commits them, and opens a Pull Request. Deliberately does NOT
 * push straight to the default branch \u2014 a PR is the safety net for
 * changes an AI proposed, so a human still reviews the actual diff before
 * it goes live.
 */
export async function openFixPullRequest({
  owner,
  repo,
  token,
  branchName,
  title,
  body,
  edits,
  creates = [],
}: {
  owner: string;
  repo: string;
  token: string;
  branchName: string;
  title: string;
  body: string;
  edits: FileEdit[];
  creates?: FileCreate[];
}): Promise<string> {
  await verifyRepoAccess(owner, repo, token);
  const { branch: baseBranch, sha: baseSha } = await getDefaultBranchSha(owner, repo, token);

  const createRefRes = await fetch(`${API}/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
  });
  if (!createRefRes.ok) {
    throw new Error(`Could not create branch: ${await createRefRes.text()}`);
  }

  const editsByPath = new Map<string, FileEdit[]>();
  for (const edit of edits) {
    if (!editsByPath.has(edit.path)) editsByPath.set(edit.path, []);
    editsByPath.get(edit.path)!.push(edit);
  }

  for (const [path, pathEdits] of editsByPath) {
    const { content, sha } = await getFileContent(owner, repo, path, baseBranch, token);
    let updated = content;
    for (const edit of pathEdits) {
      if (!updated.includes(edit.find)) {
        throw new Error(
          `Could not find the expected text in ${path} to replace \u2014 the file may have changed since it was analyzed.`
        );
      }
      updated = updated.replace(edit.find, edit.replace);
    }

    const updateRes = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify({
        message: `AI fix: update ${path}`,
        content: Buffer.from(updated, "utf-8").toString("base64"),
        sha,
        branch: branchName,
      }),
    });
    if (!updateRes.ok) {
      throw new Error(`Could not commit changes to ${path}: ${await updateRes.text()}`);
    }
  }

  for (const file of creates) {
    // Check whether the file already exists on this branch so we send its
    // sha (required for GitHub to treat this as an update rather than a
    // create) \u2014 covers regenerating robots.txt/sitemap files that already
    // exist in the repo.
    let existingSha: string | undefined;
    try {
      const existing = await getFileContent(owner, repo, file.path, branchName, token);
      existingSha = existing.sha;
    } catch {
      // file doesn't exist yet on this branch \u2014 that's fine, it's a create
    }

    const createRes = await fetch(`${API}/repos/${owner}/${repo}/contents/${file.path}`, {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify({
        message: `AI fix: ${existingSha ? "update" : "create"} ${file.path}`,
        content: Buffer.from(file.content, "utf-8").toString("base64"),
        ...(existingSha ? { sha: existingSha } : {}),
        branch: branchName,
      }),
    });
    if (!createRes.ok) {
      throw new Error(`Could not write ${file.path}: ${await createRes.text()}`);
    }
  }

  const prRes = await fetch(`${API}/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ title, body, head: branchName, base: baseBranch }),
  });
  if (!prRes.ok) {
    throw new Error(`Could not open pull request: ${await prRes.text()}`);
  }
  const pr = await prRes.json();
  return pr.html_url;
}
