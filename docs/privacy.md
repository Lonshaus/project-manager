# Privacy Policy — Project Manager (Chrome Extension)

_Last updated: 2026-05-13_

## Overview

Project Manager is a Chrome extension that turns GitHub repositories into kanban-style project boards. It is provided as-is by Lonshaus.

## Data we access

The extension only interacts with GitHub on behalf of the user. To do so it asks the user to provide a personal access token (PAT) inside the extension's settings panel.

| Data | Stored where | Purpose | Transmitted to |
|---|---|---|---|
| GitHub Personal Access Token | `chrome.storage.sync` (browser-managed, syncs with the user's Google account) | Authenticate requests to GitHub | api.github.com only, via the standard `Authorization` HTTP header |
| GitHub username | `chrome.storage.sync` | Compose API request URLs | api.github.com only |
| Repository list, active project, theme, language preference | `chrome.storage.sync` | UI state | Not transmitted |
| Cached issues, comments, drafts | `chrome.storage.local` / IndexedDB on the user's device | Offline rendering and unsent-change preservation | Not transmitted |

## Data we do NOT collect

We do not run any backend server. We do not collect analytics, telemetry, usage statistics, IP addresses, or any personal identifier. We do not share, sell, or transfer any data to third parties.

## Third-party services

The only external service the extension contacts is **GitHub** (`https://api.github.com/`). All requests are governed by [GitHub's Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

## User control

- The user may revoke the token at any time from <https://github.com/settings/tokens>.
- Uninstalling the extension removes all locally-cached data; data stored on GitHub is unaffected.
- Clearing the extension's storage from `chrome://extensions` also removes all locally-stored values, including the token.

## Contact

Questions or requests: open an issue at <https://github.com/Lonshaus/project-manager/issues>.