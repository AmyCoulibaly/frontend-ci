// Pipeline CI du frontend : build, tests, scan du code, image Docker, scan Trivy, push Docker Hub.
// Prérequis Jenkins : Docker CLI accessible à l'agent, identifiants Docker Hub
// enregistrés sous l'ID « dockerhub-credentials » (Nom d'utilisateur + mot de passe/token).

def run(String cmd, boolean status = false) {
  if (isUnix()) {
    return sh(script: cmd, returnStatus: status)
  }
  return bat(script: cmd, returnStatus: status)
}

def dockerSock() {
  return isUnix() ? '/var/run/docker.sock' : '//var/run/docker.sock'
}

pipeline {
  agent any

  environment {
    DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
    IMAGE          = "${DOCKERHUB_CREDENTIALS_USR}/esante-frontend"
    DOCKERHUB_USER = "${DOCKERHUB_CREDENTIALS_USR}"
    GIT_SHORT_SHA  = "${env.GIT_COMMIT?.take(7) ?: 'unknown'}"
    TAG            = "${GIT_SHORT_SHA}-${env.BUILD_NUMBER}"
    TEST_IMAGE     = 'esante-frontend-test'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
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

    stage('Installation et tests unitaires') {
      steps {
        script {
          run("docker build --target test -t ${TEST_IMAGE} .")
        }
      }
    }

    stage('Scan de sécurité du code (npm audit)') {
      steps {
        script {
          int code = run("docker run --rm ${TEST_IMAGE} npm audit --omit=dev --audit-level=high > npm-audit.txt 2>&1", true)
          echo readFile('npm-audit.txt')
          if (code != 0) {
            unstable('npm audit : vulnérabilité(s) HIGH trouvée(s) dans les dépendances de production')
          }
        }
      }
    }

    stage('Build de l\'image Docker') {
      steps {
        script {
          run("docker build -t ${IMAGE}:${TAG} -t ${IMAGE}:latest .")
        }
      }
    }

    stage('Scan de l\'image (Trivy)') {
      steps {
        script {
          def trivy = "docker run --rm -v ${dockerSock()}:/var/run/docker.sock -v trivy-cache:/root/.cache/ aquasec/trivy:latest image --timeout 30m"

          run("${trivy} --severity HIGH,CRITICAL --exit-code 0 ${IMAGE}:${TAG} > trivy-report.txt 2>&1")
          echo readFile('trivy-report.txt')

          int gate = run("${trivy} --severity CRITICAL --ignore-unfixed --exit-code 1 --quiet ${IMAGE}:${TAG}", true)
          if (gate != 0) {
            error('Trivy : vulnérabilité CRITICAL corrigeable trouvée dans l\'image')
          }
        }
      }
    }

    stage('Push vers Docker Hub') {
      when {
        anyOf {
          branch 'main'
          branch 'master'
        }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          script {
            if (isUnix()) {
              sh 'echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin'
            } else {
              bat '@echo off\r\necho %DH_PASS%| docker login -u %DH_USER% --password-stdin'
            }
            run("docker push ${IMAGE}:${TAG}")
            run("docker push ${IMAGE}:latest")
          }
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'npm-audit.txt, trivy-report.txt', allowEmptyArchive: true
      script {
        run('docker logout', true)
        run('docker image prune -f', true)
      }
    }
    success {
      echo "Image publiée : ${IMAGE}:${TAG}"
    }
    failure {
      echo 'Pipeline en échec : consultez les logs de l\'étape concernée.'
    }
  }
}
