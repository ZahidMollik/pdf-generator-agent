export function extractUserPreferences(userInput: string) {
  // Enhanced patterns for structured input from the form
  const structuredProjectPattern = /project name:\s*(.+?)(?:\n|title:|$)/i;
  const structuredBudgetPattern = /budget:\s*(.+?)(?:\n|timeline:|$)/i;
  const structuredTimelinePattern =
    /timeline:\s*(.+?)(?:\n|specific requirements:|$)/i;
  const structuredRequirementsPattern =
    /specific requirements:\s*(.+?)(?:\n|$)/i;

  let timeline = '';
  let budget = '';
  const requirements = new Set<string>();
  let title = '';

  // Extract from structured format (primary method)
  const structuredProjectMatch = userInput.match(structuredProjectPattern);
  const structuredBudgetMatch = userInput.match(structuredBudgetPattern);
  const structuredTimelineMatch = userInput.match(structuredTimelinePattern);
  const structuredRequirementsMatch = userInput.match(
    structuredRequirementsPattern,
  );

  if (structuredProjectMatch) {
    title = structuredProjectMatch[1].trim();
  }

  if (structuredBudgetMatch) {
    budget = structuredBudgetMatch[1].trim();
  }

  if (structuredTimelineMatch) {
    timeline = structuredTimelineMatch[1].trim();
  }

  if (structuredRequirementsMatch) {
    const reqText = structuredRequirementsMatch[1].trim();
    if (reqText) {
      const reqList = reqText
        .split(/[,;&\n]/)
        .map((r) => r.trim())
        .filter((r) => r.length > 2);

      reqList.forEach((req) => requirements.add(req));
    }
  }

  return { title, timeline, budget, requirements: Array.from(requirements) };
}
