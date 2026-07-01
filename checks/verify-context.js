import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const warnings = [];

const requiredFiles = [
  "README.md",
  "AGENTS.md",
  "package.json",
  "registry/services.md",
  "registry/code-map.md",
  ".agents/skills/loopad-ctx-structure-verifier/SKILL.md",
  ".agents/skills/loopad-ctx-contract-sync-checker/SKILL.md",
  "docs/reference_repository-structure.md",
  "docs/process_context-maintenance.md"
];

const requiredServiceSections = [
  "역할",
  "하지 않는 일",
  "공개 인터페이스",
  "의존 서비스",
  "관련 workflow",
  "관련 rule",
  "로컬 검증"
];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

for (const file of requiredFiles) {
  if (!exists(file)) {
    fail(`Missing required file: ${file}`);
  }
}

if (exists("registry/services.md")) {
  const services = read("registry/services.md");
  const usingSection = sectionBetween(services, "## 사용하는 것", "## 사용하지 않는 것");
  const rows = tableRows(usingSection);

  for (const row of rows) {
    const columns = row.split("|").map((value) => value.trim()).filter(Boolean);
    if (columns.length < 4 || columns[0] === "Service" || columns[0] === "---") {
      continue;
    }

    const service = columns[0];
    const contextPath = normalizeRegistryPath(columns[2]);
    if (!contextPath) {
      fail(`Service ${service} is missing a context path.`);
      continue;
    }

    if (!exists(contextPath)) {
      fail(`Service ${service} context does not exist: ${contextPath}`);
      continue;
    }

    const context = read(contextPath);
    for (const section of requiredServiceSections) {
      if (!hasHeading(context, section)) {
        fail(`Service ${service} context is missing section: ${section}`);
      }
    }

    if (!/\.\.\/workflows\/.+\.md/.test(context)) {
      warn(`Service ${service} context does not link to a workflow context.`);
    }
  }
}

if (exists("AGENTS.md")) {
  const agents = read("AGENTS.md");
  for (const link of markdownLinks(agents)) {
    if (isExternal(link) || link.startsWith("#")) {
      continue;
    }
    const clean = stripAnchor(link);
    if (!exists(clean)) {
      fail(`AGENTS.md links to missing path: ${link}`);
    }
  }
}

const duplicateRuleIds = findDuplicateRuleIds("rules");
for (const id of duplicateRuleIds) {
  fail(`Duplicate rule id: ${id}`);
}

if (exists("registry/services.md")) {
  const services = read("registry/services.md");
  if (/^\|.*\bLocal Path\b.*\|$/im.test(services)) {
    fail("registry/services.md must not include a Local Path table column.");
  }
}

printResult();

function sectionBetween(content, startHeading, endHeading) {
  const start = content.indexOf(startHeading);
  if (start < 0) {
    return "";
  }
  const end = content.indexOf(endHeading, start + startHeading.length);
  return end < 0 ? content.slice(start) : content.slice(start, end);
}

function tableRows(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"));
}

function normalizeRegistryPath(value) {
  const match = value.match(/\(([^)]+)\)/);
  const raw = match ? match[1] : value;
  if (!raw || raw === "-" || /^https?:\/\//.test(raw)) {
    return "";
  }
  return path.normalize(path.join("registry", raw));
}

function hasHeading(content, title) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^#{2,6}\\s+${escaped}\\s*$`, "m").test(content);
}

function markdownLinks(content) {
  const links = [];
  const regex = /\[[^\]]+\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1]);
  }
  return links;
}

function isExternal(link) {
  return /^[a-z]+:\/\//i.test(link) || link.startsWith("mailto:");
}

function stripAnchor(link) {
  return link.split("#")[0];
}

function findDuplicateRuleIds(relativeDir) {
  const dir = path.join(root, relativeDir);
  if (!fs.existsSync(dir)) {
    return [];
  }

  const seen = new Set();
  const duplicates = new Set();

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md")) {
      continue;
    }
    const content = fs.readFileSync(path.join(dir, file), "utf8");
    const regex = /\bRULE-[A-Z0-9]+-\d{3}\b/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const id = match[0];
      if (seen.has(id)) {
        duplicates.add(id);
      } else {
        seen.add(id);
      }
    }
  }

  return Array.from(duplicates).sort();
}

function printResult() {
  for (const message of warnings) {
    console.warn(`WARN ${message}`);
  }

  if (failures.length > 0) {
    for (const message of failures) {
      console.error(`FAIL ${message}`);
    }
    process.exit(1);
  }

  console.log("Context structure verified.");
}
