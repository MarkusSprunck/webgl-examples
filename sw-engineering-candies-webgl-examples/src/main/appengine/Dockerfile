FROM eclipse-temurin:21-jre

# Create app directory
WORKDIR /app

# Copy the WAR produced by Maven into the container (expect WAR to be placed next to Dockerfile)
COPY target/sw-engineering-candies-webgl-examples.war /app/app.war

# Use Jetty Runner (standalone) to run the WAR
ENV JETTY_VERSION=9.4.50.v20221201
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/* \
    && curl -fSL "https://repo1.maven.org/maven2/org/eclipse/jetty/jetty-runner/${JETTY_VERSION}/jetty-runner-${JETTY_VERSION}.jar" -o /app/jetty-runner.jar

EXPOSE 8080
CMD ["sh", "-c", "exec java -jar /app/jetty-runner.jar --port 8080 /app/app.war"]
