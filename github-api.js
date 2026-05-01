// 封裝所有 GitHub REST API 與 GraphQL 呼叫
class GitHubAPI {
  constructor(token) {
    this.token = token;
    this.baseURL = 'https://api.github.com';
  }
  // 取得單一 issue 的完整資料
  async getIssue(owner, repo, issueNumber) {
    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}/issues/${issueNumber}`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return response.json();
  }
  // 取得 repo 的所有 issues（含已關閉，最多 100 筆）
  async getIssues(owner, repo) {
    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}/issues?state=all&per_page=100`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    const data = await response.json();
    return data.filter(item => !item.pull_request);
  }
  // 在 repo 建立新 issue
  async createIssue(owner, repo, title, body, labels) {
    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({ title, body, labels })
      }
    );
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return response.json();
  }
  // 更新 issue（PATCH，可變更 state、title、body 等）
  async updateIssue(owner, repo, issueNumber, updates) {
    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify(updates)
      }
    );
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return response.json();
  }
  // 取得 issue 的所有留言
  async getIssueComments(owner, repo, issueNumber) {
    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}/issues/${issueNumber}/comments?per_page=100`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return response.json();
  }
  // REST API 不支援刪除 issue，必須用 GraphQL；需要 repo 的 admin 權限
  async deleteIssue(nodeId) {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `mutation DeleteIssue($id: ID!) { deleteIssue(input: { issueId: $id }) { repository { id } } }`,
        variables: { id: nodeId }
      })
    });
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    const data = await response.json();
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }
  }
  // 取得預設 branch 最新 commit 的 SHA；舊 repo 預設是 master，新 repo 預設是 main，兩者都試
  async getDefaultBranchSHA(owner, repo) {
    for (const branch of ['master', 'main']) {
      const response = await fetch(
        `${this.baseURL}/repos/${owner}/${repo}/branches/${branch}`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        return { sha: data.commit.sha, branch };
      }
    }
    throw new Error('找不到預設 branch（master/main）');
  }
  // 從指定 SHA 建立新 branch
  async createBranch(owner, repo, branchName, sha) {
    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}/git/refs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha })
      }
    );
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return response.json();
  }
  // 取得 repo 的所有 PR（含已關閉與已合併）
  async getPullRequests(owner, repo) {
    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}/pulls?state=all&per_page=100`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return response.json();
  }
  // 在 issue 新增一則留言
  async addComment(owner, repo, issueNumber, body) {
    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({ body })
      }
    );
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return response.json();
  }
  // 檢查 repo 是否為空（無任何 commit）
  async isRepoEmpty(owner, repo) {
    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}/git/refs`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    // GitHub 對空 repo 回傳 409 Conflict 而非 200 空陣列
    if (response.status === 409) {
      return true;
    }
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    const refs = await response.json();
    return refs.length === 0;
  }
  // 在 repo 建立或更新單一檔案，可用於在空 repo 建立初始 commit
  async createFile(owner, repo, path, content, message, branch) {
    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({ message, content: btoa(content), branch })
      }
    );
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return response.json();
  }
  // 檢查指定 repo 是否存在（404 視為不存在，其他錯誤照丟）
  async repoExists(owner, repo) {
    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    if (response.status === 404) {
      return false;
    }
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return true;
  }
  // 檢查指定 branch 是否存在於 repo
  async branchExists(owner, repo, branchName) {
    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}/branches/${encodeURIComponent(branchName)}`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    if (response.status === 404) {
      return false;
    }
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return true;
  }
  // 在 repo 建立 label（已存在則跳過）
  async createLabel(owner, repo, name, color) {
    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}/labels`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({ name, color })
      }
    );
    // 422 = label 已存在，視為成功
    if (!response.ok && response.status !== 422) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
  }
  // 整組替換 issue 的 labels（一次 PATCH）
  async setIssueLabels(owner, repo, issueNumber, labels) {
    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}/issues/${issueNumber}/labels`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({ labels })
      }
    );
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return response.json();
  }
  // 確保系統 labels 都存在（status:* 與 priority:*）。先 GET 列表比對，只 POST 缺的，避免 422 雜訊
  async ensureSystemLabels(owner, repo) {
    const required = [
      { name: 'status:todo', color: 'ededed' },
      { name: 'status:process', color: 'eab308' },
      { name: 'status:review', color: '4caf50' },
      { name: 'cancel', color: '9e9e9e' },
      { name: 'priority:low', color: 'fee2e2' },
      { name: 'priority:medium', color: 'fca5a5' },
      { name: 'priority:high', color: 'ef4444' },
      { name: 'priority:urgent', color: '991b1b' }
    ];
    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}/labels?per_page=100`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    const existing = await response.json();
    const existingNames = new Set(existing.map(l => l.name));
    const missing = required.filter(l => !existingNames.has(l.name));
    if (missing.length === 0) {
      return;
    }
    await Promise.all(missing.map(l => this.createLabel(owner, repo, l.name, l.color)));
  }
}