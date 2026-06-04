const PAT    = process.env.GITHUB_PAT!;
const REPO   = process.env.GITHUB_REPO!;
const BRANCH = process.env.GITHUB_BRANCH!;

const BASE = "https://api.github.com";

export async function fetchFileFromGitHub(path: string): Promise<string> {
  const url = `${BASE}/repos/${REPO}/contents/${path}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${PAT}`,
      Accept: "application/vnd.github.raw+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status} for ${path}`);
  }

  return res.text();
}
