import fs from 'fs';

function extractFunctions(sourceFile, targetFile, functionsToExtract, exportFrom) {
  let source = fs.readFileSync(sourceFile, 'utf8');
  let target = fs.existsSync(targetFile) ? fs.readFileSync(targetFile, 'utf8') : '';

  for (const fn of functionsToExtract) {
    const regex = new RegExp(\`export async function \${fn}\\\\([\\\\s\\\\S]*?\\n}\`, 'm');
    const match = source.match(regex);
    if (match) {
      target += '\\n' + match[0] + '\\n';
      // Replace the function in the source file with an export
      // Actually, we can just replace the whole file at the end to be an adapter,
      // But the instruction says "reverse old functions into compatibility adapters".
      // We will just rewrite the source file completely at the end.
    }
  }

  fs.writeFileSync(targetFile, target);
}

// Since ALL functions in these files are for standings, I will just move the ENTIRE FILES into the feature layer, 
// and change the legacy files to be ONLY export statements!
// Wait! I tried that before and it caused "deep-import" errors because I imported from \`src/features/.../queries/...\`.
// To avoid deep-import, the legacy files MUST import from \`@/features/standings/server\`.

