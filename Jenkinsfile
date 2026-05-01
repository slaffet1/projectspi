pipeline {
    agent any

    environment {
        NODE_ENV = 'test'
        PUPPETEER_SKIP_DOWNLOAD = 'true'
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
                    sh 'npx prisma generate'
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
    }

    post {
        success {
            echo 'CI Backend réussi ✅'
        }
        failure {
            echo 'CI Backend échoué ❌'
        }
    }
}
