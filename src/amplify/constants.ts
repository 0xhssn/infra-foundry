export const DEFAULT_BUILD_SPEC = `
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
    appRoot: .
    customHeaders:
      - pattern: '**/*'
        headers:
          - key: 'Cache-Control'
            value: 'public, max-age=0, must-revalidate'
  `
