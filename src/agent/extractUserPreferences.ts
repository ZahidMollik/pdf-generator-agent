export function extractUserPreferences(userInput: string) {
  const lower = userInput.toLowerCase();

  const timelinePatterns = [
    /within (\d+(?:\.\d+)?) (?:weeks?|months?|days?)/i,
    /in (\d+(?:\.\d+)?) (?:weeks?|months?|days?)/i,
    /(\d+(?:\.\d+)?) (?:weeks?|months?|days?) timeline/i,
    /timeline (?:is |of |around )?(\d+(?:\.\d+)?) (?:weeks?|months?|days?)/i,
    /need(?:s|ed)? (?:it |this )?(?:by|in|within) (\d+(?:\.\d+)?) (?:weeks?|months?|days?)/i,
    /deadline (?:of |is )?(\d+(?:\.\d+)?) (?:weeks?|months?|days?)/i,
    /(\d+(?:\.\d+)?) (?:week|month|day)s? (?:project|timeline|timeframe)/i,
  ];

  const budgetPatterns = [
    /budget (?:is |of |around )?[\$£€]?([\d,]+(?:\.\d{2})?)/i,
    /[\$£€]([\d,]+(?:\.\d{2})?) budget/i,
    /cost (?:should be |is |around )?[\$£€]?([\d,]+(?:\.\d{2})?)/i,
    /afford [\$£€]?([\d,]+(?:\.\d{2})?)/i,
    /spend [\$£€]?([\d,]+(?:\.\d{2})?)/i,
    /price range (?:is )?[\$£€]?([\d,]+(?:\.\d{2})?)/i,
  ];

  const requirementIntroPatterns = [
    /(?:the site|system|platform|app)?\s*should\s*(?:include|support|have)\s*(.+?)(?:\.|$)/i,
    /we\s*(?:want|would like)\s*(?:features|functionalities)?\s*(?:like|such as|including)\s*(.+?)(?:\.|$)/i,
    /requirements\s*(?:are|include)?\s*(.+?)(?:\.|$)/i,
    /need\s*(.+?)(?:\.|$)/i,
  ];

  const titlePatterns = [
    // Direct project name patterns
    /(?:project|title|name|called)\s*(?:is\s*|:)?\s*["']?([a-zA-Z0-9\s\-&\.]+?)["']?\s*$/i,
  ];

  let timeline = '';
  let budget = '';
  const requirements = new Set<string>();
  let title = '';

  for (const pattern of timelinePatterns) {
    const match = userInput.match(pattern);
    if (match) {
      timeline = match[0];
      break;
    }
  }

  for (const pattern of budgetPatterns) {
    const match = userInput.match(pattern);
    if (match) {
      budget = match[0];
      break;
    }
  }

  for (const pattern of requirementIntroPatterns) {
    const match = userInput.match(pattern);
    if (match && match[1]) {
      const extractedChunk = match[1];

      const featureList = extractedChunk
        .split(/[,;&\n]/)
        .map((f) => f.trim().toLowerCase())
        .filter((f) => f.length > 2);

      for (const feature of featureList) {
        requirements.add(feature);
      }
    }
  }

  for (const pattern of titlePatterns) {
    const match = userInput.match(pattern);
    if (match && match[1]) {
      title = match[1]
        .trim()
        .replace(/\s+/g, ' ') // normalize whitespace
        .replace(/['"]/g, '') // remove quotes
        .replace(
          /\b(website|app|portal|platform|system|project|development)\b$/i,
          '',
        ) // remove common suffixes
        .replace(/^(the|a|an)\s+/i, '') // remove articles from beginning
        .trim();

      // Only use the title if it's meaningful
      if (
        title.length > 1 &&
        !/^(is|are|for|of|the|a|an|this|that|and|or)$/i.test(title)
      ) {
        // Capitalize first letter of each word for better presentation
        title = title.replace(/\b\w/g, (l) => l.toUpperCase());
        break;
      } else {
        title = '';
      }
    }
  }

  return { title, timeline, budget, requirements };
}
