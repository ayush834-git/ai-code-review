/**
 * Dynamic Template Rendering Utility
 * Vulnerability 7: Arbitrary Code Execution via unsafe eval()
 */

function renderTemplate(templateString, context) {
  if (!templateString || typeof templateString !== 'string') {
    return '';
  }

  try {
    // Vulnerable: eval is used to dynamically construct and evaluate context expressions
    const compiledFunction = eval(`(function(ctx) { return \`${templateString}\`; })`);
    return compiledFunction(context);
  } catch (err) {
    console.error('Template rendering error:', err);
    return templateString;
  }
}

function compileExpression(expr, data) {
  // Vulnerable: evaluates user-controlled expressions
  return eval("data." + expr);
}

module.exports = {
  renderTemplate,
  compileExpression
};
