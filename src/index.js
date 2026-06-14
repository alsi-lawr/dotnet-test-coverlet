const core = require("@actions/core");
const exec = require("@actions/exec");
const fs = require("fs");
const path = require("path");
const script = require("./script");

function getProjectDirectory(project) {
  return project.endsWith(".csproj") ? path.dirname(project) : project;
}

function usesMicrosoftTestingPlatformDotnetTest(workspace) {
  try {
    const globalJsonPath = path.join(workspace, "global.json");
    const globalJson = JSON.parse(fs.readFileSync(globalJsonPath, "utf8"));

    return globalJson?.test?.runner === "Microsoft.Testing.Platform";
  } catch {
    return false;
  }
}

async function run() {
  try {
    // Get inputs
    const project = core.getInput("project");
    const excludeFiles = core.getInput("exclude-files");
    const excludeModules = core.getInput("exclude-modules");
    const threshold = core.getInput("threshold");
    const dotnetVersion = core.getInput("dotnet-version");
    const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
    const projectDirectory = getProjectDirectory(project);
    const useMtpDotnetTest = usesMicrosoftTestingPlatformDotnetTest(workspace);

    // Define Docker image name
    const imageName = `mcr.microsoft.com/dotnet/sdk:${dotnetVersion}`;

    // Run the Docker container with the environment variables passed in
    // prettier-ignore
    await exec.exec('docker', [
      'run',
      '--rm',
      '-v', `${workspace}:/workspace`,
      '-v', './src/test.sh:/ci/test.sh',
      '-e', `UNIT_TEST_PROJECT=${project}`,
      '-e', `UNIT_TEST_EXCLUDE_FILES=${excludeFiles}`,
      '-e', `UNIT_TEST_EXCLUDE_MODULES=${excludeModules}`,
      '-e', `UNIT_TEST_COVERAGE_THRESHOLD=${threshold}`,
      '-e', `UNIT_TEST_USE_MTP_DOTNET_TEST=${useMtpDotnetTest}`,
      '-w', '/workspace',
      imageName,
      'bash', '-c', script
    ]);

    // Optionally, set an output for the action (e.g., path to coverage report)
    core.setOutput("coverage-report-path", `${projectDirectory}/report`);
  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

run();
