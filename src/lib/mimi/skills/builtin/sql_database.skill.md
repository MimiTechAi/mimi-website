---
name: sql_database
description: "Manages a local SQLite database in the browser. Use this to store structured data, run complex queries, and persist information."
capabilities: ["database", "sql", "storage", "structured-data"]
enabled: true
---

# INSTRUCTIONS

When the user asks to store data or query structured information:

1. **Write SQL**: Enclose code in \`\`\`sql ... \`\`\` blocks.
2. **Create Tables**: Always check if a table exists or create it first.
3. **Insert Data**: Populate the database with relevant data.
4. **Query**: Select data to show results.

## Example

User: "Create a user table and add John."

\`\`\`sql
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT);
INSERT INTO users (name) VALUES ('John');
SELECT * FROM users;
\`\`\`
