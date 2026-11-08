// Pipeline CI du frontend : build, tests, scan du code, image Docker, scan Trivy, push Docker Hub.
// Fonctionne sur un agent Linux (sh) comme sur un agent Windows (bat).
// Prérequis Jenkins : Docker CLI accessible à l'agent, identifiants Docker Hub
// enregistrés sous l'ID « dockerhub-creds » (Nom d'utilisateur + mot de passe/token).

// Exécute une commande avec sh (Linux) ou bat (Windows). Renvoie le code de sortie si status = true.
def run(String cmd, boolean status = false) {
  if (isUnix()) {
    return sh(script: cmd, returnStatus: status)
  }
  return bat(script: cmd, returnStatus: status)
}

// Chemin du socket Docker à monter dans le conteneur Trivy
def dockerSock() {
  return isUnix() ? '/var/run/docker.sock' : '//var/run/docker.sock'
}

pipeline {
  agent any

  environment {
    DOCKERHUB_USER = 'mbenend'          // à remplacer par le compte Docker Hub du groupe
    IMAGE          = "${DOCKERHUB_USER}/esante-frontend"
    TAG            = "${env.BUILD_NUMBER}"
    TEST_IMAGE     = 'esante-frontend-test'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  triggers {
    githubPush()   // déclenché par le webhook GitHub à chaque push
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Installation et tests unitaires') {
      steps {
        // npm ci + vitest s'exécutent dans l'étape « test » du Dockerfile
        script {
          run("docker build --target test -t ${TEST_IMAGE} .")
        }
      }
    }

    stage('Scan de sécurité du code (npm audit)') {
      steps {
        // Le build passe en « instable » (et non en échec) si une vulnérabilité HIGH est trouvée
        script {
          int code = run("docker run --rm ${TEST_IMAGE} npm audit --omit=dev --audit-level=high > npm-audit.txt 2>&1", true)
          echo readFile('npm-audit.txt')
          if (code != 0) {
            unstable('npm audit : vulnérabilité(s) HIGH trouvée(s) dans les dépendances de production')
          }
        }
      }
    }

    // Optionnel : analyse SonarQube (nécessite un serveur SonarQube et son plugin Jenkins)
    // stage('SonarQube') {
    //   steps {
    //     withSonarQubeEnv('sonarqube') {
    //       script {
    //         run("docker run --rm -e SONAR_HOST_URL=${env.SONAR_HOST_URL} -e SONAR_TOKEN=${env.SONAR_AUTH_TOKEN} -v \"${env.WORKSPACE}:/usr/src\" sonarsource/sonar-scanner-cli -Dsonar.projectKey=esante-frontend -Dsonar.sources=src")
    //       }
    //     }
    //   }
    // }

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

          // 1) Rapport complet HIGH et CRITICAL (archivé, ne bloque pas)
          run("${trivy} --severity HIGH,CRITICAL --exit-code 0 ${IMAGE}:${TAG} > trivy-report.txt 2>&1")
          echo readFile('trivy-report.txt')

          // 2) Portail qualité : échec s'il reste une vulnérabilité CRITICAL corrigeable
          int gate = run("${trivy} --severity CRITICAL --ignore-unfixed --exit-code 1 --quiet ${IMAGE}:${TAG}", true)
          if (gate != 0) {
            error('Trivy : vulnérabilité CRITICAL corrigeable trouvée dans l\'image')
          }
        }
      }
    }

    stage('Push vers Docker Hub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
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

    // Optionnel : déclenche directement le job de déploiement (sinon webhook sur deployment-cd)
    // stage('Déclencher le CD') {
    //   steps {
    //     build job: 'deployment-cd', wait: false, propagate: false
    //   }
    // }
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