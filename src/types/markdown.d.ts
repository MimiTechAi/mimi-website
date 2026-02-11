// Type declarations for importing .md files as strings
declare module '*.md' {
    const content: string;
    export default content;
}

// Type declarations for importing .skill.md files
declare module '*.skill.md' {
    const content: string;
    export default content;
}
