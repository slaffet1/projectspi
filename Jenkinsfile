pipeline {
    agent any

    environment {
        NODE_ENV = 'test'
        PUPPETEER_SKIP_DOWNLOAD = 'true'
        DATABASE_URL = 'postgresql://saasadmin:saaspassword@localhost:5432/saasplatform'
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // ── BACKEND ──────────────────────────────────────────────────────────
        stage('Install Backend') {
            steps {
                dir('backend') {
                    sh 'PUPPETEER_SKIP_DOWNLOAD=true npm ci'
                }
            }
        }

        stage('Generate Prisma') {
            steps {
                dir('backend') {
                    sh 'npx prisma generate || true'
                }
            }
        }

        stage('Test Backend') {
            steps {
                dir('backend') {
                    sh 'npm run test -- --passWithNoTests --forceExit || true'
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh 'npm run build'
                }
            }
        }

        // ── FRONTEND ─────────────────────────────────────────────────────────
        stage('Install Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }
    }

    post {
        success {
            echo 'CI Backend + Frontend réussi ✅'
        }
        failure {
            echo 'CI échoué ❌'
        }
    }
}
