pipeline {
    agent any

    environment {
        NODE_ENV = 'test'
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
                    sh 'npm ci'
                }
            }
        }

        stage('Test Backend') {
            steps {
                dir('backend') {
                    sh 'npm run test -- --passWithNoTests'
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
