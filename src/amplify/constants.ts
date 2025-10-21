export function createMonorepoBuildSpec(appRoot: string, { installPlaywright = false }: { installPlaywright?: boolean } = {}): string {
  if (appRoot !== '.' && installPlaywright) {
    return `
      version: 1
      applications:
        - appRoot: "${appRoot}"
          frontend:
            phases:
              preBuild:
                commands:
                  - yarn install --frozen-lockfile
                  ${installPlaywright ? `- yarn playwright install-deps
                  - yarn playwright install chromium` : ''}
              build:
                commands:
                  - yarn build
            artifacts:
              baseDirectory: .next
              files:
                - '**/*'
            cache:
              paths:
                - node_modules/**/*
                - .yarn-cache/**/*
      customHeaders:
        - pattern: '**/*'
          headers:
            - key: 'Cache-Control'
              value: 'public, max-age=0, must-revalidate'
    `
  } else {
    return `
      version: 1
      frontend:
        phases:
          preBuild:
            commands:
              - yarn install --frozen-lockfile
              ${installPlaywright ? `- yarn playwright install-deps
              - yarn playwright install chromium` : ''}
          build:
            commands:
              - yarn build
        artifacts:
          baseDirectory: .next
          files:
            - '**/*'
        cache:
          paths:
            - node_modules/**/*
            - .yarn-cache/**/*
      customHeaders:
        - pattern: '**/*'
          headers:
            - key: 'Cache-Control'
              value: 'public, max-age=0, must-revalidate'
    `
  }
}
