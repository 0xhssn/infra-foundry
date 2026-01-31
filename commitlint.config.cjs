module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce conventional commit types
    'type-enum': [
      2,
      'always',
      [
        'feat', // New features
        'fix', // Bug fixes
        'docs', // Documentation changes
        'style', // Code style changes (formatting, etc.)
        'refactor', // Code refactoring
        'perf', // Performance improvements
        'test', // Adding or updating tests
        'build', // Build system or external dependencies
        'ci', // CI/CD changes
        'chore', // Maintenance tasks
        'revert' // Reverting changes
      ]
    ],
    // Enforce project-specific scopes based on src/ structure
    'scope-enum': [
      2,
      'always',
      [
        // AWS Components
        'amplify',
        'app-runner',
        'cloudflare',
        'ecr',
        'ecs',
        'image',
        'rds',
        'route53',
        's3',
        'secret',
        'ses',
        'vpc',
        // Utilities
        'utils',
        // Meta scopes
        'deps',
        'ci',
        'release'
      ]
    ],
    // Require scope for all commits
    'scope-empty': [2, 'never'],
    // Enforce lowercase for scope
    'scope-case': [2, 'always', 'kebab-case'],
    // Enforce lowercase for subject
    'subject-case': [2, 'always', 'lower-case'],
    // Don't end subject with period
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    // Header max length
    'header-max-length': [2, 'always', 100]
  }
};
