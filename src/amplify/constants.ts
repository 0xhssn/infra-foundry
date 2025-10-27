export function createMonorepoBuildSpec(appRoot: string): string {
  if (appRoot !== '.') {
    return `
      version: 1
      applications:
        - appRoot: "${appRoot}"
          frontend:
            phases:
              preBuild:
                commands:
                  - yarn install --frozen-lockfile
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
