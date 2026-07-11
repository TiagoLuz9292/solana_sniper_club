const PAT    = process.env.GITHUB_PAT ?? "";
const REPO   = process.env.GITHUB_REPO ?? "TiagoLuz9292/bybit_trading_bot";
const BRANCH = process.env.GITHUB_BRANCH ?? "investment_demo_bot";

const BASE = "https://api.github.com";

export async function fetchFileFromGitHub(path: string): Promise<string> {
  if (!PAT) throw new Error("GITHUB_PAT env var is not set");

  const url = `${BASE}/repos/${REPO}/contents/${path}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${PAT}`,
      Accept: "application/vnd.github.raw+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: { revalidate: 15 },
  });

  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status} for ${path} (repo=${REPO} branch=${BRANCH} pat_set=${!!PAT})`);
  }

  return res.text();
}
