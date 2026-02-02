// Template data file for about.njk
// Dynamically sets permalink based on whether about.md exists in content/pages/
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default function() {
  // Check for about.md in content/pages/ directory
  const aboutPath = resolve(__dirname, "content/pages/about.md");
  const aboutExists = existsSync(aboutPath);

  return {
    // If about.md exists, disable this template's permalink
    // If not, use /about/ as the permalink
    permalink: aboutExists ? false : "/about/",
    // Also exclude from collections if about.md exists
    eleventyExcludeFromCollections: aboutExists
  };
}
