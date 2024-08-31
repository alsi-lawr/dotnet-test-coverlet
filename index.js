const core = require("@actions/core");
const exec = require("@actions/exec");

async function run() {
  try {
    // Get inputs
    const project = core.getInput("project");
    const excludeFiles = core.getInput("exclude-files");
    const excludeModules = core.getInput("exclude-modules");
    const threshold = core.getInput("threshold");
    const dotnetVersion = core.getInput("dotnet-version");
    const workspace = process.env.GITHUB_WORKSPACE;

    // Define Docker image name
    const imageName = `mcr.microsoft.com/dotnet/sdk:${dotnetVersion}`;

    // Run the Docker container with the environment variables passed in
    // prettier-ignore
    await exec.exec('docker', [
      'run',
      '--rm',
      '-v', `${workspace}:/workspace`,
      '-e', `UNIT_TEST_PROJECT=${project}`,
      '-e', `UNIT_TEST_EXCLUDE_FILES=${excludeFiles}`,
      '-e', `UNIT_TEST_EXCLUDE_MODULES=${excludeModules}`,
      '-e', `UNIT_TEST_COVERAGE_THRESHOLD=${threshold}`,
      '-w', '/workspace',
      imageName,
      'bash', '-c', `./src/test.sh ${project}`
    ]);

    // Optionally, set an output for the action (e.g., path to coverage report)
    core.setOutput("coverage-report-path", `${project}/report`);
  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

run();
