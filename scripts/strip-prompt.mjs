// A page's `prompt:` records what it was written from: repository paths and
// instructions for whoever edits it. It is for authors, so it stays in the
// .mdx files, but Holocron serves the raw source as the page's .md copy, in
// docs.zip and to "Ask AI". This plugin takes the field out of each page as
// Holocron loads it, before anything serves it. Nothing of Holocron reads
// `prompt` from a page's frontmatter.

const PAGE = '\0virtual:holocron-mdx-page/';

/** The page's source without the `prompt` field of its leading frontmatter. */
export function stripPrompt(mdx) {
    const head = mdx.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!head) return mdx;

    const kept = [];
    let inPrompt = false;
    for (const line of head[1].split(/\r?\n/)) {
        // A block or a folded value goes on while its lines are indented.
        if (inPrompt && (line.startsWith(' ') || line.startsWith('\t') || line === '')) continue;
        inPrompt = /^prompt\s*:/.test(line);
        if (!inPrompt) kept.push(line);
    }

    return `---\n${kept.join('\n')}\n---\n${mdx.slice(head[0].length)}`;
}

/** The Vite plugin: Holocron's page modules export the source as one string. */
export function stripPromptPlugin() {
    return {
        name: 'mesub:strip-prompt',
        transform(code, id) {
            if (!id.startsWith(PAGE)) return null;
            const match = code.match(/^export default (".*")\s*;?\s*$/s);
            if (!match) return null;
            const source = JSON.parse(match[1]);
            if (!/^prompt\s*:/m.test(source)) return null;
            return { code: `export default ${JSON.stringify(stripPrompt(source))}`, map: null };
        },
    };
}
